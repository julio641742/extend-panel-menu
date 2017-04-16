
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

function init() {}

const UserIndicator = new Lang.Class({
	Name: 'UserIndicator',
	Extends: PanelMenu.Button,

	_init: function() {
		this.parent(0.0, 'UserIndicator');
		this._system = new imports.ui.status.system.Indicator();
        this._screencast = new imports.ui.status.screencast.Indicator();
        //this._location = new imports.ui.status.location.Indicator(); // NOT WORKING!
        //this._nightLight = new imports.ui.status.nightLight.Indicator(); // ONLY FOR 3.24 AND UP
        

		this.box = new St.BoxLayout({ vertical: false, style_class: 'panel-status-menu-box' });
		let username = GLib.get_real_name();
		let label = new St.Label({ text: username , y_expand: true, y_align: Clutter.ActorAlign.CENTER });
        
        this.box.add_child(this._screencast.indicators);
        //this.box.add_child(this._location.indicators);
        //this.box.add_child(this._nightLight.indicators);
		this.box.add_child(label);
		//this.box.add_child(PopupMenu.arrowIcon(St.Side.BOTTOM));

		this.menu.actor.add_style_class_name('aggregate-menu');
		let menuLayout = new Panel.AggregateLayout();
		this.menu.box.set_layout_manager(menuLayout);

        //this.menu.addMenuItem(this._location.menu);
        //this.menu.addMenuItem(this._nightLight.menu);
		this.menu.addMenuItem(this._system.menu);

		menuLayout.addSizeChild(this._system.menu.actor);
		this.actor.add_child(this.box);
	},

	destroy: function() {
		this.parent();
	}
});

const PowerIndicator = new Lang.Class({
	Name: 'PowerIndicator',
	Extends: PanelMenu.Button,

	_init: function() {
		this.parent(0.0, 'PowerIndicator');
		this._power = new imports.ui.status.power.Indicator();
		this._brightness = new imports.ui.status.brightness.Indicator();
		this.box = new St.BoxLayout({ vertical: false, style_class: 'panel-status-menu-box' });
		this.box.add_child(this._power.indicators);
		//this.box.add_child(PopupMenu.arrowIcon(St.Side.BOTTOM));
		this.menu.actor.add_style_class_name('aggregate-menu');
		let menuLayout = new Panel.AggregateLayout();
		this.menu.box.set_layout_manager(menuLayout);
		this.menu.addMenuItem(this._brightness.menu);
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
		this.menu.addMenuItem(this._power.menu);
		menuLayout.addSizeChild(this._power.menu.actor);
		this.actor.add_child(this.box);
	},

	destroy: function() {
		this.parent();
	}
});

const VolumeIndicator = new Lang.Class({
	Name: 'VolumeIndicator',
	Extends: PanelMenu.Button,

	_init: function() {
		this.parent(0.0, 'VolumeIndicator');
		this._volume = new imports.ui.status.volume.Indicator();
		this.box = new St.BoxLayout({ vertical: false, style_class: 'panel-status-menu-box' });
		this.box.add_child(this._volume.indicators);
		//this.box.add_child(PopupMenu.arrowIcon(St.Side.BOTTOM));
		this.menu.actor.add_style_class_name('aggregate-menu');
		let menuLayout = new Panel.AggregateLayout();
		this.menu.box.set_layout_manager(menuLayout);
		this.menu.addMenuItem(this._volume.menu);
		this.actor.add_child(this.box);
	},

	destroy: function() {
		this.parent();
	}
});

const NetworkIndicator = new Lang.Class({
	Name: 'NetworkIndicator',
	Extends: PanelMenu.Button,

	_init: function() {
		this.parent(0.0, 'NetworkIndicator');
		this._bluetooth = null;
		this._network = new imports.ui.status.network.NMApplet();
		this._rfkill = new imports.ui.status.rfkill.Indicator();
		if (Config.HAVE_BLUETOOTH) {
			this._bluetooth = new imports.ui.status.bluetooth.Indicator();
		}
		this.box = new St.BoxLayout({ vertical: false, style_class: 'panel-status-menu-box' });
		this.box.add_child(this._rfkill.indicators);
		this.box.add_child(this._network.indicators);
		if (this._bluetooth) {
			this.box.add_child(this._bluetooth.indicators);
		}
		this.box.add_child(PopupMenu.arrowIcon(St.Side.BOTTOM));
		this.menu.actor.add_style_class_name('aggregate-menu');
		let menuLayout = new Panel.AggregateLayout();
		this.menu.box.set_layout_manager(menuLayout);
		
		this.menu.addMenuItem(this._network.menu);
		if (this._bluetooth) {
			this.menu.addMenuItem(this._bluetooth.menu);
		}
		this.menu.addMenuItem(this._rfkill.menu);
		
		menuLayout.addSizeChild(this._rfkill.menu.actor);
         
		this.actor.add_child(this.box);	
	},

	destroy: function() {
		this.parent();
	}
});

const NotificationIndicator = new Lang.Class({
	Name: 'NotificationIndicator',
	Extends: PanelMenu.Button,

	_init: function() {
        this.parent(0.0, 'NotificationIndicator');
        this.box = new St.BoxLayout({ vertical: false, style_class: 'panel-status-menu-box' });
        this.iconpanel =  new St.Icon({ icon_name:  'preferences-system-notifications-symbolic', style_class: 'system-status-icon' });
        this.icon = new imports.ui.dateMenu.MessagesIndicator();
        this._messageList = new imports.ui.calendar.CalendarMessageList();
        this.box.add_child(this.icon.actor);
        this.box.add_child(this.iconpanel);
        //this.box.add_child(PopupMenu.arrowIcon(St.Side.BOTTOM));
        let widget = new St.Widget();
        this.menu.box.add_child(widget);
        let boxmessage = new St.BoxLayout({ height:400, style:'border:10px;'});
        widget.add_actor(boxmessage);
        boxmessage.add(this._messageList.actor);
        this.actor.add_child(this.box);
	},

	destroy: function() {
		this.parent();
	}
});

const CalendarIndicator = new Lang.Class({
	Name: 'CalendarIndicator',
	Extends: PanelMenu.Button,


	_init: function() {
		this.parent(0.0, 'CalendarIndicator');
		this._calendar = new imports.ui.calendar.Calendar();
		this.box = new St.BoxLayout({ vertical: false, style_class: 'panel-status-menu-box' });
		this._clockDisplay = new St.Label({ y_align: Clutter.ActorAlign.CENTER });
		this.box.add_child(this._clockDisplay);
		//this.box.add_child(PopupMenu.arrowIcon(St.Side.BOTTOM));
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
		let widget = new St.Widget();
		this.menu.box.add_child(widget);
		let boxdate = new St.BoxLayout({ style_class: 'datemenu-calendar-column', vertical: true });
		widget.add_actor(boxdate);
		this._date = new imports.ui.dateMenu.TodayButton(this._calendar);
        this._eventList = new imports.ui.calendar.EventsSection();
		boxdate.add_actor(this._date.actor);
		boxdate.add(this._calendar.actor);
		this._displaysSection = new St.ScrollView({ style_class: 'datemenu-displays-section vfade', x_expand: true, x_fill: true, overlay_scrollbars: true });
		this._displaysSection.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC);
		boxdate.add_actor(this._displaysSection);
		let displaysBox = new St.BoxLayout({ vertical: true, style_class: 'datemenu-displays-box' });
		this._displaysSection.add_actor(displaysBox);
		this._clocksItem = new imports.ui.dateMenu.WorldClocksSection();
        displaysBox.add(this._eventList.actor, { x_fill: true });
        displaysBox.add(this._clocksItem.actor, { x_fill: true });
        //this._weatherItem = new imports.ui.dateMenu.WeatherSection(); // NOT WORKING!
        //displaysBox.add(this._weatherItem.actor, { x_fill: true });
		this._clock = new GnomeDesktop.WallClock();
		this._clock.bind_property('clock', this._clockDisplay, 'text', GObject.BindingFlags.SYNC_CREATE);
		Main.sessionMode.connect('updated', Lang.bind(this, this._sessionUpdated));
		this._sessionUpdated();
		this.actor.add_child(this.box);
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

		// Displays are not actually expected to launch Settings when activated
		// but the corresponding app (clocks, weather); however we can consider
		// that display-specific settings, so re-use 'allowSettings' here ...
		this._displaysSection.visible = Main.sessionMode.allowSettings;
	},

	destroy: function() {
		this.parent();
	}
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
	//Main.panel._rightBox.insert_child_at_index(dateMenu.container, children.length);
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