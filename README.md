# TwitchTV JavaScript SDK

__TODO:__ overview


Check out the [Project page](http://justintv.github.com/twitch-js-sdk).

You might also be interested in the [annotated source code](http://justintv.github.com/twitch-js-sdk/docs/twitch.html).

For a detailed specification of API resources, see the [wiki](https://github.com/justintv/twitch-js-sdk/wiki/API).

## Loading

To integrate the TwitchTV JavaScript SDK on your site, follow these steps:

First, register a [new client application][]. Record the **Client ID** and **Client Secret** you receive in a safe place.

To load and initialize the SDK, add the following code to your page, filling in the __Client ID__ of your app:

    <script src="https://ttv-api.s3.amazonaws.com/twitch.min.js"></script>

    <script>
      Twitch.init({clientId: 'YOUR_CLIENT_ID_HERE'}, function(error, status) {
        // the sdk is now loaded
      });
    </script>

You can now perform actions that do not require authorization or have your users log in to TwitchTV for additional permissions.

[new client application]: http://www.twitch.tv/kraken/oauth2/clients/new

### Login

To add login functionality, first add the button to your page:

    <img src="http://ttv-api.s3.amazonaws.com/twitch_connect.png" class="twitch-connect" href="#" />

Now add the JavaScript to trigger the login:

    $('.twitch-connect').click(function() {
      Twitch.login({
        scope: ['user_read', 'channel_read']
      });
    })

You probably only want to show the button when the user is not logged in, so add this to the callback on Twitch.init:

    if (status.authenticated) {
      // Already logged in, hide button
      $('.twitch-connect').hide()
    }
    
#### Assets

You may use these assets for the Twitch Connect button:

![Connect Light](http://ttv-api.s3.amazonaws.com/assets/connect_light.png)

![Connect Dark](http://ttv-api.s3.amazonaws.com/assets/connect_dark.png)


### Example

For a simple example of integrating the TwitchTV SDK with login functionality, please check out the [example implemention][].

![Authorize page][]

[example implemention]: http://justintv.github.com/twitch-js-sdk/example.html
[Authorize page]: http://ttv-api.s3.amazonaws.com/screenshots/authorize.png

## Core Methods

### Twitch.init

Initialize the TwitchTV API with your Client ID. This method must be called prior to other actions. If the user is already authenticated, you can perform authenticated actions after initialization. Otherwise, you must call Twitch.login to have the user authorize your app. 

#### Usage

    Twitch.init({clientId: 'YOUR_CLIENT_ID_HERE'}, function(error, status) {
      if (error) {
        // error encountered while loading
        console.log(error);
      }
      // the sdk is now loaded
      if (status.authenticated) {
        // user is currently logged in
      }
    });

### Twitch.api

Make direct requests to the [TwitchTV API][] on behalf of your users. This method handles authorization, so any requests you make to the API will automatically be authenticated on behalf of the logged in user.

[TwitchTV API]: https://github.com/justintv/twitch-js-sdk/wiki/API

#### Usage

Get the logged-in user's channel stream key:

    Twitch.api({method: 'channel'}, function(error, channel) {
      console.log(channel.stream_key);
    });

## Authentication
The TwitchTV JavaScript SDK enables your users to log on or register using their TwitchTV accounts. The SDK handles synchronizing state between your site and TwitchTV, so users will stay logged in to your app as long as they have a valid access token.

### Twitch.login

Log in a user or request additional permissions. By default, the user will be directed to the TwitchTV sign in & approve page, then back to the same page. This page must be the `redirect_uri` you specified when creating the client. You may customize the `redirect_uri` if the user is currently on a different page. Make sure the JavaScript SDK is included on the `redirect_uri` page.

Once the user is returned to the `redirect_uri` after authorization, the SDK will store the session infomation in [DOM Storage][] or cookies, so authentication will persist throughout your website. You may also store this token, associated with a user on your site, to make continued requests on behalf of that user.

[DOM Storage]: https://developer.mozilla.org/en/DOM/Storage#sessionStorage

#### Usage

    Twitch.login({
      scope: ['user_read', 'channel_read']
    });

    TODO: args list, scopes, popups for advanced functionality

### Twitch.logout

Reset the session and delete from persistent storage, which is akin to logging out. This does not deactivate the access token given to your app, so you can continue to perform actions if your server stored the token.

#### Usage

    Twitch.logout(function(error) {
        // the user is now logged out
    });

### Twitch.getStatus

Retrieve the current login status of a user. Whenever possible, `getStatus` will try to use the stored session for speed. You can force `getStatus` to check the stored session against the API if needed.

#### Usage

    Twitch.getStatus(function(err, status) {
      if (status.authenticated) {
        console.log('authenticated!')
      }
    }

Force an update of the status:

    Twitch.getStatus({force: true}, function(err, status) {
      if (status.authenticated) {
        console.log('authenticated!')
      }
    }

## Events

Most JavaScript-heavy apps use events to be notified of state changes. Some changes might occur due to user actions outside your app's control, so the only way to be notified is through events.

`Twitch.events.addListener` allows you to subscribe to an event:

    Twitch.events.addListener('auth.login', function() {
      // user is logged in
    });

`Twitch.events.removeListener` allows you to remove listeners for an event:

    var handleLogin = function() {
      alert('you're logged in!);
    };

    Twitch.events.addListener('auth.login', handleLogin);
    Twitch.events.removeListener('auth.login', handleLogin);

`Twitch.events.removeAllListeners` allows you to remove all listeners for an event.

### auth.login

This event is emitted when we initialize a session for a user, either because the current page is a login `redirect_uri` or we have restored the session from persistent storage. 

### auth.logout

This event is emitted when we no longer have a valid session for a user. This means we either called `Twitch.logout` or the user has revoked access on Twitch for your application.

## Development

### Building

    make

### Tests

    make test

### Docs

Install pygments as described [here](https://github.com/mojombo/jekyll/wiki/install)

    make docs

To update the docs on github pages:

    git checkout gh-pages
    make
