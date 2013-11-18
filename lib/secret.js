/**
 *  Auto Mark as Read
 *  
 *  Licensed under the GPLv3 (http://www.gnu.org/licenses/gpl-3.0.html) license
 *  Created 2013 by Martin Giger
 *  
 *  API settings
 */

// Local imports
var prefs = require('./config');

exports.set = function() {
    prefs.setPreference('feedly.clientId','');
    prefs.setPreference('feedly.clientSecret','');
}
