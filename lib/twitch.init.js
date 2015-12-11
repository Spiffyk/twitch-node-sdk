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
      gui_type = "nw";
      gui = options.nw;
    }
    else if (options.electron) {
      gui_type = "electron";
      BrowserWindow = require('electron').remote.BrowserWindow;
    }

    initSession(options.session, callback);
  };

  Twitch.extend({
    init: init
  });
})();
