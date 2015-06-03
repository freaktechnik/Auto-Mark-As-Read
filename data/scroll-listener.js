/*
 *  Created by Martin Giger
 *
 *  This Source Code Form is subject to the terms of the Mozilla Public License,
 *  v. 2.0. If a copy of the MPL was not distributed with this file, You can
 *  obtain one at http://mozilla.org/MPL/2.0/.
 *
 *  Report if tab is scrolled to the bottom
 */

let listener = function() {
    if(document.body.scrollHeight - (window.scrollY + window.innerHeight) <= self.options.delta)
        self.port.emit("scrollDone");
};

document.addEventListener("scroll", listener, false);

self.port.once("detach", () => {
    document.removeEventListener("scroll", listener);
});

