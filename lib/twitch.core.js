(function() {
  var $ = window.jQuery || window.Zepto,
  requestTimeout = 5000;


  var Twitch = {
    baseUrl: 'http://beta.twitch.tv/kraken/',
    _config: {},
    extend: function(src) {
      $.extend(Twitch, src);
    }
  };

  // Make requests to the TwitchTV api. This is
  // a low-level interface--most clients are better
  // served by using a related high-level function
  Twitch.request = function(options, callback) {
    params = options.params || {};
    var status = Twitch.getStatus(),
      url = Twitch.baseUrl + options.method;

    if (status.authenticated) {
      params.oauth_token = Twitch._config.session.token;
    }

    $.ajax({
      url: url + '?' + $.param(params),
      dataType: 'jsonp',
      timeout : requestTimeout
    })
    .done(function(data) {
      console.log('suvvess');
      console.log(data);
      callback(null, data);
    })
    .fail(function(something, s2) {
      // forced fail by request timeout; we have no
      // way of knowing the actual error with json-p
      callback(true, null);
    });
  };

  Twitch.log = function(message) {
    if (window.console) {
      console.log.apply(console, arguments);
    }
  };

  window.Twitch = Twitch;
})();
