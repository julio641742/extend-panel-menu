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

const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const GdkPixbuf = imports.gi.GdkPixbuf;
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

const NotebookPage = new GObject.Class({
    Name: 'NotebookPage',
    GTypeName: 'NotebookPage',
    Extends: Gtk.Box,

    _init: function (title) {
        this.parent({
            orientation: Gtk.Orientation.VERTICAL,
            margin: 24,
            spacing: 20,
            homogeneous: false
        });
        this.title = new Gtk.Label({
            label: "<b>" + title + "</b>",
            use_markup: true,
            xalign: 0
        });
    }
});

const FrameBox = new Lang.Class({
    Name: "FrameBox",
    GTypeName: "FrameBox",
    Extends: Gtk.Frame,

    _init: function (label) {
        this._listBox = new Gtk.ListBox();
        this._listBox.set_selection_mode(Gtk.SelectionMode.NONE);
        this.parent({
            label_yalign: 0.50,
            child: this._listBox
        });
        this.label = label;
    },

    add: function (boxRow) {
        this._listBox.add(boxRow);
    }
});

const FrameBoxRow = new Lang.Class({
    Name: "FrameBoxRow",
    GTypeName: "FrameBoxRow",
    Extends: Gtk.ListBoxRow,

    _init: function () {
        this._grid = new Gtk.Grid({
            margin: 5,
            column_spacing: 20,
            row_spacing: 20
        });
        this.parent({
            child: this._grid
        });
    },

    add: function (widget) {
        this._grid.add(widget);
    }
});

const PrefsWidget = new GObject.Class({
    Name: "Prefs.Widget",
    GTypeName: "PrefsWidget",
    Extends: Gtk.Box,

    _init: function () {
        this.parent({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 5,
            border_width: 5
        });
        this.settings = Convenience.getSettings();
        this.menuItems = new MenuItems.MenuItems(this.settings);

        let notebook = new Gtk.Notebook({
            margin_left: 6,
            margin_right: 6
        });

        let settingsPage = new SettingsPage(this.settings);
        notebook.append_page(settingsPage, settingsPage.title);

        let indicatorsPage = new IndicatorsPage(this.settings, this.menuItems);
        notebook.append_page(indicatorsPage, indicatorsPage.title);

        let aboutPage = new AboutPage(this.settings);
        notebook.append_page(aboutPage, aboutPage.title);

        this.add(notebook);
    }
});

const SettingsPage = new Lang.Class({
    Name: "SettingsPage",
    Extends: NotebookPage,

    _init: function (settings) {
        this.parent(_("Settings"));
        this.settings = settings;

        /*
         * General Settings
        */
        let generalFrame = new FrameBox(_("General Settings"));
        let offsetRow = new FrameBoxRow();
        let spacingRow = new FrameBoxRow();

        let offsetLabel = new Gtk.Label({
            label: _("Tray offset"),
            xalign: 0,
            hexpand: true
        });
        let offsetSpin = new Gtk.SpinButton({
            hexpand: true,
            halign: Gtk.Align.END
        });
        offsetSpin.set_sensitive(true);
        offsetSpin.set_range(0, 10);
        offsetSpin.set_increments(1, 2);
        this.settings.bind("tray-offset", offsetSpin, "value", Gio.SettingsBindFlags.DEFAULT);
        let spacingLabel = new Gtk.Label({
            label: _("Spacing"),
            xalign: 0,
            hexpand: true
        });
        let spacingScale = new Gtk.HScale({
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 12,
                step_increment: 1,
                page_increment: 1,
                page_size: 0
            }),
            digits: 0,
            round_digits: 0,
            hexpand: true,
            value_pos: Gtk.PositionType.RIGHT
        });
        spacingScale.connect('format-value', function (scale, value) { return value.toString() + ' px'; });
        spacingScale.add_mark(3, Gtk.PositionType.BOTTOM, "3");
        spacingScale.add_mark(6, Gtk.PositionType.BOTTOM, "6");
        spacingScale.add_mark(9, Gtk.PositionType.BOTTOM, "9");
        spacingScale.set_value(this.settings.get_int("spacing"));
        spacingScale.connect("value-changed", Lang.bind(this, function () {
            //log(value)
            this.settings.set_int("spacing", spacingScale.get_value());
        }));

        offsetRow.add(offsetLabel);
        offsetRow.add(offsetSpin);
        spacingRow.add(spacingLabel);
        spacingRow.add(spacingScale);

        generalFrame.add(offsetRow);
        generalFrame.add(spacingRow);

        /*
         * User Settings
        */
        let userFrame = new FrameBox(_("User/System Indicator"));
        let nameLabelRow = new FrameBoxRow();
        let nameIconRow = new FrameBoxRow();

        let nameLabel = new Gtk.Label({
            label: _("Name label (Empty to show real user name)"),
            xalign: 0,
            hexpand: true
        });
        let nameEntry = new Gtk.Entry({
            hexpand: true,
            halign: Gtk.Align.END
        });
        this.settings.bind("username-text", nameEntry, "text", Gio.SettingsBindFlags.DEFAULT);
        let nameIconLabel = new Gtk.Label({
            label: _("Show an icon instead of name"),
            xalign: 0,
            hexpand: true
        });
        let nameIconSwitch = new Gtk.Switch({
            halign: Gtk.Align.END
        });
        this.settings.bind("user-icon", nameIconSwitch, "active", Gio.SettingsBindFlags.DEFAULT);

        nameLabelRow.add(nameLabel);
        nameLabelRow.add(nameEntry);
        nameIconRow.add(nameIconLabel);
        nameIconRow.add(nameIconSwitch);

        userFrame.add(nameLabelRow);
        userFrame.add(nameIconRow);

        /*
         * Calendar Settings
        */
        let calendarFrame = new FrameBox(_("Calendar Indicator"));
        let dateFormatRow = new FrameBoxRow();

        let dateFormatLabel = new Gtk.Label({
            label: _("Change format of date (Empty to system default)"),
            xalign: 0,
            hexpand: true
        });
        let dateFormatWikiButton = new Gtk.LinkButton({
            label: _("wiki"),
            uri: "https://help.gnome.org/users/gthumb/unstable/gthumb-date-formats.html.en",
            xalign: 0,
            hexpand: true
        });
        let dateFormatEntry = new Gtk.Entry({
            hexpand: true,
            halign: Gtk.Align.END
        });
        this.settings.bind("date-format", dateFormatEntry, "text", Gio.SettingsBindFlags.DEFAULT);

        dateFormatRow.add(dateFormatLabel);
        dateFormatRow.add(dateFormatWikiButton);
        dateFormatRow.add(dateFormatEntry);

        calendarFrame.add(dateFormatRow);

        /*
         * Notification Settings
        */
        let notificationFrame = new FrameBox(_("Notification Indicator"));
        let hideNotificationRow = new FrameBoxRow();

        let hideNotificationLabel = new Gtk.Label({
            label: _("Autohide the Notification Indicator"),
            xalign: 0,
            hexpand: true
        });
        let hideNotificationSwitch = new Gtk.Switch({
            halign: Gtk.Align.END
        });
        this.settings.bind("autohide-notification", hideNotificationSwitch, "active", Gio.SettingsBindFlags.DEFAULT);

        hideNotificationRow.add(hideNotificationLabel);
        hideNotificationRow.add(hideNotificationSwitch);

        notificationFrame.add(hideNotificationRow);

        // add the frames
        this.add(generalFrame);
        this.add(userFrame);
        this.add(calendarFrame);
        this.add(notificationFrame);
    }
});

const IndicatorsPage = new Lang.Class({
    Name: "IndicatorsPage",
    Extends: NotebookPage,

    _init: function (settings, menuItems) {
        this.parent(_("Indicators"));
        this.settings = settings;
        this.menuItems = menuItems;
        this.indicatorsArray = new Array();

        this.indicatorsFrame = new FrameBox(_("Indicators Order"));
        this.buildList();

        // add the frames
        this.add(this.indicatorsFrame);
    },
    buildList: function () {
        for (let rowIndex in this.indicatorsArray) {
            this.indicatorsArray[rowIndex].destroy();
        }
        this.indicatorsArray = new Array();
        let items = this.menuItems.getItems();

        for (let indexItem in items) {
            let item = items[indexItem];

            let indicatorRow = new FrameBoxRow();

            let indicatorLabel = new Gtk.Label({
                label: _(item["label"]),
                xalign: 0,
                hexpand: true
            });

            let positionCombo = new Gtk.ComboBoxText({
                halign: Gtk.Align.END
            });
            positionCombo.append_text(_("Left"));
            positionCombo.append_text(_("Centre"));
            positionCombo.set_active(item["position"]);
            positionCombo.connect("changed", Lang.bind(this, this.enableCenter, indexItem));

            let statusSwitch = new Gtk.Switch({
                active: (item["enable"] == "1"),
                halign: Gtk.Align.END
            });
            statusSwitch.connect("notify", Lang.bind(this, this.changeEnable, indexItem));


            let buttonBox = new Gtk.Box({
                halign: Gtk.Align.END
            });

            let buttonUp = new Gtk.Button({
                //label: _("Up"),
                image: new Gtk.Image({
                    icon_name: "go-up-symbolic"
                })
            });

            if (indexItem > 0) {
                buttonUp.connect("clicked", Lang.bind(this, this.changeOrder, indexItem, -1));
            }

            let buttonDown = new Gtk.Button({
                //label: _("Down")
                image: new Gtk.Image({
                    icon_name: "go-down-symbolic"
                })
            });
            if (indexItem < items.length - 1) {
                buttonDown.connect("clicked", Lang.bind(this, this.changeOrder, indexItem, 1));
            }

            buttonBox.add(buttonUp);
            buttonBox.add(buttonDown);

            indicatorRow.add(indicatorLabel);
            indicatorRow.add(statusSwitch);
            indicatorRow.add(positionCombo);
            indicatorRow.add(buttonBox);

            this.indicatorsFrame.add(indicatorRow);
            this.indicatorsArray.push(indicatorRow);
        }
        
        let positionRow = new FrameBoxRow();
        positionRow.add(new Gtk.Label({
            label: _("Top to bottom -> Left to right"),
            hexpand: true
        }));
        let resetIndicatorsRow = new FrameBoxRow();
        resetIndicatorsRow.add(new Gtk.Label({
            label: _("Reset Indicators"),
            halign: 2,
            hexpand: true
        }));
        let resetButton = new Gtk.Button({
            visible: true,
            label: _("Reset"),
            can_focus: true
        });
        resetButton.get_style_context().add_class(Gtk.STYLE_CLASS_DESTRUCTIVE_ACTION);
        resetButton.connect("clicked", Lang.bind(this, this.resetPosition));

        resetIndicatorsRow.add(resetButton);
        this.indicatorsFrame.add(positionRow);
        this.indicatorsFrame.add(resetIndicatorsRow);

        this.indicatorsArray.push(positionRow);
        this.indicatorsArray.push(resetIndicatorsRow);

        this.indicatorsFrame.show_all();
    },
    changeOrder: function (o, index, order) {
        this.menuItems.changeOrder(index, order);
        this.buildList();
    },
    changeEnable: function (object, p, index) {
        this.menuItems.changeEnable(index, object.active)
    },
    enableCenter: function (object, index) {
        this.menuItems.changePosition(index, object.get_active());
        this.changeOrder(null, index, -index);
    },
    resetPosition: function () {
        this.settings.set_value("items", this.settings.get_default_value("items"));
        this.buildList();
    },
});

const AboutPage = new Lang.Class({
    Name: "AboutPage",
    Extends: NotebookPage,

    _init: function (settings) {
        this.parent(_("About"));
        this.settings = settings;

        let releaseVersion = Me.metadata["version"];
        let projectName = Me.metadata["name"];
        let projectDescription = Me.metadata["description"];
        let projectUrl = Me.metadata["url"];
        let logoPath = Me.path + "/icons/logo.png";
        let [imageWidth, imageHeight] = [128, 128];
        let pixbuf = GdkPixbuf.Pixbuf.new_from_file_at_size(logoPath, imageWidth, imageHeight);
        let menuImage = new Gtk.Image({ pixbuf: pixbuf });
        let menuImageBox = new Gtk.VBox({
            margin_top: 5,
            margin_bottom: 5,
            expand: false
        });
        menuImageBox.add(menuImage);

        // Create the info box
        let menuInfoBox = new Gtk.VBox({
            margin_top: 5,
            margin_bottom: 5,
            expand: false
        });
        let menuLabel = new Gtk.Label({
            label: "<b>Extend Panel Menu</b>",
            use_markup: true,
            expand: false
        });
        let versionLabel = new Gtk.Label({
            label: "<b>" + _("Version: ") + releaseVersion + "</b>",
            use_markup: true,
            expand: false
        });
        let projectDescriptionLabel = new Gtk.Label({
            label: _(projectDescription),
            expand: false
        });
        let helpLabel = new Gtk.Label({
            label: "\n" + _("If something breaks, don\'t hesitate to leave a comment at "),
            expand: false
        });
        let projectLinkButton = new Gtk.LinkButton({
            label: _("Webpage/Github"),
            uri: projectUrl,
            expand: false
        });
        menuInfoBox.add(menuLabel);
        menuInfoBox.add(versionLabel);
        menuInfoBox.add(projectDescriptionLabel);
        menuInfoBox.add(helpLabel);
        menuInfoBox.add(projectLinkButton);

        let authorLabel = new Gtk.Label({
            label: _("Made with love by julio641742"),
            justify: Gtk.Justification.CENTER,
            expand: true
        });

        // Create the GNU software box
        let gnuSofwareLabel = new Gtk.Label({
            label: '<span size="small">This program comes with ABSOLUTELY NO WARRANTY.\n' +
            'See the <a href="http://www.gnu.org/licenses/gpl-3.0.html">GNU General Public License version 3</a> for details.</span>',
            use_markup: true,
            justify: Gtk.Justification.CENTER,
            expand: true
        });
        let gnuSofwareLabelBox = new Gtk.VBox({});
        gnuSofwareLabelBox.pack_end(gnuSofwareLabel, false, false, 0);

        this.add(menuImageBox);
        this.add(menuInfoBox);
        this.add(authorLabel);
        this.add(gnuSofwareLabelBox);
    }
});

function buildPrefsWidget() {
    let widget = new PrefsWidget();
    widget.show_all();

    return widget;
}
