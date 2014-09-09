/**
 * Define all the data models by Mongoose
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

// Authorization Code
var authCodeSchema = new Schema({
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
var clientSchema = new Schema({
  name: {
    type: String,
    unique: true,
  },
  secret: String,
  redirectURI: String,
});

// Access Token
var accessTokenSchema = new Schema({
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
});

/// TODO: Is this useful?
// Consents
var consentSchema = new Schema({
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
