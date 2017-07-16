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

const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const Lang = imports.lang;
const Gettext = imports.gettext.domain("extend-panel-menu");
const _ = Gettext.gettext;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const CustomButton = Extension.imports.indicators.button.CustomButton;

const VolumeIndicator = new Lang.Class({
    Name: "VolumeIndicator",
    Extends: CustomButton,

    _init: function () {
        this.parent("VolumeIndicator");
        this.menu.actor.add_style_class_name("aggregate-menu");
        this._volume = Main.panel.statusArea.aggregateMenu._volume;
        Main.panel.statusArea.aggregateMenu._indicators.remove_actor(this._volume.indicators);
        this.box.add_child(this._volume.indicators);
        Main.panel.statusArea.aggregateMenu.menu.box.remove_actor(this._volume.menu.actor);
        this.menu.box.add_actor(this._volume.menu.actor);
        try {
            this._mediaSection = new imports.ui.mpris.MediaSection();
            this._mediaSection.actor.add_style_class_name("music-box");
            this.menu.box.add_actor(this._mediaSection.actor);
        } catch (e) { }
        //this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        let settings = new PopupMenu.PopupMenuItem(_("Volume Settings"));
        settings.connect("activate", Lang.bind(this, this._openApp, "gnome-sound-panel.desktop"));
        this.menu.addMenuItem(settings);
    },
    destroy: function () {
        this.box.remove_child(this._volume.indicators);
        this.menu.box.remove_actor(this._volume.menu.actor);
        Main.panel.statusArea.aggregateMenu._indicators.add_actor(this._volume.indicators);
        Main.panel.statusArea.aggregateMenu.menu.box.add_actor(this._volume.menu.actor);
        this.parent();
    }
});
