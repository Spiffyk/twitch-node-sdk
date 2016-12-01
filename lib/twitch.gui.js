/**
 * Implements login popups for Twitch
 * @module twitch-sdk
 * @submodule gui
 */

const URL = require('url');

const util = require('./twitch.util');
const core = require('./twitch.core');
const auth = require('./twitch.auth');

var WIDTH = 660,
		HEIGHT = 600;

var gui_type = null;
var nwGUI = null;

/**
 * Opens a login popup using NW.js's API version 0.12 or lower
 *
 * @private
 * @method popupNWLogin
 * @param {Array|Object} params
 */
function popupNWLogin(params) {
	var url = core.REDIRECT_URL + 'oauth2/authorize?' + util.param(params);

  var win = nwGUI.Window.open(url, {
    title: 'Login with TwitchTV',
    width: WIDTH,
    height: HEIGHT,
    toolbar: false,
    show: false,
    resizable: true
  });

  win.on('loaded', function() {
    var w = win.window;
    if (w.location.hostname == 'api.twitch.tv' && w.location.pathname == '/kraken/') {
      core.setSession(util.parseFragment(w.location.hash));

      auth.getStatus(function(err, status) {
        if (status.authenticated) {
          core.events.emit('auth.login', status);
        }
      });

      win.close();
    }
    else {
      win.show();
      win.focus();
    }
  });
}

/**
 * Opens a login popup using NW.js's API version 0.13 or higher
 *
 * **THIS IS EXPERIMENTAL AT THE MOMENT!**
 *
 * @private
 * @method popupNW13Login
 * @param {Array|Object} params
 */
function popupNW13Login(params) {
	var url = core.REDIRECT_URL + 'oauth2/authorize?' + util.param(params);

  nw.Window.open(url, {
    title: 'Login with TwitchTV',
    width: WIDTH,
    height: HEIGHT,
    id: 'login',
    resizable: true
  }, function(login) {
		login.on('loaded', function() {
      var w = this.window;
      if (w.location.hostname == 'api.twitch.tv' && w.location.pathname == '/kraken/') {
        core.setSession(util.parseFragment(w.location.hash));

        auth.getStatus(function(err, status) {
          if (status.authenticated) {
            core.events.emit('auth.login', status);
          }
        });

        this.close();
      }
			else {
        this.show();
        this.focus();
			}
    });
	});
}

/**
 * Opens a login popup using Electron's API
 *
 * @private
 * @method popupElectronLogin
 * @param {Array|Object} params
 */
function popupElectronLogin(params) {
	if ( require('electron').remote )
		BrowserWindow = require('electron').remote.BrowserWindow;
	else
		BrowserWindow = require('electron').BrowserWindow;

	var url = core.REDIRECT_URL + 'oauth2/authorize?' + util.param(params);

	var win = new BrowserWindow({
		width: WIDTH,
		height: HEIGHT,
		resizable: false,
		show: false,
		webPreferences:{
      nodeIntegration: false
    }
	});

	win.loadURL(url);
	win.webContents.on('did-finish-load', function() {
		var location = URL.parse(win.webContents.getURL());

		if (location.hostname == 'api.twitch.tv' && location.pathname == '/kraken/') {
      core.setSession(util.parseFragment(location.hash));

      auth.getStatus(function(err, status) {
        if (status.authenticated) {
          core.events.emit('auth.login', status);
        }
      });

      win.close();
    }
    else {
      win.show();
    }
	});
}

/**
 * Sets the GUI type
 *
 * @private
 * @method setGUIType
 * @param {String} name The GUI ID (`nw`, `nw13`, `electron`)
 * @param {Object} [nwg] The NW.js `nw.gui` object for NW.js v0.12 and lower
 */
function setGUIType(name, nwg) {
	gui_type = name;

	if ( gui_type == 'nw' ) {
		if ( nwg )
			nwGUI = nwg;
		else
			throw new Error('Did not get nw.gui object with GUI type "nw"');
	}
}
exports.setGUIType = setGUIType;

/**
 * Checks whether the SDK had been initialized with a GUI.
 * @private
 * @method isActive
 * @return {Boolean}
 */
function isActive() {
	return (gui_type !== null);
}
exports.isActive = isActive;

/**
 * Opens a login popup
 * @private
 * @method popupLogin
 * @param {Array|Object} params
 */
function popupLogin(params) {
	switch(gui_type) {
		case 'nw':
			popupNWLogin(params);
			break;
		case 'nw13':
			popupNW13Login(params);
			break;
		case 'electron':
			popupElectronLogin(params);
			break;
		default:
			throw new Error('The Twitch SDK was not initialized with any ' +
			                'compatible GUI API.');
			break;
	}
};
exports.popupLogin = popupLogin;
