# Twitch Node.js SDK

The Twitch Node.js SDK provides rich functionality for accessing the Twitch API. This includes Twitch Connect, which allows users to bring their Twitch accounts into your application. It is a fork of the official [Twitch JavaScript SDK](http://github.com/justintv/twitch-js-sdk), edited for use with Node.js, IO.js or NW.js.

For a detailed specification of API resources, see the [wiki](https://github.com/justintv/Twitch-API/wiki/API).

## Loading

To integrate the Twitch JavaScript SDK in your Node application, follow these steps:

First, register a [new client application][]. Record the **Client ID** and **Client Secret** you receive in a safe place.

To load and initialize the SDK, add the following code to your main file, filling in the __Client ID__ of your app:

```javascript
var Twitch = require("twitch-sdk");

Twitch.init({clientId: 'YOUR_CLIENT_ID_HERE'}, function(error, status) {
  // the sdk is now loaded
});
```

You can now perform actions that do not require authorization or have your users log in to Twitch for additional permissions.

[new client application]: http://www.twitch.tv/kraken/oauth2/clients/new

### Login

You need [NW.js](http://nwjs.io) (or a compatible runtime) for login to work.

First, you need to set your redirect URI. Go to the Twitch Connections settings of your app and set the *Redirect URI* to `https://api.twitch.tv/kraken/`. The SDK uses that as the 'dummy' page to retrieve its tokens.

To add login functionality, add the button to your page:

```html
<img src="http://ttv-api.s3.amazonaws.com/assets/connect_dark.png" class="twitch-connect" href="#" />
```

Now add the JavaScript to trigger the login:

```javascript
$('.twitch-connect').click(function() {
  Twitch.login({
    scope: ['user_read', 'channel_read']
  });
})
```

You probably only want to show the button when the user is not logged in, so add this to the callback on Twitch.init:

```javascript
if (status.authenticated) {
  // Already logged in, hide button
  $('.twitch-connect').hide()
}
```

#### Assets

You may use these assets for the Twitch Connect button:

![Connect Light](http://ttv-api.s3.amazonaws.com/assets/connect_light.png)

![Connect Dark](http://ttv-api.s3.amazonaws.com/assets/connect_dark.png)

## Core Methods

### Twitch.init

Initialize the Twitch API with your Client ID. This method must be called prior to other actions.

If you want your users to be able to authenticate, you need to use an [NW.js](http://nwjs.io)-compatible runtime to show the login popup. In that case you also need to initialize the Twitch API with the ``nw.gui`` object.

#### Usage

```javascript
// For use with NW.js-compatible runtime

var gui = require('nw.gui');

Twitch.init({clientId: 'YOUR_CLIENT_ID_HERE', nw: gui}, function(error, status) {
  if (error) {
    // error encountered while loading
    console.log(error);
  }
  // the sdk is now loaded
  if (status.authenticated) {
    // user is currently logged in
  }
});
```

### Twitch.api

Make direct requests to the [Twitch API][] on behalf of your users. This method handles authorization, so any requests you make to the API will automatically be authenticated on behalf of the logged in user.

[Twitch API]: https://github.com/justintv/Twitch-API

#### Usage

Get the logged-in user's channel stream key:

```javascript
Twitch.api({method: 'channel'}, function(error, channel) {
  console.log(channel.stream_key);
});
```

If the request you wish to make supports optional [parameters] to augment the amount or type of data received, you may add them to your call by adding a 'params' sub-hash:

```javascript
Twitch.api({method: 'streams', params: {game:'Diablo III', limit:3} }, function(error, list) {
  console.debug(list);
});
```
[parameters]: https://github.com/justintv/Twitch-API/blob/master/resources/streams.md#parameters

#### API PUT and DELETE example

Some API endpoints require different HTTP methods, you can achieve this using the verb parameter.

```javascript
Twitch.api({method: '/users/:user/follows/channels/:target', verb: 'PUT' }, function([...]) {
  [...]
});
```

## Authentication
The Twitch JavaScript SDK enables your users to log on or register using their Twitch accounts. The SDK handles synchronizing state between your site and Twitch, so users will stay logged in to your app as long as they have a valid access token.

### Twitch.login

Log in a user or request additional permissions. This operation requires an NW.js-compatible runtime to open a login popup, the SDK initialized with the NW.js GUI object and the *Redirect URI* in the application's Connection settings set to `https://api.twitch.tv/kraken/`.

As opposed to the original version of the SDK, the Node version does not store the authentication token into a session storage, for there is none in Node and as Node modules remain loaded until the application is closed, there is no need for that. The token is simply stored in the memory and is lost upon exiting the application, just like the session storage in browsers.

[DOM Storage]: https://developer.mozilla.org/en/DOM/Storage#sessionStorage

#### Usage

```javascript
Twitch.login({
  scope: ['user_read', 'channel_read']
});

// TODO: args list, scopes, popups for advanced functionality
```

### Twitch.logout

Reset the session and delete from memory, which is akin to logging out. This does not deactivate the access token given to your app, so you can continue to perform actions if your server stored the token.

#### Usage

```javascript
Twitch.logout(function(error) {
    // the user is now logged out
});
```

### Twitch.getStatus

Retrieve the current login status of a user. Whenever possible, `getStatus` will try to use the stored session for speed. You can force `getStatus` to check the stored session against the API if needed.

#### Usage

```javascript
Twitch.getStatus(function(err, status) {
  if (status.authenticated) {
    console.log('authenticated!');
  }
});
```

Force an update of the status:

```javascript
Twitch.getStatus({force: true}, function(err, status) {
  if (status.authenticated) {
    console.log('authenticated!');
  }
}
```

### Twitch.getToken

Retrieve the current OAuth token for a user, if one exists. This is useful for persisting an OAuth token to your backend, if there is any.

#### Usage

```javascript
var token = Twitch.getToken()
alert(token)
```

## Events

Most JavaScript-heavy apps use events to be notified of state changes. Some changes might occur due to user actions outside your app's control, so the only way to be notified is through events.

`Twitch.events.addListener` allows you to subscribe to an event:

```javascript
Twitch.events.addListener('auth.login', function() {
  // user is logged in
});
```

`Twitch.events.removeListener` allows you to remove listeners for an event:

```javascript
var handleLogin = function() {
  alert("you're logged in!");
};

Twitch.events.addListener('auth.login', handleLogin);
Twitch.events.removeListener('auth.login', handleLogin);
```

`Twitch.events.removeAllListeners` allows you to remove all listeners for an event.

### auth.login

This event is emitted when we initialize a session for a user, either because the current page is a login `redirect_uri` or we have restored the session from persistent storage.

### auth.logout

This event is emitted when we no longer have a valid session for a user. This means we either called `Twitch.logout` or the user has revoked access on Twitch for your application.

## Development

First, install all the development pre-requisites with npm

```bash
npm install
```

### Building

```bash
make
```

### Docs

```bash
make docs
```
