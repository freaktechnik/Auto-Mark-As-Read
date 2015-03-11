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

//TODO Undo mark as read button and marked as read notification (toast with undo on android, desktop??)
 
// SDK includes
var self = require("sdk/self"),
    sp = require("sdk/simple-prefs"),
    tabs = require("sdk/tabs"),
    { defer } = require("sdk/core/promise"),
    { debounce } = require("sdk/lang/functional");

// Own Modules
var feedly = require("./feedly"),
    { promiseTabTracker } = require("./tabtracker"),
    { read: showReadNotification, logout } = require("./toast"),
    { resolveURLIfNeeded } = require("./resolve");

// Private Methods

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

function ensureAuthenticated() {
    let d = defer();
    if(!sp.prefs.state && self.loadReason == "install")
        feedly.authenticate().then(() => { sp.prefs.state = true; d.resolve(); });
    else
        d.resolve();
    return d.promise;
}

const syncSubs = debounce(() => {
    feedly.getSubscribedSites().then((s) => { subs = s; });
}, sp.prefs.syncInterval);

var hasBeenInited = false, subs;
function init() {
    if(sp.prefs.state) {
        syncSubs();

        if(!hasBeenInited) {
            tabs.on("ready", function(tab) {
                if(sp.prefs.state) {
                    syncSubs();
                    var site;
                    if((site = Object.keys(subs).find((s) => tab.url.contains(s)))) {
                        getCanonicalIfAvailable(tab)
                          .then((url = tab.url) => resolveURLIfNeeded(url))
                          .then((url) => feedly.isSiteUnreadArticle(url, subs[site]))
                          .then((id) => {
                            return promiseTabTracker(tab)
                                .then(() => feedly.markArticleAsRead(id))
                                .then(() => {
                                    if(sp.prefs.showToast)
                                        return showReadNotification(tab.title);
                                })
                                .then(() => feedly.undoMarkArticleAsRead(articleId));
                        });
                    }
                }
            });
            hasBeenInited = true;
        }
    }
}

sp.on("logout", function() {
    if(sp.prefs.state) {
        feedly.logout().then(() => { console.info("Logged out from feedly");
            sp.prefs.state = false;
            logout();
        });
    }
    else {
        feedly.authenticate().then(() => { console.info("Logged in to feedly");
            sp.prefs.state = true;
            init();
        }); 
    }
});

ensureAuthenticated().then(init);

