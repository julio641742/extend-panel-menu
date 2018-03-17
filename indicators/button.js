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

    Copyright 2017-2018 Julio Galvan
*/

const St = imports.gi.St;
const Lang = imports.lang;
const Gio = imports.gi.Gio;
const Shell = imports.gi.Shell;
const PanelMenu = imports.ui.panelMenu;

var CustomButton = new Lang.Class({
    Name: "Button",
    Extends: PanelMenu.Button,

    _init: function (name) {
        this.parent(0.0, name);
        this.name = name;
        this._center = false;
        this.box = new St.BoxLayout({
            vertical: false,
            style_class: "panel-status-menu-box"
        });;
        this.actor.add_child(this.box);
    },
    _openApp: function (app) {
        Shell.AppSystem.get_default().lookup_app(app).activate();
    },
    set_spacing: function (spacing) {
        this._default_spacing = spacing;
        this.update_spacing(spacing);
    },
    update_spacing: function (spacing) {
        let style = '-natural-hpadding: %dpx'.format(spacing);
        if (spacing < 6) {
            style += '; -minimum-hpadding: %dpx'.format(spacing);
        }
        this.actor.set_style(style);
    },
    calculate_spacing: function () {
        let style = this.actor.get_style();
        if (style) {
            let start = style.indexOf("-natural-hpadding: ");
            let end = style.indexOf("px;");
            let val = parseInt(style.substring(start + 19, end));
            return val;
        }
        return NaN
    },
    destroy: function () {
        this.parent();
    }
});