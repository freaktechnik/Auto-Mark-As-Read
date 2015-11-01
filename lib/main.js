/**
 * Auto Mark as Read
 * Main Module
 * @author Martin Giger
 * @license MPL-2.0
 * @module main
 */

// SDK includes
var self = require("sdk/self"),
    sp = require("sdk/simple-prefs"),
    tabs = require("sdk/tabs"),
    { defer } = require("sdk/core/promise"),
    { throttle } = require("sdk/lang/functional"),
    { URL } = require("sdk/url"),
    { Task: { async } } = require("resource://gre/modules/Task.jsm");

// Own Modules
var feedly = require("./feedly"),
    { promiseTabTracker } = require("./tabtracker"),
    { read: showReadNotification, logout } = require("./toast");
const { getURL } = require("./tab-url");

const S_TO_MS_FACTOR = 1000;

// Private Methods

// Make sure we're logged in, if we should be (which is only on install).
function ensureAuthenticated() {
    let d = defer();
    if(!sp.prefs.state && self.loadReason == "install")
        feedly.authenticate().then(
            () => { sp.prefs.state = true; d.resolve(); },
            console.error
        );
    else
        d.resolve();
    return d.promise;
}

var hasBeenInited = false;

const syncSubs = throttle(
    () => feedly.getSubscribedSites(),
    sp.prefs.syncInterval * S_TO_MS_FACTOR
);

var tabListener = async(function*(tab) {
    if(sp.prefs.state) {
        let subs = yield syncSubs();

        // we need the site's url, so we can then find the correct feed for it
        var site = Object.keys(subs).find((s) => tab.url.includes(s));
        if(site) {
            var url = yield getURL(tab);
            var id = yield feedly.isSiteUnreadArticle(url, subs[site]);

            yield promiseTabTracker(tab);
            console.log("Marking article", tab.title, "as read");
            yield feedly.markArticleAsRead(id);
            if(sp.prefs.showToast) {
                //TODO what if this never resolves?
                yield showReadNotification(tab.title);
                feedly.undoMarkArticleAsRead(id);
            }
        }
    }
});

function init() {
    if(sp.prefs.state) {
        syncSubs();

        if(!hasBeenInited) {
            tabs.on("ready", tabListener);
            hasBeenInited = true;
        }
    }
}

sp.on("logout", function() {
    if(sp.prefs.state) {
        feedly.logout().then(() => { console.info("Logged out from feedly");
            sp.prefs.state = false;
            logout();
            tabs.off("ready", tabListener);
            hasBeenInited = false;
        });
    }
    else {
        feedly.authenticate().then(() => { console.info("Logged in to feedly");
            sp.prefs.state = true;
            init();
        }, (e) => console.error(e));
    }
});

// Make sure stuff gets initialized
ensureAuthenticated().then(init);

