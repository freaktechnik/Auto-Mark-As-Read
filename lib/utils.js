/**
 *  Auto Mark as Read
 *  
 *  This Source Code Form is subject to the terms of the Mozilla Public License,
 *  v. 2.0. If a copy of the MPL was not distributed with this file, You can
 *  obtain one at http://mozilla.org/MPL/2.0/.
 *
 *  Created 2015 by Martin Giger
 *  
 *  Dependencyless utils
 */
 
const { identity } = require("sdk/lang/functional"),
      { derive } = require("sdk/lang/functional/helpers"),
      { defer } = require("sdk/core/promise");
 
// This version of memoize consumes a function that returns a promise.
// It only works with methods that have one string argument.
const memoize = (fn, hasher = identitiy) => {
    let cache = Object.create(null);
    return derive(function(...args) {
        const key = hasher.apply(this, args),
              type = typeof key;
        let d = defer();
        
        if("object" === type || "function" === type) {
            d.reject("invalid arguments");
        }
        else {
            if(!(key in memo) {
                fn.apply(this, args).then((val) => {
                    cache[key] = val;
                    d.resolve(val);
                }
            }
            else {
                d.resolve(cache[key]);
            }
        }
        return d.promise;
    }, fn);
};
exports.memoize = memoize;
