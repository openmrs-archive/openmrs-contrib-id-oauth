'use strict';
/**
 * Define all the data models by Mongoose
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

// Authorization Code
const authCodeSchema = new Schema({
    code: {
        type: String,
        unique: true,
    },
    redirectURI: String,
    userId: {
        type: ObjectId,
        index: true,
    },
    clientId: {
        type: ObjectId,
        index: true,
    },
    scope: String,
    createdAt: { // TTL index, let mongodb automatically delete this doc
        type: Date,
        expires: '10m',
        default: Date.now,
    },
});

// Clients
const clientSchema = new Schema({
    name: {
        type: String,
        unique: true,
    },
    secret: String,
    redirectURI: String,
});

// Access Token
const accessTokenSchema = new Schema({
    token: {
        type: String,
        unique: true,
    },
    userId: {
        type: ObjectId,
        index: true,
    },
    clientId: {
        type: ObjectId,
        index: true,
    },
    scope: String,
    createdAt: { // TTL index
        type: Date,
        expires: '100d', // lasts for 100 days
        default: Date.now,
    },
});

/// TODO: Is this useful?
// Consents
const consentSchema = new Schema({
    userId: {
        type: ObjectId,
        index: true,
    },
    clientId: ObjectId,
    scope: String,
});

// turn off autoIndex in production
if ('production' === process.env.NODE_ENV) {
    authCodeSchema.set('autoIndex', false);
    accessTokenSchema.set('autoIndex', false);
    clientSchema.set('autoIndex', false);
    consentSchema.set('autoIndex', false);
}

exports = module.exports = {
    AuthorizationCode: mongoose.model('OAuthAuthorizationCode', authCodeSchema),
    AccessToken: mongoose.model('OAuthAccessToken', accessTokenSchema),
    Client: mongoose.model('OAuthClient', clientSchema),
    Consent: mongoose.model('OAuthConsent', consentSchema),
};