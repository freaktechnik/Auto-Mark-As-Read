/*
 *  Created by Martin Giger
 *
 *  This Source Code Form is subject to the terms of the Mozilla Public License,
 *  v. 2.0. If a copy of the MPL was not distributed with this file, You can
 *  obtain one at http://mozilla.org/MPL/2.0/.
 *
 *  Drop-in replacement for sdk/request to post JSON data to a server
 */

const { XMLHttpRequest } = require("sdk/net/xhr"),
      { defer } = require("sdk/core/promise");

const FEEDPROXY_GOOGLE = "http://feedproxy.google";

exports.resolve = function(url) {
    let d = defer(), xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.onreadystatechange = () => {
        d.resolve(xhr.responseURL);
    };
    xhr.send();

    return d.promise;
};

exports.resolveURLIfNeeded = function(url) {
    if(url.contains(FEEDPROXY_GOOGLE) {
        return this.resolve(url);
    }
    else {
        let d = defer();
        d.resolve(url);
        return d.promise;
    }    
};

