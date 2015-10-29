/*jshint expr:true*/
/*global Twitch*/
// ## Authentication
(function() {
  // Key of the sessionStorage object or cookie.
  var SESSION_KEY = 'twitch_oauth_session';
  parseFragment = function(hash) {
    if (!hash) {
      throw new Error('A hash must be specified');
    }

    var match,
      session;

    var hashMatch = function(expr) {
      var match = hash.match(expr);
      return match ? match[1] : null;
    };

    session = {
      token: hashMatch(/access_token=(\w+)/),
      scope: hashMatch(/scope=([\w+]+)/) ? hashMatch(/scope=([\w+]+)/).split('+') : null,
      state: hashMatch(/state=(\w+)/),
      error: hashMatch(/error=(\w+)/),
      errorDescription: hashMatch(/error_description=(\w+)/)
    };

    return session;
  };

  // Update session info from API and store.
  var updateSession = function(callback) {
    Twitch.api({method: '/'}, function(err, response) {
      var session;
      if (err) {
        Twitch.log('error encountered updating session:', err);
        callback && callback(err, null);
        return;
      }

      if (!response.token.valid) {
        // Invalid token. Either it has expired or the user has
        // revoked permission, so clear out our stored data.
        Twitch.logout(callback);
        return;
      }

      callback && callback(null, session);
    });
  };

  // Make a session object for the client.
  var makeSession = function(session) {
    return {
      authenticated: !!session.token,
      token: session.token,
      scope: session.scope,
      error: session.error,
      errorDescription: session.errorDescription
    };
  };

  // Get the currently stored OAuth token.
  // Useful for sending OAuth tokens to your backend.
  var getToken = function() {
    return config.session && config.session.token;
  };

  // Get the current authentication status. Will try to use the stored session
  // if possible for speed.
  // The `force` property will trigger an API request to update session data.
  var getStatus = function(options, callback) {
    if (typeof options === 'function') {
        callback = options;
    }
    if (typeof callback !== 'function') {
        callback = function() {};
    }
    if (!config.session) {
      throw new Error('You must call init() before getStatus()');
    }

    if (options && options.force) {
      updateSession(function(err, session) {
        callback(err, makeSession(session || config.session));
      });
    } else {
      callback(null, makeSession(config.session));
    }
  };

  // Login and redirect back to current page with an access token
  // The popup parameter can be used to authorize users without
  // leaving your page, as described [here](http://stackoverflow.com/a/3602045/100296).
  // **TODO**: description about setting URI
  //
  // Usage:
  //
  //     Twitch.login({
  //       redirect_uri: 'http://myappurl.com/myoauthreturn',
  //       popup: false,
  //       scope: ['user_read', 'channel_read']
  //     });
  var login = function(options) {
    if (!gui_type) {
      throw new Error('Cannot login without a GUI.');
    }

    if (!options.scope) {
      throw new Error('Must specify list of requested scopes');
    }
    var params = {
      response_type: 'token',
      client_id: config.clientId,
      redirect_uri: 'https://api.twitch.tv/kraken/',
      scope: options.scope.join(' '),
    };

    if(options.force_verify) {
      params.force_verify = true;
    }

    if (!params.client_id) {
      throw new Error('You must call init() before login()');
    }

    popupLogin(params);
  };

  // Reset the session and delete from persistent storage, which is
  // akin to logging out. This does not deactivate the access token
  // given to your app, so you can continue to perform actions if
  // your server stored the token.
  //
  // Usage:
  //
  //     Twitch.logout(function(error) {
  //       // the user is now logged out
  //     });
  var logout = function(callback) {
    // Reset the current session
    config.session = {};

    Twitch.events.emit('auth.logout');
    if (typeof callback === 'function') {
      callback(null);
    }
  };

  // Retrieve sessions from persistent storage and
  // persist new ones.
  initSession = function(storedSession, callback) {
    if (typeof storedSession === "function") {
      callback = storedSession;
    }

    config.session = (storedSession && makeSession(storedSession)) || {};

    getStatus({ force: true }, function(err, status) {
      if (status.authenticated) {
        Twitch.events.emit('auth.login', status);
      }

      if (typeof callback === "function") {
        callback(err, status);
      }
    });
  };

  Twitch.extend({
    getToken: getToken,
    getStatus: getStatus,
    login: login,
    logout: logout
  });
})();
