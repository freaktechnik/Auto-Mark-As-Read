/*
 *  Created by Martin Giger
 *
 *  This Source Code Form is subject to the terms of the Mozilla Public License,
 *  v. 2.0. If a copy of the MPL was not distributed with this file, You can
 *  obtain one at http://mozilla.org/MPL/2.0/.
 *
 *  Tab tracker
 */

const { Class } = require("sdk/core/heritage"),
      { Disposable } = require("sdk/core/disposable"),
      { EventTarget } = require("sdk/event/target"),
      { emit, setListeners, off } = require("sdk/event/core"),
      { prefs } = require("sdk/simple-prefs"),
      { setTimeout, clearTimeout } = require("sdk/timers"),
      tabs = require("sdk/tabs"),
      { browserWindows: windows } = require("sdk/windows");

let views = new WeakMap(),
    models = new WeakMap();

let viewFor = (tracker) => views.get(tracker),
    modelFor = (tracker) => models.get(tracker);

const TabTracker = Class({
    extends: EventTarget,
    implements: [
        Disposable
    ],
    setup: function(options) {
        views.set(this, options.tab);

        models.set(this, {
            startTime: Date.now(),
            remaining: prefs.waitTime,
            timeout: false,
            listeners: {},
            worker: null
        });

        setListeners(this, options);

        this.startTracking();

        let target = this;

        modelFor(this).listeners.dispose = this.dispose.bind(this);
        modelFor(this).listeners.stop = this.stopTracking.bind(this);
        modelFor(this).listeners.start = this.startTracking.bind(this);
        modelFor(this).listeners.stopWindow = (win) => {
            if(viewFor(target).window == win)
                target.stopTracking();
        };
        modelFor(this).listeners.startWindow = (win) => {
            if(tabs.activeTab.id == viewFor(target).id && viewFor(target).window == win)
                target.startTracking();
        };
        
        viewFor(this).on("close", modelFor(this).listeners.dispose);
        viewFor(this).on("ready", modelFor(this).listeners.dispose);
        viewFor(this).on("deactivate", modelFor(this).listeners.stop);
        viewFor(this).on("activate", modelFor(this).listeners.start);

        windows.on("deactivate", modelFor(this).listeners.stopWindow);
        windows.on("close", modelFor(this).listeners.stopWindow);
        windows.on("activate", modelFor(this).listeners.startWindow);
        
        modelFor(this).worker = viewFor(this).attach({
            contentScriptFile: "./scroll-listener.js",
            contentScriptOptions: {
                delta: 100
            }
        });

        modelFor(this).listeners.scroll = () => {
            emit(target, "done");
            target.destroy();
        };

        modelFor(this).worker.port.on("scrollDone", modelFor(this).listeners.scroll);
    },
    startTracking: function() {
        if(!modelFor(this).timeout) {
            console.log(modelFor(this).remaining);
            let target = this;
            modelFor(this).timeout = setTimeout(function() {
                console.log("done");
                emit(target, "done");
                target.destroy();
            }, modelFor(this).remaining * 1000);
        }
    },
    stopTracking: function() {
        if(modelFor(this).timeout) {
            modelFor(this).remaining -= (Date.now() - modelFor(this).startTime) / 1000;
            clearTimeout(modelFor(this).timeout);
            modelFor(this).timeout = false;
        }
    },
    dispose: function() {
        if(modelFor(this).timeout)
            clearTimeout(modelFor(this).timeout);

        off(viewFor(this), "close", modelFor(this).listeners.dispose);
        off(viewFor(this), "ready", modelFor(this).listeners.dispose);
        off(viewFor(this), "deactivate", modelFor(this).listeners.stop);
        off(viewFor(this), "activate", modelFor(this).listeners.start);

        off(windows, "deactivate", modelFor(this).listeners.stopWindow);
        off(windows, "close", modelFor(this).listeners.stopWindow);
        off(windows, "activate", modelFor(this).listeners.startWindow);

        try {
            modelFor(this).worker.port.off("scrollDone", modelFor(this).listeners.scroll);
            modelFor(this).worker.port.emit("detach");
        }
        catch(e) {
            // tab has been closed and worker was destroyed, ohwell
        }

        modelFor(this).worker.destroy();
        
        views.delete(this);
        models.delete(this);
    }
});

exports.TabTracker = TabTracker;

