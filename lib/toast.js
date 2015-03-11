/*
 *  Created by Martin Giger
 *
 *  This Source Code Form is subject to the terms of the Mozilla Public License,
 *  v. 2.0. If a copy of the MPL was not distributed with this file, You can
 *  obtain one at http://mozilla.org/MPL/2.0/.
 *
 *  Marked Article as Read Toasts
 */

const _ = require("sdk/l10n").get,
      { defer } = require("sdk/core/promise"),
      { notify } = require("sdk/notifications"),
      { getMostRecentBrowserWindow } = require("sdk/window/utils"),
      self = require("sdk/self");

const IS_DESKTOP = !require("sdk/system/xul-app").is("Fennec");

const Toast = {
    send: function(title) {
        console.info("Showing read notification");
        let d = defer();
        if(IS_DESKTOP) {
            notify({
                title: _("toast_read_long"),
                text: _("toast_action_long", title),
                iconURL: self.data.url("./ic_notification.png"),
                onClick: () => {
                    d.resolve(true);
                }
            });
        }
        else {
            let { NativeWindow } = getMostRecentBrowserWindow();
            NativeWindow.toast.send(_("toast_read_short"), "long", {
                button: {
                    label: _("toast_action_short"),
                    icon: self.data.url("./ic_action_undo.png"),
                    callback: () => {
                        d.resolve(true);
                    }
                }
            });
        }
        return d.promise;
    }
};
module.exports = Toast;

