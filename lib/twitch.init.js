/**
 * @module twitch-sdk
 * @submodule init
 */

const core = require('./twitch.core');
const gui = require('./twitch.gui');
const auth = require('./twitch.auth');

/**
 * Initializes the SDK.
 *
 * The `options` parameter can have the following properties (optional if not
 * stated otherwise):
 *
 * * `clientId` (**required**) - The client ID of your application
 *
 * * `session` - If your application has stored the session object somewhere,
 *              you can pass it to the SDK to speed up the login process.
 *
 * * `electron` - `true` if **Electron** is used.
 *
 * * `nw` - `true` if **NW.js v0.13 or higher** is used.
 *           If you use **NW.js v0.12 or lower**, set to the object you get
 *           by calling `require('nw.gui')`
 * @method init
 * @param {Object} options Options to initialize the SDK with
 * @param {function} [callback] The callback to run after the SDK is initialized.
 * @memberof Twitch
 */
function init(options, callback) {
  if (!options.clientId) {
    throw new Error('client id not specified');
  }

  core.setClientId(options.clientId);

  if (options.nw) {
    if (options.nw === true) {
      core.log('NW.js 0.13 is experimental.');
      gui.setGUIType('nw13');
    }
    else {
      gui.setGUIType('nw', options.nw);
    }
  }
  else if (options.electron) {
    gui.setGUIType('electron');
  }

  auth.initSession(options.session, callback);
};
exports.init = init;
