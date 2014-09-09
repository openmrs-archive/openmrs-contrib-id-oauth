var passport = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy;
var ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;
var BearerStrategy = require('passport-http-bearer').Strategy;
var models = require('./models');

var clientAuth = function (clientId, clientSecret, done) {
  models.Client.findById(clientId, function (err, client) {
    if (err) {
      return done(err);
    }
    var fail = !client || client.secret !== clientSecret;
    if (fail) {
      return done(null, false);
    }
    return done(null, client);
  });
};

var accessTokenAuth = function (token, done) {
  models.AccessToken.findOne({token: token}, function (err, at) {
    if (err) {
      return done(err);
    }
    if (!at) {
      return done(null, false);
    }
    return done(null, at, {scope: at.scope});
  });
};

passport.use(new BasicStrategy(clientAuth));

passport.use(new ClientPasswordStrategy(clientAuth));

passport.use(new BearerStrategy(accessTokenAuth));

module.exports = passport;
