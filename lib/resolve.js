/*
 *  Created by Martin Giger
 *
 *  This Source Code Form is subject to the terms of the Mozilla Public License,
 *  v. 2.0. If a copy of the MPL was not distributed with this file, You can
 *  obtain one at http://mozilla.org/MPL/2.0/.
 *
 *  Resolve redirects from FeedBurner and thelike
 */

const { XMLHttpRequest } = require("sdk/net/xhr"),
      { defer, resolve: resolvedPromise } = require("sdk/core/promise");

const { memoize } = require("sdk/lang/functional");

//TODO longurl.org?
//TODO add more known redirects used in feeds
const REDIRECT_URLS = ["http://feedproxy.google"];

const resolve = memoize(function(url) {
    let d = defer(), xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.onreadystatechange = () => {
        d.resolve(xhr.responseURL);
    };
    xhr.send();

    return d.promise;
});
exports.resolve = resolve;

exports.resolveURLIfNeeded = function(url) {
    if(REDIRECT_URLS.some((u) => url.includes(u))) {
        return resolve(url);
    }
    else {
        return resolvedPromise(url);
    }
};

