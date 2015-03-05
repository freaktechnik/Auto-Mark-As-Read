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

//TODO Refresh subs?
//TODO Mark as read after scrolling through the whole page / after a time set in the settings
//TODO Undo mark as read button (toast with undo on android)?
 
// SDK includes
var self = require("sdk/self"),
    sp = require("sdk/simple-prefs"),
    tabs = require("sdk/tabs"),
    { defer } = require("sdk/core/promise");

// Own Modules
var feedly = require("./feedly");

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

var hasBeenInited = false;
function init() {
    if(sp.prefs.state) {
        var subs;
        feedly.getSubscribedSites().then((s) => { subs = s; });

        if(!hasBeenInited) {
            tabs.on("ready", function(tab) {
                if(sp.prefs.state) {
                    var site;
                    if((site = Object.keys(subs).find((s) => tab.url.contains(s)))) {
                        getCanonicalIfAvailable(tab).then((url) => {
                            if(!url)
                                url = tab.url;
                            return feedly.isSiteUnreadArticle(url, subs[site]);
                        }).then(feedly.markArticleAsRead);
                    }
                }
            });
            hasBeenInited = true;
        }
    }
}

sp.on("logout", function() {
    if(sp.prefs.state) {
        feedly.logout().then(() => { sp.prefs.state = false; });
    }
    else {
        feedly.authenticate().then(() => { sp.prefs.state = true; init(); }); 
    }
});

ensureAuthenticated().then(init);

