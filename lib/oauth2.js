var oauth2orize = require('oauth2orize');
var async = require('async');
var _ = require('lodash');
var uid = require('uid2');
var server = oauth2orize.createServer();
var models = require('./models');
var AuthorizationCode = models.AuthorizationCode;
var AccessToken = models.AccessToken;
var Client = models.Client;

// Session serialization
server.serializeClient(function(client, done) {
  return done(null, client.id);
});

server.deserializeClient(function(id, done) {
  Client.findById(id, function (err, client) {
    if (err) {
      return done(err);
    }
    return done(null, client);
  });
});

// Register grant permission for authorization codes.
server.grant(oauth2orize.grant.code(
  function(client, redirectURI, user, ares, done) {

  var authCode = uid(32);
  var ac = new AuthorizationCode({
    code: authCode,
    redirectURI: redirectURI,
    userId: user._id, // user here is not mongoose object, but a plain object
    // scope: ares.scope,
    clientId: client.id
  });

  ac.save(function (err, ac) {
    if (err) {
      return done(err);
    }
    return done(null, authCode);
  });
}));

// Register exchanges where a grant can be exchanged for an access token.
server.exchange(oauth2orize.exchange.code(
  function(client, code, redirectURI, done) {

  // find the Authorization code and remove it from db
  var findAuthCode = function (next) {
    AuthorizationCode.findOneAndRemove({code: code}, function (err, ac) {
      if (err) {
        return done(err);
      }
      return next(null, ac);
    });
  };

  // verify the exchange request
  var verify = function (ac, next) {
    // turn ObjectId into string
    var clientId = ac.clientId.toString();
    var fail = !ac || redirectURI !== ac.redirectURI ||
      clientId !== client.id;
    if (fail) {
      return done(null, false);
    }
    return next(null, ac);
  };

  // if there already is an existing access token, return it
  var findAccessToken = function (ac, next) {
    AccessToken.findOne({
      clientId: ac.clientId,
      userId: ac.userId,
    }, function (err, at) {
      if (err) {
        return done(err);
      }
      if (at) {
        return done(null, at.token);
      }
      return next(null, ac);
    });
  };

  // no existing access token, create a new one
  var generateAccessToken = function (ac, next) {
    var token = uid(256);
    var at = new AccessToken({
      token: token,
      userId: ac.userId,
      scope: ac.scope,
      clientId: ac.clientId,
    });
    at.save(function (err) {
      if (err) {
        return done(err);
      }
      return done(null, token);
    });
  };

  async.waterfall([
    findAuthCode,
    verify,
    findAccessToken,
    generateAccessToken,
  ]);
}));

// authorize clients
var serverAuthorize =  function (clientId, redirectURI, done) {
  Client.findById(clientId, function (err, client) {
    if (err) {
      return done(err);
    }
    var fail = !client || client.redirectURI !== redirectURI;
    if (fail) {
      return done(null, false);
    }
    return done(null, client, redirectURI);
  });
};

// skip the decision if there is already an access token
var immediate = function (client, user, done) {
  AccessToken.findOne({
    clientId: client.id,
    userId: user._id
  }, function (err, at) {
    if (err) {
      return done(err);
    }
    if (at) {
      return done(null, true);
    }
    return done(null, false);
  });
};


// Pre-define the authorization function.
server.authorize = _.partial(server.authorize, serverAuthorize, immediate);

module.exports = server;
