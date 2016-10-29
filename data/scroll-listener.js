/*
 *  Created by Martin Giger
 *
 *  This Source Code Form is subject to the terms of the Mozilla Public License,
 *  v. 2.0. If a copy of the MPL was not distributed with this file, You can
 *  obtain one at http://mozilla.org/MPL/2.0/.
 *
 *  Report if tab is scrolled to the bottom
 */

/* global self */

const listener = () => {
    browser.storage.local.get("delta").then((delta) => {
        if(document.body.scrollHeight - (window.scrollY + window.innerHeight) <= delta) {
            browser.runtime.sendMessage("scrollDone");
        }
    });
};

document.addEventListener("scroll", listener, false);

browser.runtime.onMessage.addListener((message) => {
    if(message === "detach") {
        document.removeEventListener("scroll", listener);
    }
});

