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

//TODO some kind of auth success page

// SDK Imports
const tabs = require('sdk/tabs'),
    { prefs } = require('sdk/simple-prefs'),
    qs = require("sdk/querystring"),
    { Request } = require("sdk/request"),
    credentials = require("sdk/passwords"),
    { defer, race, resolve } = require("sdk/core/promise"),
    { setTimeout } = require("sdk/timers"),
    self = require("sdk/self");

const secret = require('./secret'),
      { resolveURLIfNeeded } = require("./resolve");
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
        url: self.uri
        onComplete: function(creds) {
            race(creds.map((cred) => {
                let p = defer();
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
                        if(!response.json || !response.json.access_token) {
                            p.reject();
                        }
                        else {
                            accessToken = response.json.access_token;
                            setTimeout(refreshAccessToken, response.json.expires_in * 1000);
                            p.resolve();
                        }
                    }
                });
                req.post();
                return p.promise;
            })).then(() => d.resolve(), (e) => d.reject(e));
        }
    });
    return d.promise;
}


function ensureAccessToken() {
    if(!accessToken) {
        return refreshAccessToken();
    }
    else {
        return resolve(true);
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
            if(response.json && response.json.id) {
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
            else {
                d.reject("Getting Access Token failed. This happens most likely due to outdated application API credentials");
            }
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
                getTokensFromCode(tab.url.match(/\?code=([^&]+)/)[1]).then(() => { d.resolve(true); }, (e) => { d.reject(e); });
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
                    else {
                        d.reject();
                    }
                }
            });
            req.get();
            return d.promise;
        };
    return ensureAccessToken().then(getSubscriptions);
};

function removeTrackingGarbage(url) {
    if(url.indexOf("?") == -1)
        return url;
    else
        return url.replace(/(pk|utm)_[^&]+&?/g, "").replace(/(&|\?)$/,"");
}

exports.isSiteUnreadArticle = function(url, id) {
    url = removeTrackingGarbage(url);
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
                onComplete: (resp) => {
                    if(!resp.json || !("items" in resp.json)) {
                        d.reject();
                    }
                    else {
                        // Check if there is an article with the site's url and remember it
                        let checkURL = (article) => {
                            let p = defer();
                            return resolveURLIfNeeded(removeTrackingGarbage(article.alternate[0].href)).then((resolvedURL) => {
                                console.log(resolvedURL+" == "+url);
                                if(resolvedURL == url)
                                    return article.id;
                            });
                        };
                        // Does this leak if none of the promises ever resolves? Let's just trust the browser not to.
                        d.resolve(race(resp.json.items.map(checkURL)));
                    }
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
            return d.promise;
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
                    onComplete: (resp) => {
                        if(resp.status == 200) {
                            accessToken = "";
                            d.resolve();
                            credentials.remove(cred);
                        }
                        else {
                            d.reject();
                        }
                    }
                });
                req.post();
            });
        }
    });
    return d.promise;
};

