/*jshint expr:true*/

// We need to wrap jsonp to get mocha to know about assertion errors
// since we're in a new call stack
window.wrap = function(done, fn) {
  try {
    fn();
  } catch (e) {
    done(e);
  }
};

describe('API', function() {
  it('should confirm positive authentication', function(done) {
    Twitch.getStatus(function(err, status) {
      should.not.exist(err);
      status.should.have.property('authenticated', true);
      status.scope.should.be.an['instanceof'](Array);
      done();
    });
  });

  describe('#api()', function() {
    describe('methods', function() {
      it('can retrieve /user', function(done) {
        Twitch.api({method: 'user'}, function(err, user) {
          wrap(done, function() {
            should.not.exist(err);
            should.exist(user);
            user.should.have.property('display_name');
            user.display_name.should.be.a('String');
            done();
          });
        });
      });

      it('can retrieve /channel', function(done) {
        Twitch.api({method: 'channel'}, function(err, channel) {
          wrap(done, function() {
            should.not.exist(err);
            should.exist(channel);
            channel.should.have.property('stream_key');
            channel.stream_key.should.include('live_');
            done();
          });
        });
      });
    });

    describe('responses', function() {
      it('TODO: handle nonexistent response', function(done) {
        done();
        // Twitch.api({method: 'fakeresource'}, function(err, channel) {
        // });
      });

      it('TODO: handle unauthorized response', function(done) {
        done();
        // Twitch.api({method: 'unauthorized'}, function(err, channel) {
        // });
      });
    });
  });
});
