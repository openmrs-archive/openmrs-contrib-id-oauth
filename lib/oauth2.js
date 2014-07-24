var oauth2orize = require('oauth2orize');
var server = oauth2orize.createServer();
var Common = require(global.__commonModule);
var db = Common.db;
var utils = require('connect').utils;
var models = require('./models');
var _ = require('lodash');
var uid = require('uid2');

server.serializeClient(function(client, done) {
  return done(null, client.id);
});

server.deserializeClient(function(_id, done) {
  models.Client.find({where: {id: _id}})
  .then(function(client) {
    if (!client) { return done(null, false); }
    done(null, client);
  }, function(err) { done(err); });

});

// Register grant permission for authorization codes.
server.grant(oauth2orize.grant.code(
function(client, redirectURI, user, areas, done) {
  var authCode = uid(32);

  models.AuthorizationCode.create({
    code: authCode,
    redirectURI: redirectURI,
    userId: user,
    scope: areas.scope,
    clientId: client.id
  })
  .then(function(code) {
    return done(null, authCode);
  }, function(err) {
    return done(err);
  });

}));

// Register exchanges where a grant can be exchanged for an access token.
server.exchange(oauth2orize.exchange.code(
function(client, code, redirectURI, done) {

  models.AuthorizationCode.find({where: {code: code}})
  .then(function(ac) {
    if (!ac) { return done(null, false); }
    if (redirectURI !== ac.redirectURI) { return done(null, false); }

    models.Client.find({where: {id: ac.clientId}})
    .then(function(acClient) {
      if (client.id !== acClient.id) { return done(null, false); }

      var accessToken = uid(32);
      models.AccessToken.create({
        token: accessToken,
        userId: ac.userId,
        scope: code.scope,
        clientId: client.id
      })
      .then(function(token) {
        done(null, accessToken);
        return ac.destroy();
      }, function(err) {
        return done(err);
      });

    }, function(err) { return done(err); });

  }, function(err) {
    return done(err);
  });

}));

function serverAuthorize(clientUuid, redirectURI, done) {
  models.Client.find({where: {clientUuid: clientUuid}})
  .then(function(client) {
    if (!client) { return done(null, false); }
    if (client.redirectURI !== redirectURI) { return done(null, false); }
    done(null, client, redirectURI);

  }, function(err) { return done(err); });
}

// Pre-define the authorization function.
server.authorize = _.partial(server.authorize, serverAuthorize);

module.exports = server;