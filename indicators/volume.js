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
const Main = imports.ui.main;
const Shell = imports.gi.Shell;
const Clutter = imports.gi.Clutter;
const PopupMenu = imports.ui.popupMenu;
const Gettext = imports.gettext.domain("extend-panel-menu");
const _ = Gettext.gettext;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const CustomButton = Extension.imports.indicators.button.CustomButton;
const Convenience = Extension.imports.convenience;

var VolumeIndicator = new Lang.Class({
    Name: "VolumeIndicator",
    Extends: CustomButton,

    _init: function () {
        this.parent("VolumeIndicator");
        this._settings = Convenience.getSettings();
        this.menu.actor.add_style_class_name("aggregate-menu");
        this._volume = Main.panel.statusArea.aggregateMenu._volume;
        this._volume.indicators.remove_actor(this._volume._primaryIndicator);
        this.box.add_child(this._volume._primaryIndicator);
        Main.panel.statusArea.aggregateMenu.menu.box.remove_actor(this._volume.menu.actor);
        this.menu.box.add_actor(this._volume.menu.actor);

        this._mediaSection = Main.panel.statusArea.dateMenu._messageList._mediaSection;
        Main.panel.statusArea.dateMenu._messageList._removeSection(this._mediaSection);
        this._mediaSection.actor.add_style_class_name("music-box");
        this.menu.box.add_actor(this._mediaSection.actor);
        this._mediaVisible = this._mediaSection.actor.connect("notify::visible", () => {
            for (let player of this._mediaSection._players.values()) {
                if (player._mprisProxy.DesktopEntry) {
                    let app = player._mprisProxy.DesktopEntry;
                    let players = this._getPlayers();
                    if (players.indexOf(app) == -1) {
                        this._settings.set_string("players", this._settings.get_string("players") + "|" + app);
                        this._addPlayer(app);
                    }
                }
            }
        });
        this._playerMenuContainer = new PopupMenu.PopupMenuSection();
        this.menu.addMenuItem(this._playerMenuContainer);
        let players = this._getPlayers();
        for (let player of players) {
            this._addPlayer(player);
        }

        let settings = new PopupMenu.PopupMenuItem(_("Volume Settings"));
        settings.connect("activate", () => this._openApp("gnome-sound-panel.desktop"));
        this.menu.addMenuItem(settings);
        this.actor.connect("scroll-event", (actor, event) => this._volume._onScrollEvent(actor, event));
    },
    _addPlayer: function (name) {
        let app = Shell.AppSystem.get_default().lookup_app(name + ".desktop")
        if (app) {
            let item = new PopupMenu.PopupBaseMenuItem();
            let label = new St.Label({
                text: app.get_name()
            });
            let icon = new St.Icon({
                style_class: "nm-dialog-icon",
                icon_name: name + "-symbolic"
            });
            let removeButton = new St.Button({
                child: new St.Icon({
                    icon_name: 'list-remove-symbolic'
                }),
                style_class: 'system-menu-action remove-menubutton',
                x_expand: true
            });
            removeButton.set_x_align(Clutter.ActorAlign.END);
            item.actor.add_actor(icon);
            item.actor.add_actor(label);
            item.actor.add_actor(removeButton);
            item.connect("activate", () => this._openApp(name + ".desktop"));
            this._playerMenuContainer.actor.add_actor(item.actor);

            removeButton.connect('clicked', () => {
                let players = this._getPlayers();
                players = players.filter((val) => {
                    return val !== name;
                })
                this._settings.set_string("players", players.join("|"));
                this._playerMenuContainer.actor.remove_actor(item.actor);
            });
        }
    },
    _getPlayers: function () {
        let itemsString = this._settings.get_string("players");
        return itemsString.split("|");
    },
    destroy: function () {
        this._mediaSection.actor.disconnect(this._mediaVisible);
        this.box.remove_child(this._volume._primaryIndicator);
        this.menu.box.remove_actor(this._volume.menu.actor);
        this.menu.box.remove_actor(this._mediaSection.actor);
        this._volume.indicators.add_actor(this._volume._primaryIndicator);
        Main.panel.statusArea.aggregateMenu.menu.box.add_actor(this._volume.menu.actor);
        Main.panel.statusArea.dateMenu._messageList._addSection(this._mediaSection);
        this.parent();
    }
});