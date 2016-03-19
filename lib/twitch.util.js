/**
 * Converts the input object or array into a String for use in a URL.
 * @param {Object|Array} array
 * @return {String} URL-format parameter
 */
function param(array) {
  var i = 0;
  var result = '';

  for ( var name in array ) {
    if ( i !== 0 ) {
      result += '&';
    }

    if( typeof array[name] === 'object' ) {
      var j = 0;

      for( var key in array[name] ) {
        result += name + '[' + key + ']=' + array[name][key];
        if( j < Object.keys(array[name]).length-1 ) {
          result += '&';
        }
      }

      j++;
    } else {
      result += name + '=' + array[name];
    }

    i++;
  }

  return result;
}
exports.param = param;

/**
 * Parses a hash and creates a session out of it.
 * @param {String} hash The hash
 * @return {Object} Session
 */
function parseFragment(hash) {
  if (!hash) {
    throw new Error('A hash must be specified');
  }

  var match,
    session;

  var hashMatch = function(expr) {
    var match = hash.match(expr);
    return match ? match[1] : null;
  };

  session = {
    token: hashMatch(/access_token=(\w+)/),
    scope: hashMatch(/scope=([\w+]+)/) ? hashMatch(/scope=([\w+]+)/).split('+') : null,
    state: hashMatch(/state=(\w+)/),
    error: hashMatch(/error=(\w+)/),
    errorDescription: hashMatch(/error_description=(\w+)/)
  };

  return session;
}
exports.parseFragment = parseFragment;
