const util = require('./twitch.util');
const core = require('./twitch.core');
const auth = require('./twitch.auth');

var WIDTH = 660,
		HEIGHT = 600;

var gui_type = null;
var nwGUI = null;

// Shows a login popup using the NW.js 0.12 (or lower) API
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

// Shows a login popup using the NW.js 0.13 (or higher) API - EXPERIMENTAL!
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

// Shows a login popup using the Electron API
function popupElectronLogin(params) {
	var BrowserWindow = require('electron').remote.BrowserWindow;
	var url = core.REDIRECT_URL + 'oauth2/authorize?' + util.param(params);

	var win = new BrowserWindow({
		width: WIDTH,
		height: HEIGHT,
		resizable: false,
		show: false,
		"node-integration": false
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

function setGUIType(name, nwg) {
	gui_type = name;

	if ( gui_type == 'nw' ) {
		nwGUI = nwg;
	}
}
exports.setGUIType = setGUIType;

function isActive() {
	return (gui_type !== null);
}
exports.isActive = isActive;

// Shows a login popup for the current GUI platform.
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
			throw new Error('The Twitch SDK was not initialized with any compatible GUI API.');
			break;
	}
};
exports.popupLogin = popupLogin;
