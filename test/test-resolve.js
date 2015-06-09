/*
 *  Created by Martin Giger
 *
 *  This Source Code Form is subject to the terms of the Mozilla Public License,
 *  v. 2.0. If a copy of the MPL was not distributed with this file, You can
 *  obtain one at http://mozilla.org/MPL/2.0/.
 *
 *  Test resolve module
 */
 
const { resolve, resolveURLIfNeeded } = require("../lib/resolve");
const { Promise: sdkPromise } = require("sdk/core/promise");

const EXAMPLE_URL = "http://humanoids.be";
const FEEDBURNER_EXAMPLE_URL = "http://feedproxy.google.com/~androidpolice";

exports["test resolve signature"] = (assert) => {
    assert.equal(typeof resolve, "function");
    assert.ok(resolve(EXAMPLE_URL) instanceof sdkPromise);
};

exports["test resolveURLIfNeeded signature"] = (assert) => {
    assert.equal(typeof resolveURLIfNeeded, "function");
    assert.ok(resolveURLIfNeeded(EXAMPLE_URL) instanceof sdkPromise);
    assert.ok(resolveURLIfNeeded(FEEDBURNER_EXAMPLE_URL) instanceof sdkPromise);
};

require("sdk/test").run(exports);
