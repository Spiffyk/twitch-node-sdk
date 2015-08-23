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

        Twitch.log('Response Data:', data);
        callback(null, data);
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
