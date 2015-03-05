/*
 *  Created by Martin Giger
 *
 *  This Source Code Form is subject to the terms of the Mozilla Public License,
 *  v. 2.0. If a copy of the MPL was not distributed with this file, You can
 *  obtain one at http://mozilla.org/MPL/2.0/.
 *
 *  Drop-in replacement for sdk/request to post JSON data to a server
 */

var { XMLHttpRequest } = require("sdk/net/xhr");

exports.JSONRequest = function(options) {
    if(options.contentType != "application/json")
        throw new Error("This module can only send JSON data");
    var xhr = new XMLHttpRequest();
    return {
        post: function() {
            xhr.open("POST", options.url);
            xhr.setRequestHeader("Content-Type", "application/json");
            Object.keys(options.headers).forEach(function(header) {
                xhr.setRequestHeader(header, options.headers[header]);
            });
            xhr.onreadystatechange = function onreadystatechange() {
                if (xhr.readyState === 4) {
                  options.onComplete({status: xhr.status});
                }
            };
            xhr.send(JSON.stringify(options.content));
        }
    }
};

