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
const Main = imports.ui.main;
const UPower = imports.gi.UPowerGlib;
const PopupMenu = imports.ui.popupMenu;
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
        this._power = Main.panel.statusArea.aggregateMenu._power;
        this._power.indicators.remove_actor(this._power._indicator);
        this._power.indicators.remove_actor(this._power._percentageLabel);
        this._brightness = Main.panel.statusArea.aggregateMenu._brightness;
        this._brightnessIcon = new St.Icon({
            icon_name: "display-brightness-symbolic",
            style_class: "system-status-icon"
        });
        this.box.add_child(this._brightnessIcon);
        this.box.add_child(this._power._indicator);
        this.box.add(this._power._percentageLabel, { expand: true, y_fill: true });
        Main.panel.statusArea.aggregateMenu.menu.box.remove_actor(this._brightness.menu.actor);
        this.menu.box.add_actor(this._brightness.menu.actor);
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
            this._power._indicator.hide();
            this._power._percentageLabel.hide();
            this._separator.actor.hide();
            this._label.hide();
            this._settings.actor.hide();
        } else {
            this._brightnessIcon.hide();
            this._power._indicator.show();
            this._power._percentageLabel.visible = this._power._desktopSettings.get_boolean("show-battery-percentage");
            this._separator.actor.show();
            this._label.show();
            this._settings.actor.show();

            let hideOnFull = this._hideOnFull && (this._power._proxy.State == UPower.DeviceState.FULLY_CHARGED);
            let hideAtPercent = this._hideOnPercent && (this._power._proxy.Percentage >= this._hideWhenPercent);

            if (hideOnFull) {
                this.actor.hide();
            } else if (hideAtPercent) {
                this._actor.hide();
            } else {
                this.actor.show();
            }

        }
        this._label.set_text(this._power._getStatus());
    },
    showPercentageLabel: function (status) {
        this._power._desktopSettings.set_boolean(status);
    },
    setHideOnFull: function (status) {
        this._hideOnFull = status;
        this._sync();
    },
    setHideOnPercent: function (status, percent, element) {
        this._actor = (element == 0) ? this.actor : this._power._percentageLabel;
        this._hideOnPercent = status;
        this._hideWhenPercent = percent;
        this._sync();
    },
    destroy: function () {
        this._power._proxy.disconnect(this._properties_changed);
        this.box.remove_child(this._power._indicator);
        this.box.remove_child(this._power._percentageLabel);
        this.menu.box.remove_actor(this._brightness.menu.actor);
        this._power.indicators.add_actor(this._power._indicator);
        this._power.indicators.add_actor(this._power._percentageLabel);
        Main.panel.statusArea.aggregateMenu.menu.box.add_actor(this._brightness.menu.actor);
        this.parent();
    }
});