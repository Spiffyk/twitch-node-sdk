/*jshint expr:true*/
(function() {
  var SESSION_KEY = 'twitch_oauth_session';
  var parseFragment = function(hash) {
    var match,
      session;

    hash = hash || document.location.hash;

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

  // Update session info from API and store
  var updateSession = function(callback) {
    Twitch.api({method: '/'}, function(err, response) {
      var session;
      if (err) {
        Twitch.log('error encountered updating session:', err);
        callback(err, null);
        return;
      }

      if (!response.token.valid) {
        // Invalid token. Clear our stored data
        session = {};
        Twitch._config.session = session;
        window.JSON && Twitch._storage.setItem(SESSION_KEY, JSON.stringify(session));
        // TODO: emit changed event
      }

      if (typeof callback === 'function') {
        callback(null, session);
      }
    });
  };

  // Get the current authentication status. Will try to use the stored session
  // if possible for speed.
  // The 'force' property will trigger an API request to update session data.
  var getStatus = function(options, callback) {
    if (typeof options === 'function') {
        callback = options;
    }
    if (typeof callback !== 'function') {
        callback = function() {};
    }
    if (!Twitch._config.session) {
      throw new Error('You must call init() before getStatus()');
    }

    var makeSession = function(session) {
      // Make a new session object for rendering to the user
      return {
        authenticated: !!session.token,
        token: session.token,
        scope: session.scope,
        error: session.error,
        errorDescription: session.errorDescription
      };
    };

    if (options && options.force) {
      updateSession(function(err, session) {
        callback(err, makeSession(session || Twitch._config.session));
      });
    } else {
      callback(null, makeSession(Twitch._config.session));
    }
  };

  // Login and redirect back to current page with an access token
  // The popup parameter can be used to authorize users without
  // leaving your page, as described in http://stackoverflow.com/a/3602045/100296
  // TODO: description about setting URI
  // Usage:
  // Twitch.login({
  //   redirect_uri: 'http://myappurl',
  //   popup: false,
  //   scope: ['user_read', 'channel_read']
  // });
  var login = function(options) {
    if (!options.scope) {
      throw new Error('Must specify list of requested scopes');
    }
    var params = {
      response_type: 'token',
      client_id: Twitch._config.clientId,
      redirect_uri: options.redirect_uri || window.location.href,
      scope: options.scope.join(' ')
    };

    if (!params.client_id) {
      throw new Error('You must call init() before login()');
    }
    
    var url = Twitch.baseUrl + 'oauth2/authorize?' + $.param(params);

    if (options.popup) {
      Twitch._config.loginPopup = window.open(url,
                          "Login with TwitchTV",
                          "height=450,width=680,resizable=yes,status=yes");
    } else {
      window.location = url;
    }
  };

  // Retrieve sessions from persistent storage and
  // persist new sessions.
  var initSession = function() {
    var storedSession;

    Twitch._config.session = {};
    // Retrieve sessions from persistent storage and
    // persist new sessions.
    if (window.JSON) {
      storedSession = Twitch._storage.getItem(SESSION_KEY);
      if (storedSession) {
        try {
          Twitch._config.session = JSON.parse(storedSession);
        } catch (e) {
          //
        }
      }
    }

    // overwrite with new params if page has them
    if (document.location.hash.match(/access_token=(\w+)/)) {
      Twitch._config.session = parseFragment();

      // Persist to session storage on browsers that support it,
      // cookies otherwise
      if (window.JSON) {
        Twitch._storage.setItem(SESSION_KEY, JSON.stringify(Twitch._config.session));
      }
    }
  };

  Twitch.extend({
    _initSession: initSession,
    _parseFragment: parseFragment,
    getStatus: getStatus,
    login: login
  });
})();