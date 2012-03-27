# TwitchTV JavaScript SDK

__TODO:__ overview


Check out the [Project page](http://hebo.github.com/twitch-sdk).

You might also be interested in the [annotated source code](http://hebo.github.com/twitch-sdk/docs/twitch.html).

For a detailed specification of API resources, see the [wiki](https://github.com/Hebo/twitch-sdk/wiki/API)

## Loading

To integrate the TwitchTV JavaScript SDK on your site, follow these steps:

First, register a [new client application](). Record the **Client ID** and **Client Secret** you receive in a safe place.

To load and initialize the SDK, add the following code to your page, filling in the __Client ID__ of your app:

    <script src="https://raw.github.com/Hebo/twitch-sdk/master/twitch.js"></script>

    <script>
      Twitch.init({clientId: 'YOUR_CLIENT_ID_HERE'}, function(error) {
        // the sdk is now loaded
      });
    </script>

You can now perform actions that do not require authorization, or have your users log in to TwitchTV for additional permissions.

**TODO**: login guide

### Example
Check out the [example implemention][]

[example implemention]: http://hebo.github.com/twitch-sdk/example.html

## Authentication
The TwitchTV JavaScript SDK enables your users to log on or register using their TwitchTV accounts. The SDK handles synchronizing state between your site and TwitchTV, so users will stay logged in to your app as long as they have a valid access token.

### Twitch.login

Log in a user or request additional permissions. By default, the user will be directed to the TwitchTV sign in & approve page, then back to the same page. This page must be the redirect_uri you specified when creating the client. You may customize the redirect_uri if the user is currently on a different page.

TODO: button code/images

#### Usage

    Twitch.login({
      redirect_uri: REDIRECT_URI,
      popup: true,
      scope: ['user_read', 'channel_read']
    });

    TODO: args list, scopes, popups for advanced functionality

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

### Twitch.api

Make direct requests to the [TwitchTV API][] on behalf of your users. This method handles authorization, so any requests you make to the API will automatically be authenticated on behalf of the logged in user.

[TwitchTV API]: https://github.com/Hebo/twitch-sdk/wiki/API

#### Usage

Get the logged-in user's channel stream key:

    Twitch.api({method: 'channel'}, function(error, channel) {
      console.log(channel.stream_key);
    });

### Development

#### Tests

    make test

#### Docs

Install pygments as described [here](https://github.com/mojombo/jekyll/wiki/install)

    make docs
