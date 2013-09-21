/**
 *  Auto Mark as Read
 *  
 *  Licensed under the GPLv3 (http://www.gnu.org/licenses/gpl-3.0.html) license
 *  Created 2013 by Martin Giger
 *  
 *  Main Module
 */
 
 // SDK includes
 var self = require("sdk/self");
 
 // Own Modules
 var feedly = require("./feedly");
 
 // Public Methods
 
 exports.main = function() {
    if(self.loadReason == "install") {
        feedly.authenticate();
    }
 };
 
 // Private Methods
 