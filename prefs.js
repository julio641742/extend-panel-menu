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
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Gettext = imports.gettext.domain("extend-panel-menu");
const _ = Gettext.gettext;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const Lang = imports.lang;

const Extension = imports.misc.extensionUtils.getCurrentExtension();
const MenuItems = Extension.imports.menuItems;

function init() {
    Convenience.initTranslations("extend-panel-menu");
}

const PrefsWidget = new GObject.Class({
    Name: "Prefs.Widget",
    GTypeName: "PrefsWidget",
    Extends: Gtk.Grid,

    _init: function (params) {
        this.parent(params);
        this.expand = true;
        this.settings = Convenience.getSettings();
        this.menuItems = new MenuItems.MenuItems(this.settings);
        this.hboxsList = new Array();
        this.vboxList = null;
        this.margin = 18;
        this.row_spacing = 18;
        this.row_homogeneous = false;
        this.orientation = Gtk.Orientation.VERTICAL;


        /*****       SUBMENU         ****/
        let vbox = new Gtk.VBox({
            spacing: 6
        });
        vbox.add(new Gtk.Label({
            label: "<b>" + _("Settings") + "</b>",
            use_markup: true,
            hexpand: true,
            halign: 1
        }));
        let box = new Gtk.Box({
            spacing: 12,
            margin_left: 12
        });
        box.add(new Gtk.Label({
            label: _("Name label (Empty to show real user name)"),
            hexpand: true,
            halign: 1
        }));
        let valueUser = new Gtk.Entry({
            hexpand: true
        });
        this.settings.bind("username-text", valueUser, "text", Gio.SettingsBindFlags.DEFAULT);
        box.add(valueUser);
        vbox.add(box);
        box = new Gtk.Box({
            spacing: 12,
            margin_left: 12
        });
        box.add(new Gtk.Label({
            label: _("Show an icon instead of name"),
            hexpand: true,
            halign: 1
        }));
        let enableUserIcon = new Gtk.Switch();
        this.settings.bind("user-icon", enableUserIcon, "active", Gio.SettingsBindFlags.DEFAULT);
        box.add(enableUserIcon);
        vbox.add(box);
        box = new Gtk.Box({
            spacing: 12,
            margin_left: 12
        });
        box.add(new Gtk.Label({
            label: _("Tray offset (1 for Dash to panel compartibility)"),
            hexpand: true,
            halign: 1
        }));
        let valueOffset = new Gtk.SpinButton({
            hexpand: true
        });
        valueOffset.set_sensitive(true);
        valueOffset.set_range(0, 10);
        valueOffset.set_increments(1, 2);
        this.settings.bind("tray-offset", valueOffset, "value", Gio.SettingsBindFlags.DEFAULT);
        box.add(valueOffset);
        vbox.add(box);
        this.add(vbox);

        /*****       SUBMENU         ****/

        vbox = new Gtk.VBox({
            spacing: 6
        });
        vbox.add(new Gtk.Label({
            label: "<b>" + _("Indicators") + "</b>",
            use_markup: true,
            hexpand: true,
            halign: 1
        }));
        box = new Gtk.Box({
            spacing: 12,
            margin_left: 12
        });
        this.vboxList = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 6
        });
        this.buildList();
        box.add(this.vboxList);
        vbox.add(box);
        box = new Gtk.Box({
            spacing: 12,
            margin_left: 12
        });
        box.add(new Gtk.Label({
            label: _("Top to bottom -> Left to right"),
            hexpand: true
        }));
        vbox.add(box);
        box = new Gtk.Box({
            spacing: 12,
            margin_left: 12
        });
        box.add(new Gtk.Label({
            label: _("Reset Indicators"),
            hexpand: true,
            halign: 2
        }));
        let button = new Gtk.Button({
            visible: true,
            label: _("Reset"),
            can_focus: true
        });
        button.get_style_context().add_class(Gtk.STYLE_CLASS_DESTRUCTIVE_ACTION);
        button.connect("clicked", Lang.bind(this, this.resetPosition));
        box.add(button);



        vbox.add(box);
        this.add(vbox);


        /*****       SUBMENU         ****/
        vbox = new Gtk.VBox({
            spacing: 6
        });
        vbox.add(new Gtk.Label({
            label: "<b>" + _("Help") + "</b>",
            use_markup: true,
            hexpand: true,
            halign: 1
        }));
        box = new Gtk.Box({
            spacing: 12,
            margin_left: 12
        });
        box.add(new Gtk.Label({
            label: _("If something breaks, don\'t hesitate to leave a comment at "),
            hexpand: true,
            halign: 1
        }));

        box.add(new Gtk.LinkButton({
            label: _("Github repo"),
            uri: "https://github.com/julio641742/extend-panel-menu",
            hexpand: true,
            halign: 1
        }));
        vbox.add(box);
        box = new Gtk.Box({
            spacing: 12,
            margin_left: 12
        });
        box.add(new Gtk.Label({
            label: _("Made with love by #julio641742#"),
            hexpand: true,
        }));
        vbox.add(box);
        this.add(vbox);

    },
    buildList: function () {
        for (let indexHboxList in this.hboxsList) {
            this.vboxList.remove(this.hboxsList[indexHboxList]);
        }
        this.hboxsList = new Array();

        let items = this.menuItems.getItems();

        for (let indexItem in items) {
            let item = items[indexItem];

            let hboxList = new Gtk.Box({
                orientation: Gtk.Orientation.HORIZONTAL
            });

            let buttonUp = new Gtk.Button({
                label: _("Up")
            })
            if (indexItem > 0) {
                buttonUp.connect("clicked", Lang.bind(this, this.changeOrder, indexItem, -1));
            }

            let buttonDown = new Gtk.Button({
                label: _("Down")
            });
            if (indexItem < items.length - 1) {
                buttonDown.connect("clicked", Lang.bind(this, this.changeOrder, indexItem, 1));
            }

            let valueList = new Gtk.Switch({
                active: (item["enable"] == "1")
            });
            valueList.connect("notify", Lang.bind(this, this.changeEnable, indexItem));


            hboxList.add(new Gtk.Label({
                label: _(item["label"]),
                //xalign: 0
                hexpand: true,
                halign: 1
            }));
            hboxList.add(valueList);
            hboxList.add(buttonUp);
            hboxList.add(buttonDown);

            this.vboxList.add(hboxList);
            this.hboxsList.push(hboxList);
        }

        this.vboxList.show_all();


    },
    changeOrder: function (o, index, order) {
        this.menuItems.changeOrder(index, order);
        this.buildList();
    },
    changeEnable: function (object, p, index) {
        this.menuItems.changeEnable(index, object.active)
    },
    resetPosition: function () {
        this.settings.set_value("items", this.settings.get_default_value("items"));
        this.buildList();
    },
});

function buildPrefsWidget() {
    let widget = new PrefsWidget();
    widget.show_all();

    return widget;
}
