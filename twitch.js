/**
 * This is the module to be used in Node.js, NW.js or Electron
 * @module twitch-sdk
 */

/**
 * This is the main class of the SDK. Methods marked as `public` are exposed
 * to your app.
 * @class Twitch
 */

const util = require('./lib/twitch.util');
const core = require('./lib/twitch.core');
const init = require('./lib/twitch.init');
const auth = require('./lib/twitch.auth');

// Init
exports.init = init.init;

// Core
exports.api = core.api;

// Events
exports.events = {
  on: core.events.on,
  addListener: core.events.on,
  once: core.events.once,
  removeListener: core.events.removeListener,
  getMaxListeners: core.events.getMaxListeners,
  listenerCount: core.events.listenerCount
};
exports.on = core.events.on;
exports.addListener = core.events.on;
exports.once = core.events.once;
exports.removeListener = core.events.removeListener;
exports.getMaxListeners = core.events.getMaxListeners;
exports.listenerCount = core.events.listenerCount;


// Auth
exports.getToken = auth.getToken;
exports.getStatus = auth.getStatus;
exports.login = auth.login;
exports.logout = auth.logout;
