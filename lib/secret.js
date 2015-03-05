/**
 *  Auto Mark as Read
 *  
 *  Licensed under the GPLv3 (http://www.gnu.org/licenses/gpl-3.0.html) license
 *  Created 2013 by Martin Giger
 *  
 *  API settings
 */

// imports
var { prefs } = require('sdk/simple-prefs');

const CLIENT_ID_PREF      = 'feedly_clientId',
       CLIENT_SECRET_PREF = 'feedly_clientSecret';

module.exports = {
    get clientId() {
        return prefs[CLIENT_ID_PREF];
    },
    get clientSecret() {
        return prefs[CLIENT_SECRET_PREF];
    }
};

