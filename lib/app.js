var Common = require(global.__commonModule);
var mid = Common.mid;
var app = Common.app;
var express = require('express');
var server = require('./oauth2');
var passport = require('./passport');
var oauthMid = require('./middleware');
var User = Common.models.user;

var routes = {
  authorize: function(req, res, next) {

    var loggedIn = typeof req.session.user === 'object';

    res.render(__dirname + '/../views/consent', {
      client: req.oauth2.client,
      transactionID: req.oauth2.transactionID,
      loggedIn: loggedIn,
      url: req.url
    });

  },

  userInfo: function(req, res, next) {
    var id = req.user.userId;

    User.findOne({username: id}).exec()
    .then(function(user) {

      var response;
      if (req.get('Accept') === 'application/openmrsid.v2+json') {
        response = user.toJSON();
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

    }, function(err) {
      next(err);
    });

  }
};

// Authorization endpoint
app.get('/oauth/authorize', oauthMid.ensureUser,
  server.authorize(), routes.authorize);

app.post('/oauth/authorize/decision', mid.forceLogin, oauthMid.ensureUser,
  server.decision(function(req, done) {

  var response = {
    allow: req.body.allow,
    cancel: req.body.cancel,
  };
  return done(null, response);
}));


var service = module.exports = express();
service.use(express.bodyParser());
service.use(passport.initialize());

service.post('/oauth/token',
  passport.authenticate(['basic', 'oauth2-client-password'], {session: false}),
  server.token(), server.errorHandler());

service.get('/oauth/userinfo', passport.authenticate('bearer',
  {session: false}), routes.userInfo);

service.all('/api/**', passport.authenticate('bearer', {session: false}));
