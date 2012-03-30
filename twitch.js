// ## Core
;(function($) {
  // Wait five seconds for the API request before timing out.
  var REQUEST_TIMEOUT = 5000;

  var Twitch = {
    $: $,
    baseUrl: 'http://beta.twitch.tv/kraken/',
    _config: {},
    extend: function(src) {
      $.extend(Twitch, src);
    }
  };

  // Perform requests to the TwitchTV API. This is a fairly low-level
  // interface, so most clients are better served by using a related
  // high-level function if one exists.
  Twitch.api = function(options, callback) {
    if (!Twitch._config.session) {
      throw new Error('You must call init() before api()');
    }
    var params = options.params || {};
    callback = callback || function() {};

    var authenticated = !!Twitch._config.session.token,
      url = Twitch.baseUrl + (options.method || '');

    if (authenticated) {
      params.oauth_token = Twitch._config.session.token;
    }

    // When using JSONP, any error response will have a
    // `200` HTTP status code with the actual code in the body
    // so we can parse them.
    $.ajax({
      url: url + '?' + $.param(params),
      dataType: 'jsonp',
      timeout : REQUEST_TIMEOUT
    })
    .done(function(data) {
      Twitch.log('Response Data:');
      Twitch.log(data);
      if (data.error) {
        Twitch.log('API Error:', data.error + ';', data.message);
        callback(data, null);
        return;
      }
      callback(null, data);
    })
    .fail(function() {
      // Forced fail by request timeout; we have no
      // way of knowing the actual error with JSONP.
      callback(new Error('Request Timeout'), null);
    });
  };

  // Log messages to the browser console if available, prefixed
  // with `[Twitch]`.
  Twitch.log = function(message) {
    Array.prototype.unshift.call(arguments, '[Twitch]');
    if (window.console) {
      console.log.apply(console, arguments);
    }
  };

  window.Twitch = Twitch;
// Support either [jQuery](http://jquery.com) or [Zepto](http://zeptojs.com).
})(window.jQuery || window.Zepto);
// ## Storage
// Persistence layer for the SDK on top of sessionStorage, with
// a cookie fallback for older browsers.
(function() {
  // Adapted from remy's [DOM storage polyfill][].
  // [DOM storage polyfill]: https://gist.github.com/350433

  var store = window.sessionStorage;

  if (!store) {
    (function () {
      var Storage = function (type) {
        function createCookie(name, value, days) {
          var date, expires;

          if (days) {
            date = new Date();
            date.setTime(date.getTime()+(days*24*60*60*1000));
            expires = "; expires="+date.toGMTString();
          } else {
            expires = "";
          }
          document.cookie = name+"="+value+expires+"; path=/";
        }

        function readCookie(name) {
          var nameEQ = name + "=",
              ca = document.cookie.split(';'),
              i, c;

          for (i=0; i < ca.length; i++) {
            c = ca[i];
            while (c.charAt(0)==' ') {
              c = c.substring(1,c.length);
            }

            if (c.indexOf(nameEQ) === 0) {
              return c.substring(nameEQ.length,c.length);
            }
          }
          return null;
        }
        
        function setData(data) {
          data = JSON.stringify(data);
          if (type == 'session') {
            window.name = data;
          } else {
            createCookie('localStorage', data, 365);
          }
        }
        
        function clearData() {
          if (type == 'session') {
            window.name = '';
          } else {
            createCookie('localStorage', '', 365);
          }
        }
        
        function getData() {
          var data = type == 'session' ? window.name : readCookie('localStorage');
          return data ? JSON.parse(data) : {};
        }

        // initialise if there's already data
        var data = getData();

        return {
          length: 0,
          clear: function () {
            data = {};
            this.length = 0;
            clearData();
          },
          getItem: function (key) {
            return data[key] === undefined ? null : data[key];
          },
          key: function (i) {
            // not perfect, but works
            var ctr = 0;
            for (var k in data) {
              if (ctr == i) {
                return k;
              } else {
                ctr++;
              }
            }
            return null;
          },
          removeItem: function (key) {
            delete data[key];
            this.length--;
            setData(data);
          },
          setItem: function (key, value) {
            data[key] = value+''; // forces the value to a string
            this.length++;
            setData(data);
          }
        };
      };

      store = new Storage('session');
    })();
  }

  Twitch.extend({
    _storage: store
  });

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
  //     }, function() {
  //       console.log('the library is now loaded')
  //     });
  //     </script>
  //
  var init = function(options, callback) {
    if (!options.clientId) {
      throw new Error('client id not specified');
    }

    Twitch._config.clientId = options.clientId;
    Twitch._initSession();

    if (typeof callback === 'function') {
      callback(null);
    }
  };

  Twitch.extend({
    init: init
  });
})();
/*jshint expr:true*/
// ## Authentication
(function() {
  // Key of the sessionStorage object or cookie.
  var SESSION_KEY = 'twitch_oauth_session',
    $ = Twitch.$;
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

  // Update session info from API and store.
  var updateSession = function(callback) {
    Twitch.api({method: '/'}, function(err, response) {
      var session;
      if (err) {
        Twitch.log('error encountered updating session:', err);
        callback(err, null);
        return;
      }

      if (!response.token.valid) {
        // Invalid token. Either it has expired or the user has
        // revoked permission, so clear out our stored data.
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
  // The `force` property will trigger an API request to update session data.
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
      // Make a session object for the client.
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
    Twitch._config.session = {};
    // Remove from persistent storage.
    Twitch._storage.removeItem(SESSION_KEY);

    if (typeof callback === 'function') {
      callback(null);
    }
  };

  // Retrieve sessions from persistent storage and
  // persist new ones.
  var initSession = function() {
    var storedSession;

    Twitch._config.session = {};
    // For browsers that do not have the JSON native object,
    // [JSON.js](http://bestiejs.github.com/json3) will work
    // as a drop-in implementation.
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

    // If we're on a page with an access token, it's probably a
    // return uri for an authorization attempt. Overwrite with
    // the new params if page has them.
    if (document.location.hash.match(/access_token=(\w+)/)) {
      Twitch._config.session = parseFragment();

      // Persist to session storage on browsers that support it
      // and cookies otherwise.
      if (window.JSON) {
        Twitch._storage.setItem(SESSION_KEY, JSON.stringify(Twitch._config.session));
      }
    }
  };

  Twitch.extend({
    _initSession: initSession,
    _parseFragment: parseFragment,
    getStatus: getStatus,
    login: login,
    logout: logout
  });
})();