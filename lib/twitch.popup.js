(function() {
	var WIDTH = 660,
			HEIGHT = 600;

	// Shows a login popup using the NW.js API
	function popupNWLogin(params) {
		var url = Twitch.baseUrl + 'oauth2/authorize?' + param(params);

    var win = gui.Window.open(url, {
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
        config.session = parseFragment(w.location.hash);

        Twitch.getStatus(function(err, status) {
          if (status.authenticated) {
            Twitch.events.emit('auth.login', status);
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

	// Shows a login popup using the Electron API
	function popupElectronLogin(params) {
		var url = Twitch.baseUrl + 'oauth2/authorize?' + param(params);

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
        config.session = parseFragment(location.hash);

        Twitch.getStatus(function(err, status) {
          if (status.authenticated) {
            Twitch.events.emit('auth.login', status);
          }
        });

        win.close();
      }
      else {
        win.show();
      }
		});
	}

	// Shows a login popup for the current GUI platform.
	popupLogin = function(params) {
		switch(gui_type) {
			case 'nw':
				popupNWLogin(params);
				break;
			case 'electron':
				popupElectronLogin(params);
				break;
			default:
				throw new Error('The Twitch SDK was not initialized with any compatible GUI API.');
				break;
		}
	};
})();
