// ## Core
;(function() {
  // Wait five seconds for the API request before timing out.
  var HTTP_CODES = {
    unauthorized: 401
  };

  Twitch = {
    baseUrl: 'https://api.twitch.tv/kraken/',
    extend: function() {
    	var target = Twitch;

    	for (var i = 0; i < arguments.length; i++) {
    		var options;

    		if (options = arguments[i] != null) {
    			for (var name in options) {
    				target[name] = options[name];
    			}
    		}
    	}
    }
  };

  Twitch.baseUrl.host = 'api.twitch.tv';
  Twitch.baseUrl.path = '/kraken';

  // Perform requests to the TwitchTV API. This is a fairly low-level
  // interface, so most clients are better served by using a related
  // high-level function if one exists.
  Twitch.api = function(options, callback) {
    if (!Twitch._config.session) {
      throw new Error('You must call init() before api()');
    }
    var params = options.params || {};
    callback = callback || function() {};

    var authenticated = !!config.session.token,
      url = Twitch.baseUrl.path + (options.url || options.method || '');

    if (authenticated) params.oauth_token = config.session.token;


    var request_options = {
      host: Twitch.baseUrl.host,
      path: url + '?' + param(params),
      method: options.verb || 'GET',
      headers: {
        "Accept": "application/vnd.twitchtv.v3+json",
        "Client-ID": config.clientId
      }
    };

    var req = https.request(request_options, function(res) {
      Twitch.log('Response status:', res.statusCode, res.statusMessage);

      res.encoding = 'utf8';
      res.on('data', function(data) {
        data = JSON.parse(data);

        Twitch.log('Response Data:', data);
        if ( !(data && data.error) ) {
          callback(null, data || null);
          return;
        }

        Twitch.log('API Error:', data.error + ';', data.message);
        if (authenticated && data.status === HTTP_CODES.unauthorized) {
          // Invalid authentication code; destroy our session.
          Twitch.logout(function() {
            callback(data, null);
          });
        } else {
          callback(data, null);
        }
      });
    });

    req.on('error', function (e) {
      Twitch.log('HTTP Request Error:', e);
    });

    req.end();
  }
  
  // Log messages to the browser console if available, prefixed
  // with `[Twitch]`.
  Twitch.log = function(message) {
    Array.prototype.unshift.call(arguments, '[Twitch]');
    if (window.console) {
      console.log.apply(console, arguments);
    }
  };
})();
