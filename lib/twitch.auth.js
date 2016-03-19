const core = require('./twitch.core');
const gui = require('./twitch.gui');

// Key of the sessionStorage object or cookie.
var SESSION_KEY = 'twitch_oauth_session';

// Update session info from API and store.
function updateSession(callback) {
  core.api({method: '/'}, function(err, response) {
    var session;
    if (err) {
      core.log('error encountered updating session:', err);
      callback && callback(err, null);
      return;
    }

    if (!response.token.valid) {
      // Invalid token. Either it has expired or the user has
      // revoked permission, so clear out our stored data.
      logout(callback);
      return;
    }

    callback && callback(null, session);
  });
};

// Make a session object for the client.
function makeSession(session) {
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
function getToken() {
  return core.session && core.session.token;
};
exports.getToken = getToken;

// Get the current authentication status. Will try to use the stored session
// if possible for speed.
// The `force` property will trigger an API request to update session data.
function getStatus(options, callback) {
  if (typeof options === 'function') {
      callback = options;
  }
  if (typeof callback !== 'function') {
      callback = function() {};
  }
  if (!core.session) {
    throw new Error('You must call init() before getStatus()');
  }

  if (options && options.force) {
    updateSession(function(err, session) {
      callback(err, makeSession(session || core.session));
    });
  } else {
    callback(null, makeSession(core.session));
  }
};
exports.getStatus = getStatus;

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
function login(options) {
  if (!gui.isActive()) {
    throw new Error('Cannot login without a GUI.');
  }

  if (!options.scope) {
    throw new Error('Must specify list of requested scopes');
  }
  var params = {
    response_type: 'token',
    client_id: core.clientId,
    redirect_uri: 'https://api.twitch.tv/kraken/',
    scope: options.scope.join(' '),
  };

  if(options.force_verify) {
    params.force_verify = true;
  }

  if (!params.client_id) {
    throw new Error('You must call init() before login()');
  }

  gui.popupLogin(params);
};
exports.login = login;

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
function logout(callback) {
  // Reset the current session
  core.setSession({});

  core.events.emit('auth.logout');
  if (typeof callback === 'function') {
    callback(null);
  }
};
exports.logout = logout;

// Retrieve sessions from persistent storage and
// persist new ones.
function initSession(storedSession, callback) {
  if (typeof storedSession === "function") {
    callback = storedSession;
  }

  core.setSession((storedSession && makeSession(storedSession)) || {});

  getStatus({ force: true }, function(err, status) {
    if (status.authenticated) {
      core.events.emit('auth.login', status);
    }

    if (typeof callback === "function") {
      callback(err, status);
    }
  });
};
exports.initSession = initSession;
