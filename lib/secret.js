/**
 *  Auto Mark as Read
 *  
 *  This Source Code Form is subject to the terms of the Mozilla Public License,
 *  v. 2.0. If a copy of the MPL was not distributed with this file, You can
 *  obtain one at http://mozilla.org/MPL/2.0/.
 *  Created 2015 by Martin Giger
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

