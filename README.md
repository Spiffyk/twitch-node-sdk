# TwitchTV JavaScript SDK

## Overview


## Loading


### Example
Check out the [example implemention][]

[example implemention]: http://hebo.github.com/twitch-sdk/example.html

## Authentication
The TwitchTV JavaScript SDK enables your users to log on or register using their TwitchTV accounts. The SDK handles synchronizing state between your site and TwitchTV, so users will stay logged in to your app so long as they have a valid access token.

### Twitch.login
`Twitch.login()` allows you to log in a user or request additional permissions. By default, the user will be directed to the TwitchTV sign in/approve page, then back to the same page. This page must be the redirect_uri you specified when creating the client. You may customize the redirect_uri if the user is currently on a different page.

#### Usage

    Twitch.login({
      redirect_uri: REDIRECT_URI,
      popup: true,
      scope: ['user_read', 'channel_read']
    });

    TODO: args list, scopes, popups for advanced functionality

### Twitch.getStatus

Allows you to get the current login status of a user. Whenever possible, `getStatus` will try to use the stored session for speed. You can force `getStatus` to check the stored session against the API if needed.

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
