// ## Core
;(function($) {
  // Wait five seconds for the API request before timing out.
  var REQUEST_TIMEOUT = 5000;

  var Twitch = {
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
      console.log('Response Data:');
      console.log(data);
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
  // with `[Twitch]`
  Twitch.log = function(message) {
    Array.prototype.unshift.call(arguments, '[Twitch]');
    if (window.console) {
      console.log.apply(console, arguments);
    }
  };

  window.Twitch = Twitch;
// Support either [jQuery](http://jquery.com) or [Zepto](http://zeptojs.com)
})(window.jQuery || window.Zepto);
