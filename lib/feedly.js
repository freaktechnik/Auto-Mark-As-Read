/**
 *  Auto Mark as Read
 *  
 *  This Source Code Form is subject to the terms of the Mozilla Public License,
 *  v. 2.0. If a copy of the MPL was not distributed with this file, You can
 *  obtain one at http://mozilla.org/MPL/2.0/.
 *
 *  Created 2015 by Martin Giger
 *  
 *  Feedly API Module
 */

// SDK Imports
var tabs = require('sdk/tabs'),
    { prefs } = require('sdk/simple-prefs'),
    qs = require("sdk/querystring"),
    { Request } = require("sdk/request"),
    credentials = require("sdk/passwords"),
    { defer } = require("sdk/core/promise"),
    { setTimeout } = require("sdk/timers");

const secret = require('./secret');
var { JSONRequest } = require('./jsonrequest');

// Globals
const apiBaseUrl = 'https://sandbox.feedly.com',
      callbackURI = 'https://localhost/',
      credentialsRealm = "Feedly API Refresh Token";

let accessToken, id;

function refreshAccessToken() {
    let d = defer();
    credentials.search({
        realm: credentialsRealm,
        onComplete: function(creds) {
            creds.forEach((cred) => {
                id = cred.username;
                let req = Request({
                    url: apiBaseUrl + "/v3/auth/token",
                    content: {
                        refresh_token: cred.password,
                        client_id: secret.clientId,
                        client_secret: secret.clientSecret,
                        grant_type: "refresh_token"
                    },
                    onComplete: function(response) {
                        accessToken = response.json.access_token;
                        setTimeout(refreshAccessToken, response.json.expires_in * 1000);
                        d.resolve();
                    }
                });
                req.post();
            });
        }
    });
    return d.promise;
}


function ensureAccessToken() {
    if(!accessToken) {
        return refreshAccessToken();
    }
    else {
        let d = defer();
        d.resolve(true);
        return d.promise;
    }
}

function getTokensFromCode(code) {
    let d = defer(),
        req = Request({
        url: apiBaseUrl + "/v3/auth/token",
        content: {
            code: code,
            client_id: secret.clientId,
            client_secret: secret.clientSecret,
            redirect_uri: callbackURI,
            grant_type: "authorization_code"
        },
        onComplete: function(response) {
            let refreshToken = response.json.refresh_token;
            accessToken = response.json.access_token;
            id = response.json.id;

            // store the refresh token in the credentials manager
            credentials.store({
                realm: credentialsRealm,
                username: id,
                password: refreshToken,
                onComplete: () => { d.resolve(); }
            });

            // Schedule refreshing the access token
            setTimeout(refreshAccessToken, response.json.expires_in * 1000);
        }
    });
    req.post();
    return d.promise;
}

// Exported Functions
exports.authenticate = function() {
    let token, d = defer();
    tabs.open({
        url: apiBaseUrl + "/v3/auth/auth?" + qs.stringify({
            response_type: "code",
            client_id: secret.clientId,
            redirect_uri: callbackURI,
            scope: "https://cloud.feedly.com/subscriptions"
        }),
        onReady: function(tab) {
            if(tab.url.contains(callbackURI)) {
                getTokensFromCode(tab.url.match(/\?code=([^&]+)/)[1]).then(() => { d.resolve(true); });
                tab.close();
            }
        }
    });
    return d.promise;
};

exports.getSubscribedSites = function() {
    let d = defer(),
        getSubscriptions = () => {
            let req = Request({
                url: apiBaseUrl + "/v3/subscriptions",
                headers: {
                    "Authorization": "OAuth "+accessToken
                },
                onComplete: function(resp) {
                    if(resp.status == 200) {
                        // Make a map with url and feed id.
                        d.resolve(resp.json.reduce((obj, feed) => {
                            obj[feed.website] = feed.id;
                            return obj;
                        }, {}));
                    }
                }
            });
            req.get();
            return d.promise;
        };
    return ensureAccessToken().then(getSubscriptions);
};

function removeTrackingGarbage(url) {
    return url.replace(/(?:\?.*)(pk|utm)_[^&]+/, "");
}

exports.isSiteUnreadArticle = function(url, id) {
    let d = defer(),
        check = () => {
            let req = Request({
                url: apiBaseUrl + "/v3/streams/contents",
                headers: {
                    "Authorization": "OAuth "+accessToken
                },
                content: {
                    streamId: id,
                    unreadOnly: true
                },
                onComplete: function(resp) {
                    var art;
                    // Check if there is an article with the site's url and remember it
                    if((art = resp.json.items.find((article) => {
                        console.log(removeTrackingGarbage(article.alternate[0].href)+" == "+url);
                        return removeTrackingGarbage(article.alternate[0].href) == url;
                    })))
                        d.resolve(art.id);
                }
            });
            req.get();
            return d.promise;
        };
    return ensureAccessToken().then(check);
};

exports.markArticleAsRead = function(id) {
    let d = defer(),
        markAsRead = () => {
            console.info("Marking article "+id+" as read");
            let req = JSONRequest({
                url: apiBaseUrl + "/v3/markers",
                headers: {
                    Authorization: "OAuth "+accessToken
                },
                contentType: "application/json",
                content: {
                    type: "entries", 
                    action: "markAsRead",
                    entryIds: [ id ]
                },
                onComplete: function(resp) {
                    d.resolve(resp.status == 200);
                }
            });
            req.post();
            return d.promise;
        };
    if(id) {
        return ensureAccessToken().then(markAsRead);
    }
    else {
        d.resolve(false);
        return d.promise;
    }
};

exports.undoMarkArticleAsRead = function(id) {
    let d = defer(),
        undoMarkAsRead = () => {
            console.info("Reverting "+id+" to unread");
            let req = JSONRequest({
                url: apiBaseUrl + "/v3/markers",
                headers: {
                    Authorization: "OAuth "+accessToken
                },
                contentType: "application/json",
                content: {
                    type: "entries",
                    action: "keepUnread",
                    entryIds: [ id ]
                },
                onComplete: function(resp) {
                    d.resolve(resp.status == 200);
                }
            });
            req.post();
            return d.promise();
        };
    return ensureAccessToken().then(undoMarkAsRead);
};

exports.logout = function() {
    let d = defer();
    credentials.search({
        realm: credentialsRealm,
        onComplete: function(creds) {
            creds.forEach((cred) => {
                let req = Request({
                    url: apiBaseUrl + "/v3/auth/token",
                    content: {
                        refresh_token: cred.password,
                        client_id: secret.clientId,
                        client_secret: secret.clientSecret,
                        grant_type: "revoke_token"
                    },
                    onComplete: () => { accessToken = ""; d.resolve(); credentials.remove(cred); }
                });
                req.post();
            });
        }
    });
    return d.promise;
};

