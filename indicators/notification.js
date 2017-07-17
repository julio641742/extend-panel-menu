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
const Lang = imports.lang;
const Gtk = imports.gi.Gtk;
const Gettext = imports.gettext.domain("extend-panel-menu");
const _ = Gettext.gettext;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const CustomButton = Extension.imports.indicators.button.CustomButton;

const NotificationIndicator = new Lang.Class({
    Name: "NotificationIndicator",
    Extends: CustomButton,

    _init: function () {
        this.parent("NotificationIndicator");
        Gtk.IconTheme.get_default().append_search_path(Extension.dir.get_child('icons').get_path());

        this._messageList = Main.panel.statusArea.dateMenu._messageList;

        this._messageListParent = this._messageList.actor.get_parent();
        this._messageListParent.remove_actor(this._messageList.actor);
        this._oldindicator = Main.panel.statusArea.dateMenu._indicator;

        this._newMessageIndicator = new St.Icon({
            icon_name: "notification-new-symbolic",
            style_class: "system-status-icon",
            visible: false
        });

        this._messageIndicator = new St.Icon({
            icon_name: "notifications-symbolic",
            style_class: "system-status-icon"
        });

        this.box.add_child(this._newMessageIndicator);
        this.box.add_child(this._messageIndicator);

        this._vbox = new St.BoxLayout({
            height: 400,
            style: "border:1px;"
        });

        this._vbox.add(this._messageList.actor);
        this.menu.box.add(this._vbox);

        try {
            this._messageList._removeSection(this._messageList._mediaSection);
        }
        catch (e) { }

        this.menu.connect("open-state-changed", Lang.bind(this, function (menu, isOpen) {
            if (isOpen) {
                let now = new Date();
                this._messageList.setDate(now);
            }
        }));

        this._newMessage = this._oldindicator.actor.connect('notify::visible', Lang.bind(this, function (obj) {
            if (obj) {
                this._messageIndicator.visible = !obj.visible;
                this._newMessageIndicator.visible = obj.visible;
            }
        }));

        this._closeButton = null;
        if (this._messageList._notificationSection._closeButton) {
            // GNOME Shell 3.20 and 3.22
            this._closeButton = this._messageList._notificationSection._closeButton;
        } else {
            // GNOME Shell 3.24
            this._closeButton = this._messageList._clearButton;
        }

        this._hideIndicator = this._closeButton.connect("notify::visible", Lang.bind(this, function (obj) {
            if (this._autoHide) {
                if (obj.visible) {
                    this.actor.show();
                } else {
                    this.actor.hide();
                }
            }
        }));

    },
    setHide: function (value) {
        this._autoHide = value
        if (!value) {
            this.actor.show();
        } else if (this._oldindicator._sources == "") {
            this.actor.hide();
        }
    },
    destroy: function () {
        this._oldindicator.actor.disconnect(this._newMessage);
        this._closeButton.disconnect(this._hideIndicator);
        this._vbox.remove_child(this._messageList.actor)
        this._messageListParent.add_actor(this._messageList.actor);
        this.parent();
    }
});