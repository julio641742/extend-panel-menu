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
const Gio = imports.gi.Gio;
const Main = imports.ui.main;
const Slider = imports.ui.slider;
const PopupMenu = imports.ui.popupMenu;
const Gettext = imports.gettext.domain("extend-panel-menu");
const _ = Gettext.gettext;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const CustomButton = Extension.imports.indicators.button.CustomButton;

var NightLightIndicator = new Lang.Class({
    Name: "NightLightIndicator",
    Extends: CustomButton,

    _init: function () {
        this.parent("NightLightIndicator");
        this.menu.actor.add_style_class_name("aggregate-menu");
        this._nightLight = Main.panel.statusArea.aggregateMenu._nightLight;
        this.menu.box.set_width(250);
        this._nightLight.indicators.remove_actor(this._nightLight._indicator);
        this.box.add_child(this._nightLight._indicator);
        this._label = new St.Label({
            style_class: "label-menu"
        });

        this._settings = new Gio.Settings({
            schema_id: "org.gnome.settings-daemon.plugins.color"
        });

        let sliderItem = new PopupMenu.PopupBaseMenuItem({ activate: false });
        let sliderIcon = new St.Icon({
            icon_name: 'daytime-sunset-symbolic',
            style_class: 'popup-menu-icon'
        });
        sliderItem.actor.add(sliderIcon);
        let value = this._settings.get_uint("night-light-temperature") / 10000;
        this._slider = new Slider.Slider(value);
        this._slider.connect('value-changed', Lang.bind(this, this._sliderChanged));
        sliderItem.actor.add(this._slider.actor, { expand: true });
        this.menu.box.add_child(this._label);
        this.menu.addMenuItem(sliderItem);
        this._separator = new PopupMenu.PopupSeparatorMenuItem();
        this.menu.addMenuItem(this._separator);
        this._disableItem = new PopupMenu.PopupMenuItem(_("Resume"));
        this._disableItem.connect("activate", Lang.bind(this, this._change));
        this.menu.addMenuItem(this._disableItem);
        let turnItem = new PopupMenu.PopupMenuItem(_("Turn Off"));
        turnItem.connect("activate", Lang.bind(this, this._turnOff));
        this.menu.addMenuItem(turnItem);
        let nightSettings = new PopupMenu.PopupMenuItem(_("Display Settings"));
        nightSettings.connect("activate", Lang.bind(this, this._openApp, "gnome-display-panel.desktop"));
        this.menu.addMenuItem(nightSettings);
        this._properties_changed = this._nightLight._proxy.connect("g-properties-changed", Lang.bind(this, this._sync));
        this._sync();
    },
    _sliderChanged: function (slider, value) {
        let percent = value * 10000;
        this._settings.set_uint("night-light-temperature", percent);
    },
    _change: function () {
        this._nightLight._proxy.DisabledUntilTomorrow = !this._nightLight._proxy.DisabledUntilTomorrow;
    },
    _turnOff: function () {
        this._settings.set_boolean("night-light-enabled", false);
    },
    _sync: function () {
        let visible = this._nightLight._proxy.NightLightActive;
        let disabled = this._nightLight._proxy.DisabledUntilTomorrow;
        this._label.set_text(disabled ? _("Night Light Disabled") : _("Night Light On"));
        this._disableItem.label.text = disabled ? _("Resume") : _("Disable Until Tomorrow");
        if (visible) {
            this.actor.show();
        } else {
            this.actor.hide();
        }
    },
    destroy: function () {
        this._nightLight._proxy.disconnect(this._properties_changed);
        this.box.remove_child(this._nightLight._indicator);
        this._nightLight.indicators.add_actor(this._nightLight._indicator);
        this.parent();
    }
});

