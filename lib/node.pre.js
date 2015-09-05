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
		if ( i != 0 ) {
			result += '&';
		}

		result += name + '=' + array[name];

		i++;
	}

	return result;
}
