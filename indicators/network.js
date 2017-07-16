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
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const Lang = imports.lang;
const Config = imports.misc.config;
const GLib = imports.gi.GLib;
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
            Main.panel.statusArea.aggregateMenu._indicators.remove_actor(this._network.indicators);
            this.box.add_child(this._network.indicators);
        }
        if (this._bluetooth) {
            Main.panel.statusArea.aggregateMenu._indicators.remove_actor(this._bluetooth.indicators);
            this.box.add_child(this._bluetooth.indicators);
        }
        Main.panel.statusArea.aggregateMenu._indicators.remove_actor(this._rfkill.indicators);
        this.box.add_child(this._rfkill.indicators);
        this._arrowIcon = PopupMenu.arrowIcon(St.Side.BOTTOM);
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
        this.box.remove_child(this._location.indicators);
        this.menu.box.remove_actor(this._location.menu.actor);
        Main.panel.statusArea.aggregateMenu._indicators.add_actor(this._location.indicators);
        Main.panel.statusArea.aggregateMenu.menu.box.add_actor(this._location.menu.actor);
        this.box.remove_child(this._rfkill.indicators);
        this.menu.box.remove_actor(this._rfkill.menu.actor);
        Main.panel.statusArea.aggregateMenu._indicators.add_actor(this._rfkill.indicators);
        Main.panel.statusArea.aggregateMenu.menu.box.add_actor(this._rfkill.menu.actor);
        this.box.remove_child(this._network.indicators);
        this.menu.box.remove_actor(this._network.menu.actor);
        Main.panel.statusArea.aggregateMenu._indicators.add_actor(this._network.indicators);
        Main.panel.statusArea.aggregateMenu.menu.box.add_actor(this._network.menu.actor);
        this.box.remove_child(this._bluetooth.indicators);
        this.menu.box.remove_actor(this._bluetooth.menu.actor);
        Main.panel.statusArea.aggregateMenu._indicators.add_actor(this._bluetooth.indicators);
        Main.panel.statusArea.aggregateMenu.menu.box.add_actor(this._bluetooth.menu.actor);
        this.parent();
    },
});