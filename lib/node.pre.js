var https = require('https');
var fs = require('fs');
var path = require('path');
var URL = require('url');

var gui_type = null; // Can be null, 'nw' or 'electron'
var gui = null; // For NW.js
var BrowserWindow = null; // For Electron

var Twitch, storage, initSession, parseFragment, popupLogin,
        config = {};

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
