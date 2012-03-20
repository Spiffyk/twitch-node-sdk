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
      params.oauth_token = Twitch._config.params.token;
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
(function() {

  // Initialize the library
  // Accepts an options object specifying
  // your app's client id, recieved after
  // app creation on TwitchTV.
  //
  // Typical initialization:
  // <script>
  // Twitch.init({
  //   clientId: YOUR_CLIENT_ID
  // }, function() {
  //   console.log('the library is now loaded')
  // });
  // </script>
  var init = function(options, callback) {
    if (!options.clientId) {
      throw new Error('client id not specified');
    }
    Twitch._config.clientId = options.clientId;

    if (typeof callback === 'function') {
      callback(null);
    }
  };

  Twitch.extend({
    init: init
  });
})();(function() {
  var parseFragment = function(hash) {
    var match,
      params;

    hash = hash || document.location.hash;

    var hashMatch = function(expr) {
      var match = hash.match(expr);
      return match ? match[1] : null;
    };

    params = {
      token: hashMatch(/access_token=(\w+)/),
      scope: hashMatch(/scope=([\w+]+)/) ? hashMatch(/scope=([\w+]+)/).split('+') : null,
      state: hashMatch(/state=(\w+)/),
      error: hashMatch(/error=(\w+)/),
      errorDescription: hashMatch(/error_description=(\w+)/)
    };

    return params;
  };

  var getStatus = function() {
    return {
      authenticated: !!Twitch._config.params.token,
      token: Twitch._config.params.token,
      scope: Twitch._config.params.scope,
      error: Twitch._config.params.error,
      errorDescription: Twitch._config.params.errorDescription
    };
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
      throw new Error('You must call init before login');
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

  Twitch.extend({
    _parseFragment: parseFragment,
    getStatus: getStatus,
    login: login
  });

  $(function() {
    Twitch._config.params = parseFragment();
  });
})();