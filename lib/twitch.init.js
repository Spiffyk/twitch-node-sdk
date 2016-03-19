const core = require('./twitch.core');
const gui = require('./twitch.gui');
const auth = require('./twitch.auth');

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
