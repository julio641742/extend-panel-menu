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
const GLib = imports.gi.GLib;
const Main = imports.ui.main;
const Clutter = imports.gi.Clutter;
const Config = imports.misc.config;
const PopupMenu = imports.ui.popupMenu;
const Gettext = imports.gettext.domain("extend-panel-menu");
const _ = Gettext.gettext;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const CustomButton = Extension.imports.indicators.button.CustomButton;

const GObject = imports.gi.GObject;
const Rfkill = imports.ui.status.rfkill;
const NetworkManager = imports.gi.NetworkManager;
const Util = imports.misc.util;
const Mainloop = imports.mainloop;

const NetworkIndicator = new Lang.Class({
    Name: "NetworkIndicator",
    Extends: CustomButton,

    _init: function () {
        this.parent("NetworkIndicator");
        this.menu.actor.add_style_class_name("aggregate-menu");

        this._network = null;
        this._bluetooth = null;
        this._rfkill = Main.panel.statusArea.aggregateMenu._rfkill;

        if (Config.HAVE_NETWORKMANAGER) {
            this._network = Main.panel.statusArea.aggregateMenu._network;
        }
        if (Config.HAVE_BLUETOOTH) {
            this._bluetooth = Main.panel.statusArea.aggregateMenu._bluetooth;
        }

        this._location = Main.panel.statusArea.aggregateMenu._location;

        Main.panel.statusArea.aggregateMenu._indicators.remove_actor(this._location.indicators);
        this.box.add_child(this._location.indicators);

        if (this._network) {
            this._emptySpace = new St.Label({
                text: ' ',
                y_align: Clutter.ActorAlign.CENTER,
                visible: this._network._vpnIndicator.visible,
            });
            this._network.indicators.remove_actor(this._network._primaryIndicator);
            this._network.indicators.remove_actor(this._network._vpnIndicator);
            this.box.add_child(this._network._primaryIndicator);
            this.box.add_child(this._emptySpace);
            this.box.add_child(this._network._vpnIndicator);
            this._vsignal = this._network._vpnIndicator.connect('notify::visible', Lang.bind(this, function (obj) {
                this._emptySpace.visible = obj.visible;
            }));
        }
        if (this._bluetooth) {
            this._emptySpace1 = new St.Label({
                text: ' ',
                y_align: Clutter.ActorAlign.CENTER,
                visible: this._bluetooth._indicator.visible,
            });
            this._bluetooth.indicators.remove_actor(this._bluetooth._indicator);
            this.box.add_child(this._emptySpace1);
            this.box.add_child(this._bluetooth._indicator);
            this._bsignal = this._bluetooth._indicator.connect('notify::visible', Lang.bind(this, function (obj) {
                this._emptySpace1.visible = obj.visible;
            }));
        }

        this._rfkill.indicators.remove_actor(this._rfkill._indicator);
        this.box.add_child(this._rfkill._indicator);

        this._arrowIcon = new St.Icon({
            icon_name: "go-bottom",
            style_class: "system-status-icon"
        });
        this.box.add_child(this._arrowIcon);

        // WIRELESS MENU
        this.wirelessMenu = new PopupMenu.PopupSubMenuMenuItem("", true);
        this.wirelessMenu.menu.box.add(new St.Label());
        this.menu.addMenuItem(this.wirelessMenu);
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        // TESTING

        if (this._network) {
            Main.panel.statusArea.aggregateMenu.menu.box.remove_actor(this._network.menu.actor);
            this.menu.addMenuItem(this._network.menu);
        }
        if (this._bluetooth) {
            Main.panel.statusArea.aggregateMenu.menu.box.remove_actor(this._bluetooth.menu.actor);
            this.menu.addMenuItem(this._bluetooth.menu);
        }

        Main.panel.statusArea.aggregateMenu.menu.box.remove_actor(this._location.menu.actor);
        this.menu.box.add_actor(this._location.menu.actor);

        Main.panel.statusArea.aggregateMenu.menu.box.remove_actor(this._rfkill.menu.actor);
        this.menu.addMenuItem(this._rfkill.menu);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        let network = new PopupMenu.PopupMenuItem(_("Network Settings"));
        network.connect("activate", Lang.bind(this, this._openApp, "gnome-network-panel.desktop"));
        this.menu.addMenuItem(network);

        this._rfkill._manager._proxy.connect("g-properties-changed", Lang.bind(this, this._sync));
        if (this._network) {
            this._network._primaryIndicator.connect("notify", Lang.bind(this, this._sync))
        }
        if (this._bluetooth) {
            this._bluetooth._proxy.connect("g-properties-changed", Lang.bind(this, this._sync));
        }
        this._sync();

        this._rfkill._sync();
        if (this._bluetooth) {
            this._bluetooth._sync();
        }


        // WIRELESS MENU
        this.menu.connect("open-state-changed", Lang.bind(this, function (menu, isOpen) {
            if (isOpen) {
                let nmdevices = Main.panel.statusArea.aggregateMenu._network._nmDevices;
                for (let i = 0; i < nmdevices.length; i++) {
                    if (nmdevices[i]._delegate instanceof imports.ui.status.network.NMDeviceWireless) {
                        this._devicewireless = nmdevices[i]._delegate;
                        //log('found');
                        break;
                    }
                };

                if (this._devicewireless && Main.panel.statusArea.aggregateMenu._network._client.wireless_hardware_enabled) {
                    //log("wirelesslist");
                    this._wirelesslist = new WirelessList(this._devicewireless._client, this._devicewireless._device, this._devicewireless._settings, this.wirelessMenu);
                    this._menuclosed = this.menu.connect('open-state-changed', Lang.bind(this, function (menu, isOpen) {
                        if (!isOpen) {
                            this._wirelesslist.destroy();
                            this._wirelesslist = null;
                            this.menu.disconnect(this._menuclosed);
                            this._menuclosed = null;
                            //log("destroyed");
                        }
                    }));
                }

            }
        }));

    },
    _sync: function () {
        this._arrowIcon.hide();
        if (this.box.get_width() == 0) {
            this._arrowIcon.show();
        }
    },
    destroy: function () {
        this._network._vpnIndicator.disconnect(this._vsignal);
        this._bluetooth._indicator.disconnect(this._bsignal);
        this.box.remove_child(this._location.indicators);
        this.menu.box.remove_actor(this._location.menu.actor);
        Main.panel.statusArea.aggregateMenu._indicators.add_actor(this._location.indicators);
        Main.panel.statusArea.aggregateMenu.menu.box.add_actor(this._location.menu.actor);
        this.box.remove_child(this._rfkill._indicator);
        this.menu.box.remove_actor(this._rfkill.menu.actor);
        this._rfkill.indicators.add_actor(this._rfkill._indicator);
        Main.panel.statusArea.aggregateMenu.menu.box.add_actor(this._rfkill.menu.actor);
        this.box.remove_child(this._network._primaryIndicator);
        this.box.remove_child(this._network._vpnIndicator);
        this.menu.box.remove_actor(this._network.menu.actor);
        this._network.indicators.add_actor(this._network._primaryIndicator);
        this._network.indicators.add_actor(this._network._vpnIndicator);
        Main.panel.statusArea.aggregateMenu.menu.box.add_actor(this._network.menu.actor);
        this.box.remove_child(this._bluetooth._indicator);
        this.menu.box.remove_actor(this._bluetooth.menu.actor);
        this._bluetooth.indicators.add_actor(this._bluetooth._indicator);
        Main.panel.statusArea.aggregateMenu.menu.box.add_actor(this._bluetooth.menu.actor);
        this.parent();
    },
});


const WirelessPopupMenuItem = new Lang.Class({
    Name: 'WirelessPopupMenuItem',
    Extends: PopupMenu.PopupBaseMenuItem,

    _init: function (network) {
        this.parent();

        this._network = network;
        this._ap = network.accessPoints[0];

        let title = imports.ui.status.network.ssidToLabel(this._ap.get_ssid());
        this.label = new St.Label({
            text: title,
            y_expand: true,
            y_align: Clutter.ActorAlign.CENTER
        });
        this.actor.add_child(this.label);
        this.actor.label_actor = this.label;

        this._icons = new St.BoxLayout({ style_class: 'nm-dialog-icons' });
        this.actor.add(this._icons, { expand: true, x_fill: false, x_align: St.Align.END });

        this._selectedIcon = new St.Icon({
            style_class: 'nm-dialog-icon',
            icon_name: 'object-select-symbolic'
        });
        this._icons.add_actor(this._selectedIcon);

        this._secureIcon = new St.Icon({ style_class: 'nm-dialog-icon' });
        if (this._ap._secType != imports.ui.status.network.NMAccessPointSecurity.NONE)
            this._secureIcon.icon_name = 'network-wireless-encrypted-symbolic';
        this._icons.add_actor(this._secureIcon);

        this._signalIcon = new St.Icon({ style_class: 'nm-dialog-icon' });
        this._icons.add_actor(this._signalIcon);

        this._sync();
    },

    _sync: function () {
        this._signalIcon.icon_name = this._getSignalIcon();
    },

    updateBestAP: function (ap) {
        this._ap = ap;
        this._sync();
    },

    setSelectedIcon: function (isActive) {
        this._selectedIcon.opacity = isActive ? 255 : 0;
    },

    _getSignalIcon: function () {
        if (this._ap.mode == imports.ui.status.network.NM80211Mode.ADHOC)
            return 'network-workgroup-symbolic';
        else
            return 'network-wireless-signal-' + imports.ui.status.network.signalToIcon(this._ap.strength) + '-symbolic';
    }
});


const WirelessList = new Lang.Class({
    Name: 'WirelessList',

    _init: function (client, device, settings, parent) {
        this._client = client;
        this._device = device;
        this.menu = parent;
        this.submenu = parent.menu;

        this._wirelessEnabledChangedId = this._client.connect('notify::wireless-enabled',
            Lang.bind(this, this._syncView));

        this._rfkill = Rfkill.getRfkillManager();
        this._airplaneModeChangedId = this._rfkill.connect('airplane-mode-changed',
            Lang.bind(this, this._syncView));

        this._networks = [];
        this._buildLayout();

        let connections = settings.list_connections();
        this._connections = connections.filter(Lang.bind(this, function (connection) {
            return device.connection_valid(connection);
        }));

        this._apAddedId = device.connect('access-point-added', Lang.bind(this, this._accessPointAdded));
        this._apRemovedId = device.connect('access-point-removed', Lang.bind(this, this._accessPointRemoved));
        this._activeApChangedId = device.connect('notify::active-access-point', Lang.bind(this, this._activeApChanged));

        // accessPointAdded will also create dialog items
        let accessPoints = device.get_access_points() || [];
        accessPoints.forEach(Lang.bind(this, function (ap) {
            this._accessPointAdded(this._device, ap);
        }));

        this._selectedNetwork = null;
        this._activeApChanged();
        this._updateSensitivity();
        this._syncView();

        this._scanTimeoutId = Mainloop.timeout_add_seconds(15, Lang.bind(this, this._onScanTimeout));
        GLib.Source.set_name_by_id(this._scanTimeoutId, '[gnome-shell] this._onScanTimeout');
        this._onScanTimeout();

        let id = Main.sessionMode.connect('updated', () => {
            if (Main.sessionMode.allowSettings)
                return;

            Main.sessionMode.disconnect(id);
            this.menu._parent.close();
        });
    },

    destroy: function () {
        if (this._apAddedId) {
            GObject.Object.prototype.disconnect.call(this._device, this._apAddedId);
            this._apAddedId = 0;
        }
        if (this._apRemovedId) {
            GObject.Object.prototype.disconnect.call(this._device, this._apRemovedId);
            this._apRemovedId = 0;
        }
        if (this._activeApChangedId) {
            GObject.Object.prototype.disconnect.call(this._device, this._activeApChangedId);
            this._activeApChangedId = 0;
        }
        if (this._wirelessEnabledChangedId) {
            this._client.disconnect(this._wirelessEnabledChangedId);
            this._wirelessEnabledChangedId = 0;
        }
        if (this._airplaneModeChangedId) {
            this._rfkill.disconnect(this._airplaneModeChangedId);
            this._airplaneModeChangedId = 0;
        }

        if (this._scanTimeoutId) {
            Mainloop.source_remove(this._scanTimeoutId);
            this._scanTimeoutId = 0;
        }

    },

    _onScanTimeout: function () {
        this._device.request_scan_simple(null);
        return GLib.SOURCE_CONTINUE;
    },

    _activeApChanged: function () {
        if (this._activeNetwork)
            this._activeNetwork.item.setSelectedIcon(false);

        this._activeNetwork = null;
        if (this._device.active_access_point) {
            let idx = this._findNetwork(this._device.active_access_point);
            if (idx >= 0)
                this._activeNetwork = this._networks[idx];
        }

        if (this._activeNetwork)
            this._activeNetwork.item.setSelectedIcon(true);
        this._updateSensitivity();
    },

    _updateSensitivity: function () {
        let connectSensitive = this._client.wireless_enabled && this._selectedNetwork && (this._selectedNetwork != this._activeNetwork);
        this.submenu.box.reactive = connectSensitive;
        this.submenu.box.can_focus = connectSensitive;
    },

    _syncView: function () {
        if (this._rfkill.airplaneMode) {
            this.menu.icon.icon_name = 'airplane-mode-symbolic';
            this.menu.label.set_text(_("Airplane Mode is On"));

        } else if (!this._client.wireless_enabled) {
            this.menu.icon.icon_name = 'dialog-information-symbolic';
            this.menu.label.set_text(_("Wi-Fi is Off"));

        } else if (this._networks.length == 0) {
            this.menu.icon.icon_name = 'dialog-information-symbolic';
            this.menu.label.set_text(_("No Networks"));

        } else {
            this.menu.icon.icon_name = 'network-wireless-signal-excellent-symbolic';
            this.menu.label.set_text(_("Wi-Fi Networks"));
            this.submenu.open();
        }
    },

    _buildLayout: function () {
        this._itemBox = new St.BoxLayout({ vertical: true });
        this.submenu.actor.add_actor(this._itemBox);
        this._scrollView = this.submenu.actor;
    },

    _connect: function () {
        let network = this._selectedNetwork;
        if (network.connections.length > 0) {
            let connection = network.connections[0];
            this._client.activate_connection(connection, this._device, null, null);
        } else {
            let accessPoints = network.accessPoints;
            if ((accessPoints[0]._secType == imports.ui.status.network.NMAccessPointSecurity.WPA2_ENT)
                || (accessPoints[0]._secType == imports.ui.status.network.NMAccessPointSecurity.WPA_ENT)) {
                // 802.1x-enabled APs require further configuration, so they're
                // handled in gnome-control-center
                Util.spawn(['gnome-control-center', 'network', 'connect-8021x-wifi',
                    this._device.get_path(), accessPoints[0].dbus_path]);
            } else {
                let connection = new NetworkManager.Connection();
                this._client.add_and_activate_connection(connection, this._device, accessPoints[0].dbus_path, null)
            }
        }
        this.menu._parent.close();
    },

    _notifySsidCb: function (accessPoint) {
        if (accessPoint.get_ssid() != null) {
            accessPoint.disconnect(accessPoint._notifySsidId);
            accessPoint._notifySsidId = 0;
            this._accessPointAdded(this._device, accessPoint);
        }
    },

    _getApSecurityType: function (accessPoint) {
        if (accessPoint._secType)
            return accessPoint._secType;

        let flags = accessPoint.flags;
        let wpa_flags = accessPoint.wpa_flags;
        let rsn_flags = accessPoint.rsn_flags;
        let type;
        if (rsn_flags != imports.ui.status.network.NM80211ApSecurityFlags.NONE) {
            //* RSN check first so that WPA+WPA2 APs are treated as RSN/WPA2 
            if (rsn_flags & imports.ui.status.network.NM80211ApSecurityFlags.KEY_MGMT_802_1X)
                type = imports.ui.status.network.NMAccessPointSecurity.WPA2_ENT;
            else if (rsn_flags & imports.ui.status.network.NM80211ApSecurityFlags.KEY_MGMT_PSK)
                type = imports.ui.status.network.NMAccessPointSecurity.WPA2_PSK;
        } else if (wpa_flags != imports.ui.status.network.NM80211ApSecurityFlags.NONE) {
            if (wpa_flags & imports.ui.status.network.NM80211ApSecurityFlags.KEY_MGMT_802_1X)
                type = imports.ui.status.network.NMAccessPointSecurity.WPA_ENT;
            else if (wpa_flags & imports.ui.status.network.NM80211ApSecurityFlags.KEY_MGMT_PSK)
                type = imports.ui.status.network.NMAccessPointSecurity.WPA_PSK;
        } else {
            if (flags & NM80211ApFlags.PRIVACY)
                type = imports.ui.status.network.NMAccessPointSecurity.WEP;
            else
                type = imports.ui.status.network.NMAccessPointSecurity.NONE;
        }

        // cache the found value to avoid checking flags all the time
        accessPoint._secType = type;
        return type;
    },

    _networkSortFunction: function (one, two) {
        let oneHasConnection = one.connections.length != 0;
        let twoHasConnection = two.connections.length != 0;

        // place known connections first
        // (-1 = good order, 1 = wrong order)
        if (oneHasConnection && !twoHasConnection)
            return -1;
        else if (!oneHasConnection && twoHasConnection)
            return 1;

        let oneStrength = one.accessPoints[0].strength;
        let twoStrength = two.accessPoints[0].strength;

        // place stronger connections first
        if (oneStrength != twoStrength)
            return oneStrength < twoStrength ? 1 : -1;

        let oneHasSecurity = one.security != imports.ui.status.network.NMAccessPointSecurity.NONE;
        let twoHasSecurity = two.security != imports.ui.status.network.NMAccessPointSecurity.NONE;

        // place secure connections first
        // (we treat WEP/WPA/WPA2 the same as there is no way to
        // take them apart from the UI)
        if (oneHasSecurity && !twoHasSecurity)
            return -1;
        else if (!oneHasSecurity && twoHasSecurity)
            return 1;

        // sort alphabetically
        return GLib.utf8_collate(one.ssidText, two.ssidText);
    },

    _networkCompare: function (network, accessPoint) {
        if (!imports.ui.status.network.ssidCompare(network.ssid, accessPoint.get_ssid()))
            return false;
        if (network.mode != accessPoint.mode)
            return false;
        if (network.security != this._getApSecurityType(accessPoint))
            return false;

        return true;
    },

    _findExistingNetwork: function (accessPoint) {
        for (let i = 0; i < this._networks.length; i++) {
            let network = this._networks[i];
            for (let j = 0; j < network.accessPoints.length; j++) {
                if (network.accessPoints[j] == accessPoint)
                    return { network: i, ap: j };
            }
        }

        return null;
    },

    _findNetwork: function (accessPoint) {
        if (accessPoint.get_ssid() == null)
            return -1;

        for (let i = 0; i < this._networks.length; i++) {
            if (this._networkCompare(this._networks[i], accessPoint))
                return i;
        }
        return -1;
    },

    _checkConnections: function (network, accessPoint) {
        this._connections.forEach(function (connection) {
            if (accessPoint.connection_valid(connection) &&
                network.connections.indexOf(connection) == -1) {
                network.connections.push(connection);
            }
        });
    },

    _accessPointAdded: function (device, accessPoint) {
        if (accessPoint.get_ssid() == null) {
            // This access point is not visible yet
            // Wait for it to get a ssid
            accessPoint._notifySsidId = accessPoint.connect('notify::ssid', Lang.bind(this, this._notifySsidCb));
            return;
        }

        let pos = this._findNetwork(accessPoint);
        let network;

        if (pos != -1) {
            network = this._networks[pos];
            if (network.accessPoints.indexOf(accessPoint) != -1) {
                log('Access point was already seen, not adding again');
                return;
            }

            Util.insertSorted(network.accessPoints, accessPoint, function (one, two) {
                return two.strength - one.strength;
            });
            network.item.updateBestAP(network.accessPoints[0]);
            this._checkConnections(network, accessPoint);

            this._resortItems();
        } else {
            network = {
                ssid: accessPoint.get_ssid(),
                mode: accessPoint.mode,
                security: this._getApSecurityType(accessPoint),
                connections: [],
                item: null,
                accessPoints: [accessPoint]
            };
            network.ssidText = imports.ui.status.network.ssidToLabel(network.ssid);
            this._checkConnections(network, accessPoint);

            let newPos = Util.insertSorted(this._networks, network, this._networkSortFunction);
            this._createNetworkItem(network);
            this._itemBox.insert_child_at_index(network.item.actor, newPos);
        }

        this._syncView();
    },

    _accessPointRemoved: function (device, accessPoint) {
        let res = this._findExistingNetwork(accessPoint);

        if (res == null) {
            log('Removing an access point that was never added');
            return;
        }

        let network = this._networks[res.network];
        network.accessPoints.splice(res.ap, 1);

        if (network.accessPoints.length == 0) {
            network.item.actor.destroy();
            this._networks.splice(res.network, 1);
        } else {
            network.item.updateBestAP(network.accessPoints[0]);
            this._resortItems();
        }

        this._syncView();
    },

    _resortItems: function () {
        let adjustment = this._scrollView.vscroll.adjustment;
        let scrollValue = adjustment.value;

        this._itemBox.remove_all_children();
        this._networks.forEach(Lang.bind(this, function (network) {
            this._itemBox.add_child(network.item.actor);
        }));

        adjustment.value = scrollValue;
    },

    _selectNetwork: function (network) {
        //if (this._selectedNetwork)
        //    this._selectedNetwork.item.actor.remove_style_pseudo_class('selected');

        this._selectedNetwork = network;
        this._updateSensitivity();

        //if (this._selectedNetwork)
        //    this._selectedNetwork.item.actor.add_style_pseudo_class('selected');
    },

    _createNetworkItem: function (network) {
        network.item = new WirelessPopupMenuItem(network);
        network.item.setSelectedIcon(network == this._selectedNetwork);
        network.item.connect("activate", Lang.bind(this, function () {
            Util.ensureActorVisibleInScrollView(this._scrollView, network.item.actor);
            this._selectNetwork(network);
            this._connect();
        }));
    },
});
