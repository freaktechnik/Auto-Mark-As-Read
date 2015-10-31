/**
 * Resolve redirects from FeedBurner and thelike
 * @author Martin Giger
 * @license MPL-2.0
 * @module resolve
 */

const { defer, resolve: resolvedPromise } = require("sdk/core/promise");
const { memoize } = require("sdk/lang/functional");
const { Request } = require("sdk/request");
const self = require("sdk/self");
const qs = require("sdk/querystring");

const REDIRECT_URLS = ["http://feedproxy.google"];

const LONGURL_USERAGENT = self.name+"/"+self.version;
const headers = {
    "User-Agent": LONGURL_USERAGENT
};
const LONGURL_API_BASE = "http://api.longurl.org/v2/";

const getServices = () => {
    let { promise, resolve, reject } = defer();

    Request({
        url: LONGURL_API_BASE + "services&format=json",
        headers,
        onComplete: (data) => {
            if(data.status < 300 && data.status !== 0) {
                let services = REDIRECT_URLS.slice();
                for(var s in data.json) {
                    services.push(s);
                }
                resolve(services);
            }
            else {
                reject(data);
            }
        }
    }).get();

    return promise;
};

let services;
getServices().then((s) => services = s);

const resolve = memoize(function(url) {
    let { promise, resolve, reject } = defer();

    Request({
        url: LONGURL_API_BASE + "expand?format=json&rel-canonical=1&url="+qs.escape(url),
        headers,
        onComplete: (data) => {
            if(data.status < 300 && data.status !== 0) {
                if("rel-canonical" in data.json) {
                    resolve(data.json["rel-canonical"]);
                }
                else {
                    resolve(data.json["long-url"]);
                }
            }
            else {
                reject(data);
            }
        }
    }).get();

    return promise;
});
exports.resolve = resolve;

exports.resolveURLIfNeeded = function(url) {
    if(services.some((u) => url.includes(u))) {
        return resolve(url);
    }
    else {
        return resolvedPromise(url);
    }
};

