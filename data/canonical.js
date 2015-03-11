/*
 *  Created by Martin Giger
 *
 *  This Source Code Form is subject to the terms of the Mozilla Public License,
 *  v. 2.0. If a copy of the MPL was not distributed with this file, You can
 *  obtain one at http://mozilla.org/MPL/2.0/.
 *
 *  Content Script looking for a possible canonical URL of the page
 */

let link = document.querySelector("link[rel='canonical']");

if(link)
    self.port.emit("done", link.href);
else
    self.port.emit("done", null);

