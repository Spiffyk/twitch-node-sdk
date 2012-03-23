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

  describe('TODO: #api()', function() {

  });
});
