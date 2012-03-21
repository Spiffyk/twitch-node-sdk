/*jshint expr:true*/
describe('Authentication', function() {
  describe('#_parseFragment()', function() {
    it('should extract params from location hash', function() {
      var hash = "access_token=ew35h4pk0xg7iy1" +
             "&scope=user_read+channel_read&state=user_dayjay";

      document.location.hash = hash;
      Twitch._parseFragment().should.eql({
        token: 'ew35h4pk0xg7iy1',
        scope: ['user_read', 'channel_read'],
        state: 'user_dayjay',
        error: null,
        errorDescription: null
      });
    });

    it('should handle various parameter combinations', function() {
      Twitch._parseFragment('access_token=ew35h42d').should.eql({
        token: 'ew35h42d',
        scope: null,
        state: null,
        error: null,
        errorDescription: null
      });
      Twitch._parseFragment('scope=user_read&state=wootles').should.eql({
        token: null,
        scope: ['user_read'],
        state: 'wootles',
        error: null,
        errorDescription: null
      });
    });

    it('TODO: should handle oauth errors', function() {
    });
  });

  describe('#getStatus()', function() {
    it('should ensure init has been called', function() {
      (function() {
        Twitch.getStatus();
      }).should['throw']('init() before getStatus()');
    });

    it('should have the correct structure', function() {
      Twitch.init({clientId: 'myclientid'});
      var status = Twitch.getStatus(),
        props = ['authenticated', 'token', 'scope', 'error', 'errorDescription'];

      for (var i = 0, len = props.length; i < len; i++) {
        status.should.have.property(props[i]);
      }
    });
  });

  describe('#login()', function() {
    beforeEach(function() {
      sinon.stub(window, 'open');
      Twitch.init({clientId: 'myclientid'});
    });

    afterEach(function() {
      window.open.restore();
    });

    it('should ensure init has been called', function() {
      Twitch._config = {};

      (function() {
        Twitch.login({
          redirect_uri: 'http://myappurl',
          popup: false,
          scope: []
        });
      }).should['throw']('init() before login()');
    });

    it('should enforce arguments', function() {
      (function() {
        Twitch.login({
          redirect_uri: 'http://myappurl',
          popup: false
        });
      }).should['throw']('list of requested scopes');
    });

    it('should open a window', function() {
      Twitch.login({
        redirect_uri: 'http://myappurl',
        popup: true,
        scope: []
      });

      sinon.assert.calledOnce(window.open);
    });

    it('should create valid urls', function() {
      var lastShouldMatch = function(params) {
        var baseUrl = 'http://beta.twitch.tv/kraken/oauth2/authorize?',
          lastCall = window.open.lastCall;
        lastCall.args[0].should.eql(baseUrl + params);
      };

      Twitch.login({
        redirect_uri: 'http://myappurl.net',
        popup: true,
        scope: []
      });
      lastShouldMatch('response_type=token&client_id=myclientid&redirect_uri=http%3A%2F%2Fmyappurl.net&scope=');

      Twitch.login({
        redirect_uri: 'http://myappurl.net',
        popup: true,
        scope: ['user_read']
      });
      lastShouldMatch('response_type=token&client_id=myclientid&redirect_uri=http%3A%2F%2Fmyappurl.net&scope=user_read');

      Twitch.login({
        redirect_uri: 'http://myappurl.net',
        popup: true,
        scope: ['user_read', 'channel_read']
      });
      lastShouldMatch('response_type=token&client_id=myclientid&redirect_uri=http%3A%2F%2Fmyappurl.net&scope=user_read+channel_read');
    });
  });

  describe('#initSession()', function() {
    it('TODO: should set session', function() {
    });

    it('TODO: should handle invalid json', function() {
    });

    it('TODO: should handle missing window.JSON', function() {
    });

    it('TODO: should set new session if this page is a redirect_uri', function() {
    });

  });
});