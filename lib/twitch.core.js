/**
 * Implements the `api` method for communication with the Twitch API servers
 * @module twitch-sdk
 * @submodule core
 */

const https = require('https');

const auth = require('./twitch.auth');
const util = require('./twitch.util');

const EventEmitter = require('events').EventEmitter;
const events = new EventEmitter();
exports.events = events;

var HTTP_CODES = {
  unauthorized: 401
};

const REDIRECT_URL = 'https://api.twitch.tv/kraken/';
exports.REDIRECT_URL = REDIRECT_URL;
const REDIRECT_HOST = 'api.twitch.tv';
exports.REDIRECT_HOST = REDIRECT_HOST;
const REDIRECT_PATH = '/kraken/';
exports.REDIRECT_PATH = REDIRECT_PATH;

var clientId = null;
exports.clientId = null;

/**
 * Sets the client ID
 * @private @method setClientId
 * @param {String} client_id The client ID to set
 */
function setClientId(client_id) {
  exports.clientId = clientId = client_id;
}
exports.setClientId = setClientId;

var session = null;
exports.session = null;

/**
 * Sets the session
 * @private @method setSession
 * @param {Object} Session object
 */
function setSession(new_session) {
  exports.session = session = new_session;
}
exports.setSession = setSession;

/**
 * Performs asynchronous calls to the Twitch API.
 *
 * `options` can have the following fields:
 *
 * * `method` - The method of the API like `channel`.
 *
 * * `params` - The parameters to augment the amount or type of data received.
 *
 * * `verb` - The HTTP method like `GET`, `PUT` and `DELETE`
 * @method api
 * @param {Object} options The object containing options
 * @param {function(err, data)} [callback]
 */
function api(options, callback) {
  if (!session) {
    throw new Error('You must call init() before api()');
  }

  var params = options.params || {};
  callback = callback || function() {};

  var authenticated = !!session.token,
    url = REDIRECT_PATH + (options.url || options.method || '');

  if (authenticated) params.oauth_token = session.token;


  var request_options = {
    host: REDIRECT_HOST,
    path: url + '?' + util.param(params),
    method: options.verb || 'GET',
    headers: {
      "Accept": "application/vnd.twitchtv.v3+json",
      "Client-ID": clientId
    }
  };

  var req = https.request(request_options, function(res) {
    log('Response status:', res.statusCode, res.statusMessage);
    res.setEncoding('utf8');

    var responseBody = "";
    res.on('data', function(data) {
      responseBody += data;
    });

    res.on('end', function() {
      var data = JSON.parse(responseBody);

      if (res.statusCode >= 200 && res.statusCode < 300) { // Status 2xx means success
        log('Response Data:', data);
        callback(null, data || null);
      }
      else {
        if (authenticated && res.statusCode === HTTP_CODES.unauthorized) {
          auth.logout(function() {
            callback(data, null);
          });
        }
        else {
          callback(data, null);
        }
      }
    });
  });

  req.on('error', function (e) {
    log('API Error:', e);
    callback(e, null);
  });

  req.end();
}
exports.api = api;

/**
 * Logs messages to the console, prefixed with `[Twitch]`
 * @private @method log
 * @param {any} arguments Any number of arguments, fed to the console.
 */
function log() {
  Array.prototype.unshift.call(arguments, '[Twitch]');
  console.log.apply(console, arguments);
};
exports.log = log;
