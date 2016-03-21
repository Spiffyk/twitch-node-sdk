/**
 * This module is here only for documentation. Everything is implemented in
 * the `{{#crossLinkModule "core"}}{{/crossLinkModule}}` module
 * @module twitch-sdk
 * @submodule events
 */

/**
 * @deprecated Use the corresponding methods in `Twitch` instead
 * @property {EventEmitter} events
 */

/**
 * Adds a new `listener` that is called every time the specified
 * `event` is fired
 *
 * @method on
 * @param {String} event The event to listen to
 * @param {Function} listener The listener
 */

/**
 * Alias for `{{#crossLink "Twitch/on:method"}}{{/crossLink}}`
 * @method addListener
 * @param {String} event The event to listen to
 * @param {Function} listener The listener
 */

/**
 * Adds a new `listener` that is called once and *only once* the specified
 * `event` is fired
 *
 * @method once
 * @param {String} event The event to listen to
 * @param {Function} listener The listener
 */

/**
 * Removes the specified `listener` from the specified `event`
 *
 * @method removeListener
 * @param {String} event The event to listen to
 * @param {Function} listener The listener
 */

 /**
  * Returns the current max listener value for the built-in `EventListener`
	*
	* @method getMaxListeners
	* @return {Number} The max listener value
	*/

/**
 * Returns the number of listeners listening to the `event`
 *
 * @method listenerCount
 * @param {String} event The event type
 * @return {Number} The amount of listeners
 */
