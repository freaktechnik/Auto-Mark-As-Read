/**
 *  Auto Mark as Read
 *  
 *  This Source Code Form is subject to the terms of the Mozilla Public License,
 *  v. 2.0. If a copy of the MPL was not distributed with this file, You can
 *  obtain one at http://mozilla.org/MPL/2.0/.
 *
 *  Created 2015 by Martin Giger
 *  
 *  Main Module
 */
 
// SDK includes
var self = require("sdk/self"),
    sp = require("sdk/simple-prefs"),
    tabs = require("sdk/tabs"),
    { defer } = require("sdk/core/promise"),
    { debounce } = require("sdk/lang/functional"),
    { URL } = require("sdk/url"),
    qs = require("sdk/querystring");

// Own Modules
var feedly = require("./feedly"),
    { promiseTabTracker } = require("./tabtracker"),
    { read: showReadNotification, logout } = require("./toast");

const S_TO_MS_FACTOR = 1000;

// Private Methods

// Try to extract the canonical URL from a tab's document
function getCanonicalIfAvailable(tab) {
    let d = defer(),
        worker = tab.attach({
        contentScriptFile: "./canonical.js"
    });
    worker.port.on("done", function(url) {
        d.resolve(url);
        worker.destroy();
    });
    return d.promise;
}

// Extracts the url of the article, if the URL is an about:reader displaying an article.
function extractURLFromReader(url) {
    if(url.startsWith("about:reader?")) {
        url = qs.parse(URL(url).search.slice(1)).url;
    }
    return url;
}

// Tries to extract the canonical, else uses the tab's URL and extracts it from the reader if needed.
function getURL(tab) {
    return getCanonicalIfAvailable(tab).then((url = tab.url) => extractURLFromReader(url));
}

// Make sure we're logged in, if we should be (which is only on install).
function ensureAuthenticated() {
    let d = defer();
    if(!sp.prefs.state && self.loadReason == "install")
        feedly.authenticate().then(() => { sp.prefs.state = true; d.resolve(); },
        (e) => console.error(e));
    else
        d.resolve();
    return d.promise;
}

var hasBeenInited = false, subs;

const syncSubs = debounce(() => {
    feedly.getSubscribedSites().then((s) => { subs = s; });
}, sp.prefs.syncInterval * S_TO_MS_FACTOR);

var tabListener = (tab) => {
    if(sp.prefs.state) {
        syncSubs();

        // we need the site's url, so we can then find the correct feed for it
        var site = Object.keys(subs).find((s) => tab.url.contains(s));
        if(site) {
            // Let's start the promise chain of ddddddoooooooooooomm
            getURL(tab)
              .then((url) => feedly.isSiteUnreadArticle(url, subs[site]))
              .then((id) => {
                return promiseTabTracker(tab)
                    .then(() => feedly.markArticleAsRead(id))
                    .then(() => {
                        if(sp.prefs.showToast)
                            return tab.title;
                        else
                            throw "Not showing a notification";
                    })
                    .then(showReadNotification)
                    .then(() => feedly.undoMarkArticleAsRead(id));
            });
        }
    }
};

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

