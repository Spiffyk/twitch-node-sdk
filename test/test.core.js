/*jshint expr:true*/
describe('Core', function() {


  it('should set base configuration', function() {
    Twitch.should.have.property('baseUrl', 'http://beta.twitch.tv/kraken/');
    // Trailing slash
    Twitch.baseUrl.should.match(/\/$/);
    Twitch.should.have.property('_config');
    Twitch._config.should.eql({});
    Twitch.should.have.property('extend');
    Twitch.should.have.property('api');
  });

  describe('#api()', function() {
    beforeEach(function() {
      Twitch._storage.removeItem('twitch_oauth_session');
      Twitch._config = {};
      sinon.stub(jQuery, 'ajax', function(opts) {
        opts = JSON.stringify(opts);
        console.log('ajax called with:', opts);
        return {
          done: function() {return this;},
          fail: function() {return this;}
        };
      });
    });

    afterEach(function() {
      $.ajax.restore();
    });

    it('requires initialization', function() {
      (function() {
        Twitch.api({});
      }).should['throw']('init() before api()');
    });

    it('sends unauthenticated requests', function() {
      Twitch.init({clientId: 'myclientid'});
      Twitch._config.session = {};
      Twitch.api({});

      sinon.assert.calledWith($.ajax, {
        dataType: 'jsonp',
        timeout: 5000,
        url: 'http://beta.twitch.tv/kraken/?'
      });
    });

    it('sends authenticated requests', function() {
      Twitch.init({clientId: 'myclientid'});
      Twitch._config.session = {
        token: 'abc'
      };
      Twitch.api({});

      sinon.assert.calledWith($.ajax, {
        dataType: 'jsonp',
        timeout: 5000,
        url: 'http://beta.twitch.tv/kraken/?oauth_token=abc'
      });
    });

    it('sets method on requests', function() {
      Twitch.init({clientId: 'myclientid'});

      Twitch.api({method: 'user'});
      $.ajax.lastCall.calledWith({
        dataType: 'jsonp',
        timeout: 5000,
        url: 'http://beta.twitch.tv/kraken/user?'
      }).should.be['true'];
    });

  });
});
