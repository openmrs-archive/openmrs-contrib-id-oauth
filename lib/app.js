'use strict';
const express = require('express');
const _ = require('lodash');
const mid = require('../../../express-middleware');
const server = require('./oauth2');
const passport = require('./passport');
const oauthMid = require('./middleware');
const AcesssToken = require('./models').AccessToken;

const routes = {
    authorize: function(req, res, next) {

        res.render(`${__dirname}/../views/consent`, {
            client: req.oauth2.client,
            transactionID: req.oauth2.transactionID,
            url: req.url
        });

    },

    userInfo: function(req, res, next) {
        const user = req.user;
        let response;
        if (req.get('Accept') === 'application/openmrsid.v2+json') {
            // copy specific fields
            response = {
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                displayName: user.displayName,
                primaryEmail: user.primaryEmail,
                emailList: user.emailList,
            };
        } else {
            response = {
                uid: user.username,
                cn: user.firstName,
                sn: user.lastName,
                displayName: user.displayName,
                mail: user.primaryEmail
            };
        }

        res.json(response);
    },

    deleteAccessToken: function(req, res, next) {
        const token = req.user.token;
        AcesssToken.findOneAndRemove({
            token: token
        }, err => {
            if (err) {
                res.status(500).json({
                    error: 'DB error'
                });
            }
            res.json({
                success: true
            });
        });
    },
};


exports = module.exports = app => {


    // Authorization endpoint
    app.get('/oauth/authorize', oauthMid.ensureUser,
        server.authorize(), routes.authorize);

    app.post('/oauth/authorize/decision', mid.forceLogin, oauthMid.ensureUser,
        server.decision((req, done) => {

            const response = {
                allow: req.body.allow,
                cancel: req.body.cancel,
            };
            return done(null, response);
        }));



    const service = exports.subapp = express();
    service.use(passport.initialize());

    service.post('/oauth/token',
        passport.authenticate(['basic', 'oauth2-client-password'], {
            session: false
        }),
        server.token(), server.errorHandler());

    service.delete('/oauth/delete',
        passport.authenticate('bearer', {
            session: false
        }),
        routes.deleteAccessToken);

    service.get('/oauth/userinfo',
        passport.authenticate('bearer', {
            session: false
        }),
        routes.userInfo);



    service.all('/api/**', passport.authenticate('bearer', {
        session: false
    }));

    app.use(service);


};