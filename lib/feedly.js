/**
 *  Auto Mark as Read
 *  
 *  Licensed under the GPLv3 (http://www.gnu.org/licenses/gpl-3.0.html) license
 *  Created 2013 by Martin Giger
 *  
 *  Feedly API Module
 */

// SDK Imports
var tabs = require('sdk/tabs');
var {OAuthConsumer} = require('oauthorizer/oauthconsumer');

// Local imports
var prefs = require('./config');

prefs.setPreference('feedly.clientId','sandbox');
// Globals
var apiBaseUrl = 'http://sandbox.feedly.com';
var callbackURI = 'urn:ietf:wg:oauth:2.0:oob';
var clientID = prefs.getPreference('feedly.clientId');
var clientSecret = prefs.getPreference('feedly.clientSecret');

var calls = {
  userAuthorizationURL: apiBaseUrl + "/v3/auth/auth",
  accessTokenURL: apiBaseUrl + "/v3/auth/token"
};
var feedlyProvider = OAuthConsumer.makeProvider('feedly', 'Feedly',
                                      clientID, clientSecret,
                                      callbackURI, calls);
feedlyProvider.version = "2.0";
//feedlyProvider.tokenRx = /\?code=([^&]*)/gi;

feedlyProvider.requestParams = {
   'response_type': 'code',
   'scope': 'https://cloud.feedly.com/subscriptions'
};

// Exported Functions
exports.authenticate = function() {
    function testCallback(svc) {
        
    }
    var handler = OAuthConsumer.getAuthorizer(feedlyProvider, testCallback);
    handler.startAuthentication();
};
