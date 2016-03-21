/**
 * Addresses user authentication
 * @module twitch-sdk
 * @submodule auth
 */

const core = require('./twitch.core');
const gui = require('./twitch.gui');

// Key of the sessionStorage object or cookie.
var SESSION_KEY = 'twitch_oauth_session';

/**
 * Updates session info from the API.
 *
 * @private @method updateSession
 */
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

/**
 * Creates a session object
 *
 * @private @method makeSession
 * @return {Object} Created session
 */
function makeSession(session) {
  return {
    authenticated: !!session.token,
    token: session.token,
    scope: session.scope,
    error: session.error,
    errorDescription: session.errorDescription
  };
};

/**
 * Gets the currently stored OAuth token.
 * Useful for sending OAuth tokens to your backend.
 *
 * @method getToken
 * @return {String|Boolean} The stored token or `false` if none found
 */
function getToken() {
  return core.session && core.session.token;
};
exports.getToken = getToken;

/**
 * Gets the current authentication status.
 * The `force` property will trigger an API request to update session data.
 *
 * @method getStatus
 * @param {Object} options
 * @param {function} [callback]
 */
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

/**
 * Opens a login popup for Twitch if the SDK was initialized with a GUI
 *
 * @method login
 * @param {Object} options
 * @example
 * ```javascript
 * Twitch.login({
 *  scope: ['user_read', 'channel_read']
 * });
 * ```
 */
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

/**
 * Resets the session, which is akin to logging out. This does not deactivate
 * the access token given to your app, so you can continue to perform actions
 * if your server stored the token.
 * @method logout
 * @param {Function} [callback]
 * @example
 * ```javascript
 * Twitch.logout(function(error) {
 *   // the user is now logged out
 * });
 * ```
 */
function logout(callback) {
  // Reset the current session
  core.setSession({});

  core.events.emit('auth.logout');
  if (typeof callback === 'function') {
    callback(null);
  }
};
exports.logout = logout;

/**
 * Sets session to a stored one.
 *
 * @private
 * @method initSession
 * @param {Object} storedSession
 * @param {Function} [callback]
 */
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
