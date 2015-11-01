/**
 * Marked Article as Read Toasts
 * @author Martin Giger
 * @license MPL-2.0
 * @module toast
 */

const _ = require("sdk/l10n").get,
      { defer } = require("sdk/core/promise"),
      { notify } = require("sdk/notifications"),
      { getMostRecentBrowserWindow } = require("sdk/window/utils"),
      self = require("sdk/self");

const IS_DESKTOP = !require("sdk/system/xul-app").is("Fennec"),
       NOTIFICATION_ICON = self.data.url("./ic_notification.png"),
       UNDO_ICON = "drawable://undo_button_icon";

const Toast = {
    read: function(title) {
        console.info("Showing read notification");
        let d = defer();
        if(IS_DESKTOP) {
            notify({
                title: _("toast_read_long"),
                text: _("toast_action_long", title),
                iconURL: NOTIFICATION_ICON,
                onClick: () => {
                    d.resolve(true);
                }
            });
        }
        else {
            let { NativeWindow } = getMostRecentBrowserWindow();
            NativeWindow.toast.show(_("toast_read_short"), "long", {
                button: {
                    label: _("toast_action_short"),
                    icon: UNDO_ICON,
                    callback: () => {
                        d.resolve(true);
                    }
                }
            });
        }
        return d.promise;
    },
    logout: function() {
        console.info("Showing logout notification");
        if(IS_DESKTOP) {
            notify({
                title: _("toast_logout"),
                iconURL: NOTIFICATION_ICON
            });
        }
        else {
            let { NativeWindow } = getMostRecentBrowserWindow();
            NativeWindow.toast.show(_("toast_logout"), "short");
        }
    }
};
module.exports = Toast;

