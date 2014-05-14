var Common = require(global.__commonModule)
,   db = Common.db
,   async = require('async')

var models = module.exports = {}

async.parallel([

  function(callback) {
    models.AuthorizationCode = db.define('OAuthAuthorizationCode', {
      code: db.STRING,
      redirectURI: db.STRING,
      userId: db.STRING, // username stored as string
      scope: db.STRING,
      clientId: db.INTEGER
    }, callback)
  },

  function(callback) {
    models.AccessToken = db.define('OAuthAccessToken', {
      token: db.STRING,
      userId: db.STRING,
      scope: db.STRING,
      clientId: db.INTEGER
    }, callback)
  },

  function(callback) {
    models.Client = db.define('OAuthClient', {
      name: db.STRING,
      clientId: {type: db.UUID, defaultValue: db.UUIDV1},
      secret: db.STRING,
      redirectURI: db.STRING
    }, callback)
  }

])