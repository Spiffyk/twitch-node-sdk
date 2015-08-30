var https = require('https');
var fs = require('fs');
var path = require('path');

var gui = false;

var Twitch, storage, initSession, parseFragment,
	config = {};

function param(array) {
	var i = 0;
	var result = '';

	for ( var name in array ) {
		if ( i != 0 ) {
			result += '&';
		}

		result += name + '=' + array[name];

		i++;
	}

	return result;
}
// ## Core
;(function() {
  // Wait five seconds for the API request before timing out.
  var HTTP_CODES = {
    unauthorized: 401
  };

  Twitch = {
    baseUrl: 'https://api.twitch.tv/kraken/',
    baseHost: 'api.twitch.tv',
    basePath: '/kraken/',
    extend: function(options) {
    	var target = Twitch;

  		if (options != null) {
  			for (var name in options) {
  				target[name] = options[name];
  			}
  		}
    }
  };

  // Perform requests to the TwitchTV API. This is a fairly low-level
  // interface, so most clients are better served by using a related
  // high-level function if one exists.
  Twitch.api = function(options, callback) {
    if (!config.session) {
      throw new Error('You must call init() before api()');
    }

    var params = options.params || {};
    callback = callback || function() {};

    var authenticated = !!config.session.token,
      url = Twitch.basePath + (options.url || options.method || '');

    if (authenticated) params.oauth_token = config.session.token;


    var request_options = {
      host: Twitch.baseHost,
      path: url + '?' + param(params),
      method: options.verb || 'GET',
      headers: {
        "Accept": "application/vnd.twitchtv.v3+json",
        "Client-ID": config.clientId
      }
    };

    var req = https.request(request_options, function(res) {
      Twitch.log('Response status:', res.statusCode, res.statusMessage);
      res.setEncoding('utf8');

      var responseBody = "";
      res.on('data', function(data) {
        responseBody += data;
      });

      res.on('end', function() {
        var data = JSON.parse(responseBody);

        if (res.statusCode >= 200 && res.statusCode < 300) { // Status 2xx means success
          Twitch.log('Response Data:', data);
          callback(null, data || null);
        }
        else {
          if (authenticated && res.statusCode === HTTP_CODES.unauthorized) {
            Twitch.logout(function() {
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
      Twitch.log('API Error:', e);
      callback(e, null);
    });

    req.end();
  }

  // Log messages to the browser console if available, prefixed
  // with `[Twitch]`.
  Twitch.log = function(message) {
    Array.prototype.unshift.call(arguments, '[Twitch]');
    console.log.apply(console, arguments);
  };
})();
// ## Initialization
(function() {

  // Initialize the library.
  //
  // Accepts an options object specifying
  // your appplication's __client id__, recieved after
  // app creation on TwitchTV.
  //
  // Typical initialization:
  //
  //     <script>
  //     Twitch.init({
  //       clientId: YOUR_CLIENT_ID
  //     }, function(err, status) {
  //       console.log('the library is now loaded')
  //     });
  //     </script>
  //
  var init = function(options, callback) {
    if (!options.clientId) {
      throw new Error('client id not specified');
    }

    config.clientId = options.clientId;

    if (options.nw) {
      gui = options.nw;
    }

    initSession(options.session, callback);
  };

  Twitch.extend({
    init: init
  });
})();
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
    if (!gui) {
      throw new Error('Cannot login without NW.js-compatible GUI.');
    }

    if (!options.scope) {
      throw new Error('Must specify list of requested scopes');
    }
    var params = {
      response_type: 'token',
      client_id: config.clientId,
      redirect_uri: 'https://api.twitch.tv/kraken/',
      scope: options.scope.join(' ')
    };

    if (!params.client_id) {
      throw new Error('You must call init() before login()');
    }

    var url = Twitch.baseUrl + 'oauth2/authorize?' + param(params);

    var win = gui.Window.open(url, {
      title: 'Login with TwitchTV',
      width: 660,
      height: 600,
      toolbar: false,
      show: false,
      resizable: true
    });

    win.on('loaded', function() {
      var w = win.window;
      if (w.location.hostname == 'api.twitch.tv' && w.location.pathname == '/kraken/') {
        config.session = parseFragment(w.location.hash);

        getStatus(function(err, status) {
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
// ## Events
/**
 * EventEmitter v3.1.4
 * https://github.com/Wolfy87/EventEmitter
 *
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 * Oliver Caldwell (olivercaldwell.co.uk)
 */

(function() {
  /**
   * EventEmitter class
   * Creates an object with event registering and firing methods
   */
  function EventEmitter() {
    // Initialise required storage variables
    this._events = {};
    this._maxListeners = 10;
  }
  
  /**
   * Event class
   * Contains Event methods and property storage
   *
   * @param {String} type Event type name
   * @param {Function} listener Function to be called when the event is fired
   * @param {Object} scope Object that this should be set to when the listener is called
   * @param {Boolean} once If true then the listener will be removed after the first call
   * @param {Object} instance The parent EventEmitter instance
   */
  function Event(type, listener, scope, once, instance) {
    // Store arguments
    this.type = type;
    this.listener = listener;
    this.scope = scope;
    this.once = once;
    this.instance = instance;
  }
  
  /**
   * Executes the listener
   *
   * @param {Array} args List of arguments to pass to the listener
   * @return {Boolean} If false then it was a once event
   */
  Event.prototype.fire = function(args) {
    this.listener.apply(this.scope || this.instance, args);
    
    // Remove the listener if this is a once only listener
    if(this.once) {
      this.instance.removeListener(this.type, this.listener, this.scope);
      return false;
    }
  };
  
  /**
   * Passes every listener for a specified event to a function one at a time
   *
   * @param {String} type Event type name
   * @param {Function} callback Function to pass each listener to
   * @return {Object} The current EventEmitter instance to allow chaining
   */
  EventEmitter.prototype.eachListener = function(type, callback) {
    // Initialise variables
    var i = null,
      possibleListeners = null,
      result = null;
    
    // Only loop if the type exists
    if(this._events.hasOwnProperty(type)) {
      possibleListeners = this._events[type];
      
      for(i = 0; i < possibleListeners.length; i += 1) {
        result = callback.call(this, possibleListeners[i], i);
        
        if(result === false) {
          i -= 1;
        }
        else if(result === true) {
          break;
        }
      }
    }
    
    // Return the instance to allow chaining
    return this;
  };
  
  /**
   * Adds an event listener for the specified event
   *
   * @param {String} type Event type name
   * @param {Function} listener Function to be called when the event is fired
   * @param {Object} scope Object that this should be set to when the listener is called
   * @param {Boolean} once If true then the listener will be removed after the first call
   * @return {Object} The current EventEmitter instance to allow chaining
   */
  EventEmitter.prototype.addListener = function(type, listener, scope, once) {
    // Create the listener array if it does not exist yet
    if(!this._events.hasOwnProperty(type)) {
      this._events[type] = [];
    }
    
    // Push the new event to the array
    this._events[type].push(new Event(type, listener, scope, once, this));
    
    // Emit the new listener event
    this.emit('newListener', type, listener, scope, once);
    
    // Check if we have exceeded the maxListener count
    // Ignore this check if the count is 0
    // Also don't check if we have already fired a warning
    if(this._maxListeners && !this._events[type].warned && this._events[type].length > this._maxListeners) {
      // The max listener count has been exceeded!
      Twitch.log('Possible EventEmitter memory leak detected. ' + this._events[type].length + ' listeners added. Use emitter.setMaxListeners() to increase limit.');
      
      // Set the flag so it doesn't fire again
      this._events[type].warned = true;
    }
    
    // Return the instance to allow chaining
    return this;
  };
  
  /**
   * Alias of the addListener method
   *
   * @param {String} type Event type name
   * @param {Function} listener Function to be called when the event is fired
   * @param {Object} scope Object that this should be set to when the listener is called
   * @param {Boolean} once If true then the listener will be removed after the first call
   */
  EventEmitter.prototype.on = EventEmitter.prototype.addListener;
  
  /**
   * Alias of the addListener method but will remove the event after the first use
   *
   * @param {String} type Event type name
   * @param {Function} listener Function to be called when the event is fired
   * @param {Object} scope Object that this should be set to when the listener is called
   * @return {Object} The current EventEmitter instance to allow chaining
   */
  EventEmitter.prototype.once = function(type, listener, scope) {
    return this.addListener(type, listener, scope, true);
  };
  
  /**
   * Removes the a listener for the specified event
   *
   * @param {String} type Event type name the listener must have for the event to be removed
   * @param {Function} listener Listener the event must have to be removed
   * @param {Object} scope The scope the event must have to be removed
   * @return {Object} The current EventEmitter instance to allow chaining
   */
  EventEmitter.prototype.removeListener = function(type, listener, scope) {
    this.eachListener(type, function(currentListener, index) {
      // If this is the listener remove it from the array
      // We also compare the scope if it was passed
      if(currentListener.listener === listener && (!scope || currentListener.scope === scope)) {
        this._events[type].splice(index, 1);
      }
    });
    
    // Remove the property if there are no more listeners
    if(this._events[type] && this._events[type].length === 0) {
      delete this._events[type];
    }
    
    // Return the instance to allow chaining
    return this;
  };
  
  /**
   * Alias of the removeListener method
   *
   * @param {String} type Event type name the listener must have for the event to be removed
   * @param {Function} listener Listener the event must have to be removed
   * @param {Object} scope The scope the event must have to be removed
   * @return {Object} The current EventEmitter instance to allow chaining
   */
  EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
  
  /**
   * Removes all listeners for a specified event
   * If no event type is passed it will remove every listener
   *
   * @param {String} type Event type name to remove all listeners from
   * @return {Object} The current EventEmitter instance to allow chaining
   */
  EventEmitter.prototype.removeAllListeners = function(type) {
    // Check for a type, if there is none remove all listeners
    // If there is a type however, just remove the listeners for that type
    if(type && this._events.hasOwnProperty(type)) {
      delete this._events[type];
    }
    else if(!type) {
      this._events = {};
    }
    
    // Return the instance to allow chaining
    return this;
  };
  
  /**
   * Retrieves the array of listeners for a specified event
   *
   * @param {String} type Event type name to return all listeners from
   * @return {Array} Will return either an array of listeners or an empty array if there are none
   */
  EventEmitter.prototype.listeners = function(type) {
    // Return the array of listeners or an empty array if it does not exist
    if(this._events.hasOwnProperty(type)) {
      // It does exist, loop over building the array
      var listeners = [];
      
      this.eachListener(type, function(evt) {
        listeners.push(evt.listener);
      });
      
      return listeners;
    }
    
    return [];
  };
  
  /**
   * Emits an event executing all appropriate listeners
   * All values passed after the type will be passed as arguments to the listeners
   *
   * @param {String} type Event type name to run all listeners from
   * @return {Object} The current EventEmitter instance to allow chaining
   */
  EventEmitter.prototype.emit = function(type) {
    // Calculate the arguments
    var args = [],
      i = null;
    
    for(i = 1; i < arguments.length; i += 1) {
      args.push(arguments[i]);
    }
    
    this.eachListener(type, function(currentListener) {
      return currentListener.fire(args);
    });
    
    // Return the instance to allow chaining
    return this;
  };
  
  /**
   * Sets the max listener count for the EventEmitter
   * When the count of listeners for an event exceeds this limit a warning will be printed
   * Set to 0 for no limit
   *
   * @param {Number} maxListeners The new max listener limit
   * @return {Object} The current EventEmitter instance to allow chaining
   */
  EventEmitter.prototype.setMaxListeners = function(maxListeners) {
    this._maxListeners = maxListeners;
    
    // Return the instance to allow chaining
    return this;
  };
  
  // Export the class
  Twitch.extend({
    events: new EventEmitter()
  });
}());
module.exports = Twitch;
