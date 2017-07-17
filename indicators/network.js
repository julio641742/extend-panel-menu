/*
    This file is part of Extend Panel Menu

    Extend Panel Menu is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Extend Panel Menu is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Extend Panel Menu.  If not, see <http://www.gnu.org/licenses/>.

    Copyright 2017 Julio Galvan
*/

const St = imports.gi.St;
const Lang = imports.lang;
const GLib = imports.gi.GLib;
const Main = imports.ui.main;
const Clutter = imports.gi.Clutter;
const Config = imports.misc.config;
const PopupMenu = imports.ui.popupMenu;
const Gettext = imports.gettext.domain("extend-panel-menu");
const _ = Gettext.gettext;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const CustomButton = Extension.imports.indicators.button.CustomButton;

const NetworkIndicator = new Lang.Class({
    Name: "NetworkIndicator",
    Extends: CustomButton,

    _init: function () {
        this.parent("NetworkIndicator");
        this.menu.actor.add_style_class_name("aggregate-menu");

        this._network = null;
        this._bluetooth = null;
        this._rfkill = Main.panel.statusArea.aggregateMenu._rfkill;

        if (Config.HAVE_NETWORKMANAGER) {
            this._network = Main.panel.statusArea.aggregateMenu._network;
        }
        if (Config.HAVE_BLUETOOTH) {
            this._bluetooth = Main.panel.statusArea.aggregateMenu._bluetooth;
        }

        this._location = Main.panel.statusArea.aggregateMenu._location;

        Main.panel.statusArea.aggregateMenu._indicators.remove_actor(this._location.indicators);
        this.box.add_child(this._location.indicators);

        if (this._network) {
            this._emptySpace = new St.Label({
                text: '    ',
                y_align: Clutter.ActorAlign.CENTER,
                visible: this._network._vpnIndicator.visible,
            });
            this._network.indicators.remove_actor(this._network._primaryIndicator);
            this._network.indicators.remove_actor(this._network._vpnIndicator);
            this.box.add_child(this._network._primaryIndicator);
            this.box.add_child(this._emptySpace);
            this.box.add_child(this._network._vpnIndicator);
            this._vsignal = this._network._vpnIndicator.connect('notify::visible', Lang.bind(this, function (obj) {
                this._emptySpace.visible = obj.visible;
            }));
        }
        if (this._bluetooth) {
            this._emptySpace1 = new St.Label({
                text: '    ',
                y_align: Clutter.ActorAlign.CENTER,
                visible: this._bluetooth._indicator.visible,
            });
            this._bluetooth.indicators.remove_actor(this._bluetooth._indicator);
            this.box.add_child(this._emptySpace1);
            this.box.add_child(this._bluetooth._indicator);
            this._bsignal = this._bluetooth._indicator.connect('notify::visible', Lang.bind(this, function (obj) {
                this._emptySpace1.visible = obj.visible;
            }));
        }

        this._rfkill.indicators.remove_actor(this._rfkill._indicator);
        this.box.add_child(this._rfkill._indicator);

        this._arrowIcon = new St.Icon({
            icon_name: "go-bottom-symbolic",
            style_class: "system-status-icon"
        });
        this.box.add_child(this._arrowIcon);

        if (this._network) {
            Main.panel.statusArea.aggregateMenu.menu.box.remove_actor(this._network.menu.actor);
            this.menu.addMenuItem(this._network.menu);
        }
        if (this._bluetooth) {
            Main.panel.statusArea.aggregateMenu.menu.box.remove_actor(this._bluetooth.menu.actor);
            this.menu.addMenuItem(this._bluetooth.menu);
        }

        Main.panel.statusArea.aggregateMenu.menu.box.remove_actor(this._location.menu.actor);
        this.menu.box.add_actor(this._location.menu.actor);

        Main.panel.statusArea.aggregateMenu.menu.box.remove_actor(this._rfkill.menu.actor);
        this.menu.addMenuItem(this._rfkill.menu);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        let network = new PopupMenu.PopupMenuItem(_("Network Settings"));
        network.connect("activate", Lang.bind(this, this._openApp, "gnome-network-panel.desktop"));
        this.menu.addMenuItem(network);

        this._rfkill._manager._proxy.connect("g-properties-changed", Lang.bind(this, this._sync));
        if (this._network) {
            this._network._primaryIndicator.connect("notify", Lang.bind(this, this._sync))
        }
        if (this._bluetooth) {
            this._bluetooth._proxy.connect("g-properties-changed", Lang.bind(this, this._sync));
        }
        this._sync();

        this._rfkill._sync();
        if (this._bluetooth) {
            this._bluetooth._sync();
        }
    },
    _sync: function () {
        this._arrowIcon.hide();
        if (this.box.get_width() == 0) {
            this._arrowIcon.show();
        }
    },
    destroy: function () {
        this._network._vpnIndicator.disconnect(this._vsignal);
        this._bluetooth._indicator.disconnect(this._bsignal);
        this.box.remove_child(this._location.indicators);
        this.menu.box.remove_actor(this._location.menu.actor);
        Main.panel.statusArea.aggregateMenu._indicators.add_actor(this._location.indicators);
        Main.panel.statusArea.aggregateMenu.menu.box.add_actor(this._location.menu.actor);
        this.box.remove_child(this._rfkill._indicator);
        this.menu.box.remove_actor(this._rfkill.menu.actor);
        this._rfkill.indicators.add_actor(this._rfkill._indicator);
        Main.panel.statusArea.aggregateMenu.menu.box.add_actor(this._rfkill.menu.actor);
        this.box.remove_child(this._network._primaryIndicator);
        this.box.remove_child(this._network._vpnIndicator);
        this.menu.box.remove_actor(this._network.menu.actor);
        this._network.indicators.add_actor(this._network._primaryIndicator);
        this._network.indicators.add_actor(this._network._vpnIndicator);
        Main.panel.statusArea.aggregateMenu.menu.box.add_actor(this._network.menu.actor);
        this.box.remove_child(this._bluetooth._indicator);
        this.menu.box.remove_actor(this._bluetooth.menu.actor);
        this._bluetooth.indicators.add_actor(this._bluetooth._indicator);
        Main.panel.statusArea.aggregateMenu.menu.box.add_actor(this._bluetooth.menu.actor);
        this.parent();
    },
});