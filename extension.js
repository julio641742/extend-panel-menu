
const St = imports.gi.St;
const Clutter = imports.gi.Clutter;
const Main = imports.ui.main;
const Panel = imports.ui.panel;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Lang = imports.lang;
const Config = imports.misc.config;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const GObject = imports.gi.GObject;
const GnomeDesktop = imports.gi.GnomeDesktop;
const Shell = imports.gi.Shell;

function init() {}

const CustomButton = new Lang.Class({
	Name: 'Button',
	Extends: PanelMenu.Button,

	_init: function(name) {
		this.parent(0.0, name, false);
		//this.box.add_child(PopupMenu.arrowIcon(St.Side.BOTTOM));
		this.box = new St.BoxLayout({ vertical: false, style_class: 'panel-status-menu-box' });
		this.actor.set_style('-natural-hpadding: 6px; -minimum-hpadding: 6px;');
		this.actor.add_child(this.box);
	},
	_openApp: function(a,b,app) {
			Shell.AppSystem.get_default().lookup_app(app).activate();
	},
	destroy: function() {
		this.parent();
	}
});


/////////////////////////////////////////////////////////////////////////////////////////////////////
/******

TODO

Network (network list)
User (location icon/menu)

****/

const NetworkIndicator = new Lang.Class({
	Name: 'NetworkIndicator',
	Extends: CustomButton,

	_init: function() {
		this.parent('NetworkIndicator');
		this.menu.actor.add_style_class_name('aggregate-menu');

		this._rfkill = new imports.ui.status.rfkill.Indicator();

		if (Config.HAVE_NETWORKMANAGER) {
			this._network = new imports.ui.status.network.NMApplet();
			this.box.add_child(this._network.indicators);
			this.menu.addMenuItem(this._network.menu); // NOT SHOWING MENU
		}

		if (Config.HAVE_BLUETOOTH) {
			this._bluetooth = new imports.ui.status.bluetooth.Indicator();
			this.box.add_child(this._bluetooth.indicators);
			this.menu.addMenuItem(this._bluetooth.menu);
		}

		this.box.add_child(this._rfkill.indicators);
		this.menu.addMenuItem(this._rfkill.menu);

		this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
		let network = new PopupMenu.PopupMenuItem(_('Network Settings'));
		network.connect('activate', Lang.bind(this, this._openApp, 'gnome-network-panel.desktop'));
		this.menu.addMenuItem(network);
	},
});


const UserIndicator = new Lang.Class({
	Name: 'UserIndicator',
	Extends: CustomButton,

	_init: function() {
		this.parent('UserIndicator');

		this._system = new imports.ui.status.system.Indicator();
        this._screencast = new imports.ui.status.screencast.Indicator();
		
		this._location = Main.panel.statusArea.aggregateMenu._location;//new imports.ui.status.location.Indicator(); // ERROR CREATING NEW INDICATOR

		try {
			this._nightLight = new imports.ui.status.nightLight.Indicator(); // ONLY FOR 3.24 AND UP
		} catch(e) {}

		let username = GLib.get_real_name();
		let label = new St.Label({ text: username , y_align: Clutter.ActorAlign.CENTER, style_class: 'panel-status-menu-box'});
        
        this.box.add_child(this._screencast.indicators);
        this.box.add_child(this._location.indicators);
		if(this._nightLight) {
        	this.box.add_child(this._nightLight.indicators);
		}
		this.box.add_child(label);


		this._session = this._system._session;
		this._loginManager = this._system._loginManager;
        
		this.menu.box.set_width(270);

		//////////////////////////////////////////////////////////////
		// MENU
		let about = new PopupMenu.PopupMenuItem(_('About This Computer'));
		about.connect('activate', Lang.bind(this, this._openApp, 'gnome-info-panel.desktop' ));
		this.menu.addMenuItem(about);

		let help = new PopupMenu.PopupMenuItem(_('GNOME Help'));
		help.connect('activate', Lang.bind(this, this._openApp, 'yelp.desktop' ));
		this.menu.addMenuItem(help);
		
		this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem()); // SEPARATOR

		let settings = new PopupMenu.PopupMenuItem(_('System Settings'));
		settings.connect('activate', Lang.bind(this, this._openApp, 'gnome-control-center.desktop' ));
		this.menu.addMenuItem(settings);

		this.menu.addMenuItem(this._location.menu);
		if(this._nightLight) {
        	this.menu.addMenuItem(this._nightLight.menu);
		}

		this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem()); // SEPARATOR

		let lock = new PopupMenu.PopupMenuItem(_('Lock'));
		lock.connect('activate', Lang.bind(this, this._system._onLockScreenClicked));
		this.menu.addMenuItem(lock);
		if(!this._system._lockScreenAction.visible) {
			lock.actor.hide();
		}

		let switchuser = new PopupMenu.PopupMenuItem(_('Switch User'));
		switchuser.connect('activate', Lang.bind(this, this._system._onLoginScreenActivate));
		this.menu.addMenuItem(switchuser);
		if(!this._system._updateSwitchUser) {
			switchuser.actor.hide();
		}

		this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem()); // SEPARATOR

		let logout = new PopupMenu.PopupMenuItem(_('Log Out'));
		logout.connect('activate', Lang.bind(this, this._system._onQuitSessionActivate));
		this.menu.addMenuItem(logout);
		if(!this._system._updateLogout) {
			logout.actor.hide();
		}

		let account = new PopupMenu.PopupMenuItem(_('Account Settings'));
		account.connect('activate', Lang.bind(this, this._openApp, 'gnome-user-accounts-panel.desktop' ));
		this.menu.addMenuItem(account);
		
		this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem()); // SEPARATOR

//////////////
// INCONCLUSIVE
		this.orientation = new PopupMenu.PopupMenuItem(_('Orientation Lock'));
		this.orientation.connect('activate', Lang.bind(this, this._system._onOrientationLockClicked));
		this.menu.addMenuItem(this.orientation);
		if(!this._system._orientationLockAction.visible) {
			this.orientation.actor.hide();
		}
///////////////

		let suspend = new PopupMenu.PopupMenuItem(_('Suspend'));
		suspend.connect('activate', Lang.bind(this, this._system._onSuspendClicked));
		this.menu.addMenuItem(suspend);
		if(!this._system._suspendAction.visible) {
			suspend.actor.hide();
		}
		
		let power = new PopupMenu.PopupMenuItem(_('Power Off'));
		power.connect('activate', Lang.bind(this, this._system._onPowerOffClicked ));
		this.menu.addMenuItem(power);
		if(!this._system._powerOffAction.visible) {
			power.actor.hide();
		}

		//this.menu.addMenuItem(this._system.menu);

	},
});


/////////////////////////////////////////////////////////////////////////////////////////////////////


const PowerIndicator = new Lang.Class({
	Name: 'PowerIndicator',
	Extends: CustomButton,

	_init: function() {
		this.parent('PowerIndicator');
		this.menu.actor.add_style_class_name('aggregate-menu');

		this._power = new imports.ui.status.power.Indicator();
		this._brightness = new imports.ui.status.brightness.Indicator();

		this.menu.addMenuItem(this._brightness.menu);
		
		//let powertype = this._power._proxy.IsPresent; // NOT WORKING!!
		let powertype = this._power._indicator.icon_name == 'system-shutdown-symbolic'; // NOT A GREAT SOLUTION! :(
        // Do we have batteries or a UPS?
		if(powertype) {
			// If there's no battery, then we use the brightness icon.
        	this.iconpanel =  new St.Icon({ icon_name:  'display-brightness-symbolic', style_class: 'system-status-icon' });
			this.box.add_child(this.iconpanel);
		} else {
			this.box.add_child(this._power.indicators);
			this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
			this.label = new St.Label({ style_class: 'label-menu'});
			this.menu.box.add_child(this.label);
			this.menu.connect('open-state-changed', Lang.bind(this, function(menu, isOpen) {
				// Whenever the menu is opened, update status
				if (isOpen) {
					this.label.set_text(this._power._getStatus());
				}
			}));

			let powerSettings = new PopupMenu.PopupMenuItem(_('Power Settings'));
			powerSettings.connect('activate', Lang.bind(this, this._openApp, 'gnome-power-panel.desktop' ));
			this.menu.addMenuItem(powerSettings);
		}

	},
	destroy: function() {
		this.parent();
	},
});

const VolumeIndicator = new Lang.Class({
	Name: 'VolumeIndicator',
	Extends: CustomButton,

	_init: function() {
		this.parent('VolumeIndicator');
		this.menu.actor.add_style_class_name('aggregate-menu');
		this._volume = new imports.ui.status.volume.Indicator();
		this.box.add_child(this._volume.indicators);
		this.menu.addMenuItem(this._volume.menu);
		
		/*
		this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
		let volume = new PopupMenu.PopupMenuItem(_('Volume Settings'));
		volume.connect('activate', Lang.bind(this, this._openApp, 'gnome-sound-panel.desktop'));
		this.menu.addMenuItem(volume);
		*/
	},
});

const NotificationIndicator = new Lang.Class({
	Name: 'NotificationIndicator',
	Extends: CustomButton,

	_init: function() {
        this.parent('NotificationIndicator');

        this.icon = new imports.ui.dateMenu.MessagesIndicator();
        this._messageList = new imports.ui.calendar.CalendarMessageList();
        this.iconpanel =  new St.Icon({ icon_name:  'preferences-system-notifications-symbolic', style_class: 'system-status-icon' });

        this.box.add_child(this.icon.actor);
        this.box.add_child(this.iconpanel);

        let boxmessage = new St.BoxLayout({ height:400, style:'border:10px;'});
        boxmessage.add(this._messageList.actor);
		this.menu.box.add(boxmessage);
		
		/*
		let notification = new PopupMenu.PopupMenuItem(_('Notification Settings'));
		notification.connect('activate', Lang.bind(this, this._openApp, 'gnome-notifications-panel.desktop'));
		this.menu.addMenuItem(notification);
		*/
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
		} catch(e) {}
		

		this._clockDisplay = new St.Label({ y_align: Clutter.ActorAlign.CENTER });
		
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
        this._calendar.connect('selected-date-changed', Lang.bind(this, function (calendar, date) {
            this._eventList.setDate(date);
        }));

		let displaysBox = new St.BoxLayout({ style_class: 'datemenu-displays-box', vertical: true });
		
		this.menu.box.add_actor(this._date.actor);
		this.menu.box.add_actor(this._calendar.actor);
		displaysBox.add_actor(this._eventList.actor);
        displaysBox.add_actor(this._clocksItem.actor);
        if(this._weatherItem) {
			displaysBox.add_actor(this._weatherItem.actor);
		}
		this.menu.box.add_child(displaysBox);
		
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


let power;
let user;
let volume;
let network;
let notification;
let calendar;

function enable() {
	let children = Main.panel._rightBox.get_children();
	Main.panel.statusArea.aggregateMenu.container.hide();
	Main.panel.statusArea.dateMenu.container.hide();
	
	power = new PowerIndicator;
	user = new UserIndicator;
	volume = new VolumeIndicator;
	network = new NetworkIndicator;
	notification = new NotificationIndicator;
	calendar = new CalendarIndicator;

	Main.panel.addToStatusArea('NotificationIndicator', notification, children.length, 'right');
	Main.panel.addToStatusArea('UserIndicator', user, children.length, 'right');
	Main.panel.addToStatusArea('CalendarIndicator', calendar, children.length, 'right');
	Main.panel.addToStatusArea('PowerIndicator', power, children.length, 'right');
	Main.panel.addToStatusArea('NetworkIndicator', network, children.length, 'right');
	Main.panel.addToStatusArea('VolumeIndicator', volume, children.length-1, 'right');
}

function disable() {
	Main.panel.statusArea.aggregateMenu.container.show();
	Main.panel.statusArea.dateMenu.container.show();

	power.destroy();
	user.destroy();
	network.destroy();
	volume.destroy();
	notification.destroy();
	calendar.destroy();
}
