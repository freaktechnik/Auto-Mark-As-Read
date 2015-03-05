/**
 *  Auto Mark as Read
 *  
 *  Licensed under the GPLv3 (http://www.gnu.org/licenses/gpl-3.0.html) license
 *  Created 2013 by Martin Giger
 *  
 *  Main Module
 */
 
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

