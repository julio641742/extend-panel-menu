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
const PopupMenu = imports.ui.popupMenu;
const Lang = imports.lang;
const Gettext = imports.gettext.domain("extend-panel-menu");
const _ = Gettext.gettext;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const CustomButton = Extension.imports.indicators.button.CustomButton;

const PowerIndicator = new Lang.Class({
    Name: "PowerIndicator",
    Extends: CustomButton,

    _init: function () {
        this.parent("PowerIndicator");
        this.menu.actor.add_style_class_name("aggregate-menu");
        this._power = new imports.ui.status.power.Indicator();
        this._brightness = new imports.ui.status.brightness.Indicator();
        this._brightnessIcon = new St.Icon({
            icon_name: "display-brightness-symbolic",
            style_class: "system-status-icon"
        });
        this.box.add_child(this._brightnessIcon);
        this.box.add_child(this._power.indicators);
        this.menu.addMenuItem(this._brightness.menu);
        this._separator = new PopupMenu.PopupSeparatorMenuItem();
        this.menu.addMenuItem(this._separator);
        this._label = new St.Label({
            style_class: "label-menu"
        });
        this.menu.box.add_child(this._label);
        this._settings = new PopupMenu.PopupMenuItem(_("Power Settings"));
        this._settings.connect("activate", Lang.bind(this, this._openApp, "gnome-power-panel.desktop"));
        this.menu.addMenuItem(this._settings);
        this._properties_changed = this._power._proxy.connect("g-properties-changed", Lang.bind(this, this._sync));
        this._sync();
    },
    _sync: function () {
        let powertype = this._power._proxy.IsPresent;
        if (!powertype) {
            this._brightnessIcon.show();
            this._power.indicators.hide();
            this._separator.actor.hide();
            this._label.hide();
            this._settings.actor.hide();
        } else {
            this._brightnessIcon.hide();
            this._power.indicators.show();
            this._separator.actor.show();
            this._label.show();
            this._settings.actor.show();
        }
        this._label.set_text(this._power._getStatus());
    },
    destroy: function () {
        this._power._proxy.disconnect(this._properties_changed)
        this.parent();
    }
});