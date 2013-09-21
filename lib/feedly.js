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

// Local imports
var prefs = require('./config');

// Globals
var apiBaseUrl = 'http://sandbox.feedly.com';
var callbackURI = 'http://auto-mark-as-read.local';
var clientId = prefs.getPreference('feedly.clientId');

// Exported Functions
exports.authenticate = function() {
    tabs.open({
        url: apiBaseUrl+'/v3/auth/auth?response_type=&client_id='+clientId+'redirect_uri='+callbackURI,
        onReady: function(tab) {
            if(tab.url.match(RegExp('^'+callbackURI.replace('/','\/')))) {
                // store stuff
            }
        }
    });
};
