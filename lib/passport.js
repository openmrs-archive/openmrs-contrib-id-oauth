'use strict';
const passport = require('passport');
const BasicStrategy = require('passport-http').BasicStrategy;
const ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;
const BearerStrategy = require('passport-http-bearer').Strategy;
const models = require('./models');
const User = require('../../../models/user');

const clientAuth = (clientId, clientSecret, done) => {
    models.Client.findById(clientId, (err, client) => {
        if (err) {
            return done(err);
        }
        const fail = !client || client.secret !== clientSecret;
        if (fail) {
            return done(null, false);
        }
        return done(null, client);
    });
};

const accessTokenAuth = (token, done) => {
    models.AccessToken.findOne({
        token: token
    }, (err, at) => {
        if (err) {
            return done(err);
        }
        if (!at) {
            return done(null, false);
        }
        User.findById(at.userId, (err, user) => {
            if (err) {
                return done(err);
            }
            user = user.toJSON();
            delete user.groups;
            user.token = token;
            return done(null, user, {
                scope: at.scope
            });
        });
    });
};

passport.use(new BasicStrategy(clientAuth));

passport.use(new ClientPasswordStrategy(clientAuth));

passport.use(new BearerStrategy(accessTokenAuth));

module.exports = passport;