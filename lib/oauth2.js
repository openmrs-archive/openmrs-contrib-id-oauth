'use strict';
const oauth2orize = require('oauth2orize');
const async = require('async');
const _ = require('lodash');
const uid = require('uid2'); /// TODO, replace naive uid2 with uuid
const server = oauth2orize.createServer();
const models = require('./models');
const AuthorizationCode = models.AuthorizationCode;
const AccessToken = models.AccessToken;
const Client = models.Client;

// Session serialization
server.serializeClient((client, done) => done(null, client.id));

server.deserializeClient((id, done) => {
    Client.findById(id, (err, client) => {
        if (err) {
            return done(err);
        }
        return done(null, client);
    });
});

// Register grant permission for authorization codes.
server.grant(oauth2orize.grant.code(
    (client, redirectURI, user, ares, done) => {

        const authCode = uid(32);
        const ac = new AuthorizationCode({
            code: authCode,
            redirectURI: redirectURI,
            userId: user._id, // user here is not mongoose object, but a plain object
            scope: ares.scope,
            clientId: client.id
        });

        ac.save((err, ac) => {
            if (err) {
                return done(err);
            }
            return done(null, authCode);
        });
    }));

// Register exchanges where a grant can be exchanged for an access token.
server.exchange(oauth2orize.exchange.code(
    (client, code, redirectURI, done) => {

        // find the Authorization code and remove it from db
        const findAuthCode = next => {
            AuthorizationCode.findOneAndRemove({
                code: code
            }, (err, ac) => {
                if (err) {
                    return done(err);
                }
                return next(null, ac);
            });
        };

        // verify the exchange request
        const verify = (ac, next) => {
            const fail = !ac || redirectURI !== ac.redirectURI ||
                ac.clientId.toString() !== client.id; // turn ObjectId into string
            if (fail) {
                return done(null, false);
            }
            return next(null, ac);
        };

        // if there already is an existing access token, return it
        const findAccessToken = (ac, next) => {
            AccessToken.findOne({
                clientId: ac.clientId,
                userId: ac.userId,
            }, (err, at) => {
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
        const generateAccessToken = (ac, next) => {
            const token = uid(256);
            const at = new AccessToken({
                token: token,
                userId: ac.userId,
                scope: ac.scope,
                clientId: ac.clientId,
            });
            at.save(err => {
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
const serverAuthorize = (clientId, redirectURI, done) => {
    Client.findById(clientId, (err, client) => {
        if (err) {
            return done(err);
        }
        const fail = !client || client.redirectURI !== redirectURI;
        if (fail) {
            return done(null, false);
        }
        return done(null, client, redirectURI);
    });
};

// skip the decision if there is already an access token
const immediate = (client, user, done) => {
    if (!user) {
        return done(null, false);
    }
    AccessToken.findOne({
        clientId: client.id,
        userId: user._id,
    }, (err, at) => {
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