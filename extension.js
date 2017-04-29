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
const Clutter = imports.gi.Clutter;
const Main = imports.ui.main;
const Panel = imports.ui.panel;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Lang = imports.lang;
const Config = imports.misc.config;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;
const GnomeDesktop = imports.gi.GnomeDesktop;
const Shell = imports.gi.Shell;

const Gettext = imports.gettext.domain('extend-panel-menu');
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const MenuItems = Me.imports.menuItems;
const _ = Gettext.gettext;
const Util = imports.misc.util;

function init() {
    Convenience.initTranslations('extend-panel-menu');
}


const CustomButton = new Lang.Class({
    Name: 'Button',
    Extends: PanelMenu.Button,

    _init: function(name) {
        this.parent(0.0, name, false);
        this.name = name;
        this.box = new St.BoxLayout({
            vertical: false,
            style_class: 'panel-status-menu-box'
        });;
        this.actor.set_style('-natural-hpadding: 6px; -minimum-hpadding: 6px;');
        this.actor.add_child(this.box);
    },
    _openApp: function(a, b, app) {
        Shell.AppSystem.get_default().lookup_app(app).activate();
    },
    destroy: function() {
        this.parent();
    }
});

const NetworkIndicator = new Lang.Class({
    Name: 'NetworkIndicator',
    Extends: CustomButton,

    _init: function() {
        this.parent('NetworkIndicator');
        this.menu.actor.add_style_class_name('aggregate-menu');

        this._rfkill = Main.panel.statusArea.aggregateMenu._rfkill;
        //new imports.ui.status.rfkill.Indicator();

        this._location = Main.panel.statusArea.aggregateMenu._location;
        // new imports.ui.status.location.Indicator(); // ERROR INTERFACE

        //this.box.add_child(this._location._indicator);
        Main.panel.statusArea.aggregateMenu._indicators.remove_actor(this._location.indicators); // WORKAROUND!! NOT PRETTY :(
        this.box.add_child(this._location.indicators); // NOT PRETTY

        //this.box.add_child(this._rfkill.indicators);
        Main.panel.statusArea.aggregateMenu._indicators.remove_actor(this._rfkill.indicators);
        this.box.add_child(this._rfkill.indicators);

        if (Config.HAVE_NETWORKMANAGER) {
            this._network = Main.panel.statusArea.aggregateMenu._network;
            //new imports.ui.status.network.NMApplet();

            //this.box.add_child(this._network.indicators);
            Main.panel.statusArea.aggregateMenu._indicators.remove_actor(this._network.indicators);
            this.box.add_child(this._network.indicators);

            //this.menu.addMenuItem(this._network.menu); // NOT SHOWING MENU
            Main.panel.statusArea.aggregateMenu.menu.box.remove_actor(this._network.menu.actor);
            this.menu.box.add_actor(this._network.menu.actor);
        }

        if (Config.HAVE_BLUETOOTH) {
            this._bluetooth = Main.panel.statusArea.aggregateMenu._bluetooth;
            //new imports.ui.status.bluetooth.Indicator();

            //this.box.add_child(this._bluetooth.indicators);
            Main.panel.statusArea.aggregateMenu._indicators.remove_actor(this._bluetooth.indicators);
            this.box.add_child(this._bluetooth.indicators);

            //this.menu.addMenuItem(this._bluetooth.menu);
            Main.panel.statusArea.aggregateMenu.menu.box.remove_actor(this._bluetooth.menu.actor);
            this.menu.box.add_actor(this._bluetooth.menu.actor);
        }

        //this.menu.addMenuItem(this._location.menu);
        Main.panel.statusArea.aggregateMenu.menu.box.remove_actor(this._location.menu.actor);
        this.menu.box.add_actor(this._location.menu.actor);

        //this.menu.addMenuItem(this._rfkill.menu);
        Main.panel.statusArea.aggregateMenu.menu.box.remove_actor(this._rfkill.menu.actor);
        this.menu.box.add_actor(this._rfkill.menu.actor);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        let network = new PopupMenu.PopupMenuItem(_('Network Settings'));
        network.connect('activate', Lang.bind(this, this._openApp, 'gnome-network-panel.desktop'));
        this.menu.addMenuItem(network);
    },
    destroy: function() {
        this.box.remove_child(this._location.indicators);
        Main.panel.statusArea.aggregateMenu._indicators.add_actor(this._location.indicators);
        this.box.remove_child(this._rfkill.indicators);
        Main.panel.statusArea.aggregateMenu._indicators.add_actor(this._rfkill.indicators);
        if (Config.HAVE_NETWORKMANAGER) {
            this.box.remove_child(this._network.indicators);
            Main.panel.statusArea.aggregateMenu._indicators.add_actor(this._network.indicators);
            this.menu.box.remove_actor(this._network.menu.actor);
            Main.panel.statusArea.aggregateMenu.menu.box.add_actor(this._network.menu.actor);
        }
        if (Config.HAVE_BLUETOOTH) {
            this.box.remove_child(this._bluetooth.indicators);
            Main.panel.statusArea.aggregateMenu._indicators.add_actor(this._bluetooth.indicators);
            this.menu.box.remove_actor(this._bluetooth.menu.actor);
            Main.panel.statusArea.aggregateMenu.menu.box.add_actor(this._bluetooth.menu.actor);
        }
        this.menu.box.remove_actor(this._location.menu.actor);
        Main.panel.statusArea.aggregateMenu.menu.box.add_actor(this._location.menu.actor);
        this.menu.box.remove_actor(this._rfkill.menu.actor);
        Main.panel.statusArea.aggregateMenu.menu.box.add_actor(this._rfkill.menu.actor);
        this.parent();
    },
});

const NightLightIndicator = new Lang.Class({
    Name: 'NightLightIndicator',
    Extends: CustomButton,

    _init: function() {
        this.parent('NightLightIndicator');

        let BUS_NAME = 'org.gnome.SettingsDaemon.Color';
        let OBJECT_PATH = '/org/gnome/SettingsDaemon/Color';

        let ColorInterface = '<node> \
        <interface name="org.gnome.SettingsDaemon.Color"> \
          <property name="DisabledUntilTomorrow" type="b" access="readwrite"/> \
          <property name="NightLightActive" type="b" access="read"/> \
        </interface> \
        </node>';

        let ColorProxy = Gio.DBusProxy.makeProxyWrapper(ColorInterface);
        this._indicator = new St.Icon({
            style_class: 'system-status-icon',
            icon_name: 'night-light-symbolic'
        });
        this.box.add_child(this._indicator);
        this._proxy = new ColorProxy(Gio.DBus.session, BUS_NAME, OBJECT_PATH,
            (proxy, error) => {
                if (error) {
                    log(error.message);
                    return;
                }
                this._proxy.connect('g-properties-changed',
                    Lang.bind(this, this._sync));
                this._sync();
            });
        this.label = new St.Label({
            style_class: 'label-menu'
        });
        this.menu.box.add_child(this.label);

        //this._item = new PopupMenu.PopupSubMenuMenuItem("", true);
        //this._item.icon.icon_name = 'night-light-symbolic';
        this._disableItem = this.menu.addAction('', () => {
            this._proxy.DisabledUntilTomorrow = !this._proxy.DisabledUntilTomorrow;
        });
        this.menu.addAction(_("Turn Off"), () => {
            let settings = new Gio.Settings({
                schema_id: 'org.gnome.settings-daemon.plugins.color'
            });
            settings.set_boolean('night-light-enabled', false);
        });
        this.menu.addSettingsAction(_("Display Settings"), 'gnome-display-panel.desktop');

        //this.menu.actor.add_style_class_name('aggregate-menu');
        this.menu.box.set_width(270);
        Main.sessionMode.connect('updated', Lang.bind(this, this._sessionUpdated));
        this._sessionUpdated();
        this._sync();
    },
    _sessionUpdated: function() {
        let sensitive = !Main.sessionMode.isLocked && !Main.sessionMode.isGreeter;
        this.menu.setSensitive(sensitive);
    },
    _sync: function() {
        let visible = this._proxy.NightLightActive;
        let disabled = this._proxy.DisabledUntilTomorrow;

        this.label.set_text(disabled ? _("Night Light Disabled") :
            _("Night Light On"));

        this._disableItem.label.text = disabled ? _("Resume") :
            _("Disable Until Tomorrow");
        /*this._item.actor.visible = */
        this._indicator.visible = visible;
    }
});

const UserIndicator = new Lang.Class({
    Name: 'UserIndicator',
    Extends: CustomButton,

    _init: function() {
        this.parent('UserIndicator');

        this._system = new imports.ui.status.system.Indicator();
        this._screencast = new imports.ui.status.screencast.Indicator();

        let username = GLib.get_real_name();
        this.usernamelabel = new St.Label({
            text: username,
            y_align: Clutter.ActorAlign.CENTER,
            style_class: 'panel-status-menu-box'
        });

        Main.panel.statusArea.aggregateMenu.menu.box.remove_actor(Main.panel.statusArea.aggregateMenu._system.menu.actor);

        this.box.add_child(this._screencast.indicators);
        this.box.add_child(this.usernamelabel);

        this._session = this._system._session;
        this._loginManager = this._system._loginManager;

        this.menu.box.set_width(270);

        //////////////////////////////////////////////////////////////
        // MENU
        let about = new PopupMenu.PopupMenuItem(_('About This Computer'));
        about.connect('activate', Lang.bind(this, this._openApp, 'gnome-info-panel.desktop'));
        this.menu.addMenuItem(about);

        let help = new PopupMenu.PopupMenuItem(_('GNOME Help'));
        help.connect('activate', Lang.bind(this, this._openApp, 'yelp.desktop'));
        this.menu.addMenuItem(help);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem()); // SEPARATOR

        let settings = new PopupMenu.PopupMenuItem(_('System Settings'));
        settings.connect('activate', Lang.bind(this, this._openApp, 'gnome-control-center.desktop'));
        this.menu.addMenuItem(settings);

        let extsettings = new PopupMenu.PopupMenuItem(_('Extension Settings'));
        extsettings.connect('activate', Lang.bind(this, this._openSettings));
        this.menu.addMenuItem(extsettings);


        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem()); // SEPARATOR

        let lock = new PopupMenu.PopupMenuItem(_('Lock'));
        lock.connect('activate', Lang.bind(this, this._system._onLockScreenClicked));
        this.menu.addMenuItem(lock);
        if (!this._system._lockScreenAction.visible) {
            lock.actor.hide();
        }

        let switchuser = new PopupMenu.PopupMenuItem(_('Switch User'));
        switchuser.connect('activate', Lang.bind(this, this._system._onLoginScreenActivate));
        this.menu.addMenuItem(switchuser);
        if (!this._system._updateSwitchUser) {
            switchuser.actor.hide();
        }

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem()); // SEPARATOR

        let logout = new PopupMenu.PopupMenuItem(_('Log Out'));
        logout.connect('activate', Lang.bind(this, this._system._onQuitSessionActivate));
        this.menu.addMenuItem(logout);
        if (!this._system._updateLogout) {
            logout.actor.hide();
        }

        let account = new PopupMenu.PopupMenuItem(_('Account Settings'));
        account.connect('activate', Lang.bind(this, this._openApp, 'gnome-user-accounts-panel.desktop'));
        this.menu.addMenuItem(account);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem()); // SEPARATOR

        //////////////
        // INCONCLUSIVE
        //this.orientation = new PopupMenu.PopupMenuItem(_('Orientation Lock'));
        //this.orientation.connect('activate', Lang.bind(this, this._system._onOrientationLockClicked));
        //this.menu.addMenuItem(this.orientation);
        //if (!this._system._orientationLockAction.visible) {
        //    this.orientation.actor.hide();
        //}
        ///////////////

        let suspend = new PopupMenu.PopupMenuItem(_('Suspend'));
        suspend.connect('activate', Lang.bind(this, this._system._onSuspendClicked));
        this.menu.addMenuItem(suspend);
        if (!this._system._suspendAction.visible) {
            suspend.actor.hide();
        }

        let power = new PopupMenu.PopupMenuItem(_('Power Off'));
        power.connect('activate', Lang.bind(this, this._system._onPowerOffClicked));
        this.menu.addMenuItem(power);
        if (!this._system._powerOffAction.visible) {
            power.actor.hide();
        }

        //this.menu.addMenuItem(this._system.menu);
    },
    _openSettings: function() {
        Util.spawn(['gnome-shell-extension-prefs', Me.uuid]);
    },
    destroy: function() {
        Main.panel.statusArea.aggregateMenu.menu.box.add_actor(Main.panel.statusArea.aggregateMenu._system.menu.actor);
        this.parent();
    },
});

const PowerIndicator = new Lang.Class({
    Name: 'PowerIndicator',
    Extends: CustomButton,

    _init: function() {
        this.parent('PowerIndicator');
        this.menu.actor.add_style_class_name('aggregate-menu');

        this._power = new imports.ui.status.power.Indicator();
        this._brightness = new imports.ui.status.brightness.Indicator();

        this.menu.addMenuItem(this._brightness.menu);

        let powertype = Main.panel.statusArea.aggregateMenu._power._proxy.IsPresent;
        log(powertype);
        //let powertype = this._power._proxy.IsPresent; // NOT WORKING!!
        //let powertype = this._power._indicator.icon_name == 'system-shutdown-symbolic'; // NOT A GREAT SOLUTION! :(
        // Do we have batteries or a UPS?
        if (!powertype) {
            // If there's no battery, then we use the brightness icon.
            this.iconpanel = new St.Icon({
                icon_name: 'display-brightness-symbolic',
                style_class: 'system-status-icon'
            });
            this.box.add_child(this.iconpanel);
        } else {
            this.box.add_child(this._power.indicators);
            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            this.label = new St.Label({
                style_class: 'label-menu'
            });
            this.menu.box.add_child(this.label);
            this.menu.connect('open-state-changed', Lang.bind(this, function(menu, isOpen) {
                // Whenever the menu is opened, update status
                if (isOpen) {
                    this.label.set_text(this._power._getStatus());
                }
            }));

            let powerSettings = new PopupMenu.PopupMenuItem(_('Power Settings'));
            powerSettings.connect('activate', Lang.bind(this, this._openApp, 'gnome-power-panel.desktop'));
            this.menu.addMenuItem(powerSettings);
        }

    },
});

const VolumeIndicator = new Lang.Class({
    Name: 'VolumeIndicator',
    Extends: CustomButton,

    _init: function() {
        this.parent('VolumeIndicator');

        this.menu.actor.add_style_class_name('aggregate-menu');
        this._volume = new imports.ui.status.volume.Indicator();

        this._volume_panel = Main.panel.statusArea.aggregateMenu._volume;
        //this.box.add_child(this._volume.indicators); // Indicator not showing properly
        Main.panel.statusArea.aggregateMenu._indicators.remove_actor(this._volume_panel.indicators);
        this.box.add_child(this._volume_panel.indicators);

        this.menu.addMenuItem(this._volume.menu);

        /*
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        let volume = new PopupMenu.PopupMenuItem(_('Volume Settings'));
        volume.connect('activate', Lang.bind(this, this._openApp, 'gnome-sound-panel.desktop'));
        this.menu.addMenuItem(volume);
        */
    },
    destroy: function() {
        this.box.remove_child(this._volume_panel.indicators);
        Main.panel.statusArea.aggregateMenu._indicators.add_actor(this._volume_panel.indicators);
        this.parent();
    }
});

const NotificationIndicator = new Lang.Class({
    Name: 'NotificationIndicator',
    Extends: CustomButton,

    _init: function() {
        this.parent('NotificationIndicator');

        this.icon = new imports.ui.dateMenu.MessagesIndicator();
        this._messageList = new imports.ui.calendar.CalendarMessageList();
        this.iconpanel = new St.Icon({
            icon_name: 'preferences-system-notifications-symbolic',
            style_class: 'system-status-icon'
        });

        this.box.add_child(this.icon.actor);
        this.box.add_child(this.iconpanel);

        let boxmessage = new St.BoxLayout({
            height: 400,
            style: 'border:1px;'
        });
        boxmessage.add(this._messageList.actor);
        this.menu.box.add(boxmessage);

    },
});

const CalendarIndicator = new Lang.Class({
    Name: 'CalendarIndicator',
    Extends: CustomButton,


    _init: function() {
        this.parent('CalendarIndicator');

        this._calendar = new imports.ui.calendar.Calendar();
        this._eventList = new imports.ui.calendar.EventsSection();
        this._date = new imports.ui.dateMenu.TodayButton(this._calendar);
        this._clocksItem = new imports.ui.dateMenu.WorldClocksSection();
        this._clock = new GnomeDesktop.WallClock();

        try {
            this._weatherItem = new imports.ui.dateMenu.WeatherSection(); // ONLY FOR 3.24 AND UP
        } catch (e) {}


        this._clockDisplay = new St.Label({
            y_align: Clutter.ActorAlign.CENTER
        });

        this.box.add_child(this._clockDisplay);

        this.menu.connect('open-state-changed', Lang.bind(this, function(menu, isOpen) {
            // Whenever the menu is opened, select today
            if (isOpen) {
                let now = new Date();
                this._calendar.setDate(now);
                this._eventList.setDate(now);
                this._date.setDate(now);
            }
        }));
        this._calendar.connect('selected-date-changed', Lang.bind(this, function(calendar, date) {
            this._eventList.setDate(date);
        }));

        let boxLayout;
        let vbox;
        try {
            boxLayout = new imports.ui.dateMenu.CalendarColumnLayout(this._calendar.actor);
            vbox = new St.Widget({
                style_class: 'datemenu-calendar-column',
                layout_manager: boxLayout
            });
            boxLayout.hookup_style(vbox);
        } catch (e) {
            vbox = new St.BoxLayout({
                style_class: 'datemenu-calendar-column',
                vertical: true
            });
        }
        this.menu.box.add(vbox);
        vbox.add_actor(this._date.actor);
        vbox.add_actor(this._calendar.actor);
        this._displaysSection = new St.ScrollView({
            style_class: 'datemenu-displays-section vfade',
            x_expand: true,
            x_fill: true,
            overlay_scrollbars: true
        });
        this._displaysSection.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC);
        vbox.add_actor(this._displaysSection);

        let displaysBox = new St.BoxLayout({
            vertical: true,
            style_class: 'datemenu-displays-box'
        });

        this._displaysSection.add_actor(displaysBox);
        displaysBox.add(this._eventList.actor, {
            x_fill: true
        });
        displaysBox.add(this._clocksItem.actor, {
            x_fill: true
        });

        if (this._weatherItem) {
            displaysBox.add(this._weatherItem.actor, {
                x_fill: true
            });
        }

        this._clock.bind_property('clock', this._clockDisplay, 'text', GObject.BindingFlags.SYNC_CREATE);
        Main.sessionMode.connect('updated', Lang.bind(this, this._sessionUpdated));
        this._sessionUpdated();
    },

    _setEventSource: function(eventSource) {
        if (this._eventSource)
            this._eventSource.destroy();
        this._calendar.setEventSource(eventSource);
        this._eventList.setEventSource(eventSource);
        this._eventSource = eventSource;
    },

    _sessionUpdated: function() {
        let eventSource;
        let showEvents = Main.sessionMode.showCalendarEvents;
        if (showEvents) {
            eventSource = new imports.ui.calendar.DBusEventSource();
        } else {
            eventSource = new imports.ui.calendar.EmptyEventSource();
        }
        this._setEventSource(eventSource);
    },
});

let settings;
let settingsChanged;
let menuItems;
let order;
let indicators;
let user;

const VERSION = Config.PACKAGE_VERSION;
const VERSION_NIGHLIGHT = '3.24.1';

function enable() {
    Main.panel.statusArea.aggregateMenu.container.hide();
    Main.panel.statusArea.dateMenu.container.hide();

    // Load Settings
    order = null;
    indicators = null;
    user = -1
    settings = Convenience.getSettings();
    menuItems = new MenuItems.MenuItems(settings);
    settingsChanged = settings.connect('changed', Lang.bind(this, applySettings));
    applySettings();
}

function applySettings() {
    let items = menuItems.getEnableItems();
    // If the order in which the indicators are displayed is changed
    if (order != items.toString()) {
        destroyIndicators();
        indicators = new Array(items.length);

        if (items.indexOf('power') != -1) {
            indicators[items.indexOf('power')] = new PowerIndicator;
        }
        if (items.indexOf('user')) {
            user = indicators[items.indexOf('user')] = new UserIndicator;
        }
        if (items.indexOf('volume') != -1) {
            indicators[items.indexOf('volume')] = new VolumeIndicator;
        }
        if (items.indexOf('network') != -1) {
            indicators[items.indexOf('network')] = new NetworkIndicator;
        }
        if (items.indexOf('notification') != -1) {
            indicators[items.indexOf('notification')] = new NotificationIndicator;
        }
        if (items.indexOf('calendar') != -1) {
            indicators[items.indexOf('calendar')] = new CalendarIndicator;
        }
        if (items.indexOf('nightlight') != -1 && ExtensionUtils.versionCheck([VERSION], VERSION_NIGHLIGHT)) {
            indicators[items.indexOf('nightlight')] = new NightLightIndicator;
        }

        let children = Main.panel._rightBox.get_children();
        indicators.reverse().forEach(function(item) {
            Main.panel.addToStatusArea(item.name, item, children.length, 'right');
        });
        // Save state
        order = items.toString();
    }

    let username = settings.get_string('username-text');
    if (username == "") {
        username = GLib.get_real_name();
    }
    if (user) {
        user.usernamelabel.set_text(username);
    }
}

function destroyIndicators() {
    if (indicators) {
        indicators.forEach(function(item) {
            item.destroy();
        });
    }
    indicators = null;
    user = null;
}

function disable() {
    settingsChanged = null;
    settings = null;
    destroyIndicators();
    Main.panel.statusArea.aggregateMenu.container.show();
    Main.panel.statusArea.dateMenu.container.show();
}
