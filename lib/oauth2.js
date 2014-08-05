var oauth2orize = require('oauth2orize');
var server = oauth2orize.createServer();
var models = require('./models');
var AuthorizationCode = models.AuthorizationCode;
var AccessToken = models.AccessToken;
var Client = models.Client;
var _ = require('lodash');
var uid = require('uid2');

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

  AuthorizationCode.findOne({code: code}, function (err, ac) {
    if (err) {
      return done(err);
    }
    var clientId = ac.clientId.toString();
    var fail = !ac || redirectURI !== ac.redirectURI ||
      clientId !== client.id;

    if (fail) {
      return done(null, false);
    }

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
  });
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

// skip the approved user
var immediate = function (client, user, done) {
  AuthorizationCode.findOne({
    clientId: client.id,
    userId: user._id
  }, function (err, ac) {
    if (err) {
      return done(err);
    }
    if (ac) {
      return done(null, true);
    }
    return done(null, false);
  });
};


// Pre-define the authorization function.
server.authorize = _.partial(server.authorize, serverAuthorize, immediate);

module.exports = server;
