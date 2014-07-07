var Common = require(global.__commonModule)
,   mid = Common.mid
,   app = Common.app
,   express = require('express')
,   server = require('./oauth2')
,   passport = require('./passport')
,   conf = Common.conf
,   ldap = Common.ldap
,   crypto = require('crypto')

var routes = {
  authorize: function(req, res, next) {

    var loggedIn = typeof req.session.user === "object";

    res.render(__dirname + '/../views/consent', {
      client: req.oauth2.client,
      transactionID: req.oauth2.transactionID,
      loggedIn: loggedIn,
      url: req.url
    })

  },

  userInfo: function(req, res, next) {
    var id = req.user.userId

    ldap.getUser(id, function(err, user) {
      if (err) return next(err)
      res.json(user)
    })

  },

  openSocialUserInfo: function(req, res, next) {
    var id = req.params.id;

    ldap.getUser(id, function(err, user) {
      if (err) return next(err);

      var mailHash = crypto.createHash('md5').update(user.mail);
      mailHash = mailHash.digest('hex');
      var avatar = 'https://wiki.openmrs.org/rest/cas/1.0/avatar/server/' +
        mailHash;

      res.send({
        id: user.uid,
        displayName: user.displayName,
        emails: [user.mail].join(user.otherMailbox),
        thumbnailUrl: avatar
      })
    });
  },

  openSocialContacts: function(req, res, next) {
    res.send([]); // We have no concept of "contacts" in the Dashboard.
  }
}


app.get('/oauth/authorize', server.authorize(), routes.authorize)
app.post('/oauth/authorize/decision', mid.forceLogin,
  server.decision(function(req, done) {
    req.user = req.session.user[conf.user.username]
    var response = {
      allow: req.body.allow,
      cancel: req.body.cancel
    }
    return done(null, response)
  }))


var service = module.exports = express.createServer()
service.use(express.bodyParser())
service.use(passport.initialize())
service.set('jsonp callback', true);

service.post('/oauth/token',
  passport.authenticate(['basic', 'oauth2-client-password'], {session: false}),
  server.token(), server.errorHandler())

service.get('/oauth/userinfo', passport.authenticate('bearer', {session: false}),
  routes.userInfo)

service.get('/oauth/opensocial/people/:id/@self',
  passport.authenticate('bearer', {session: false}),
  routes.openSocialUserInfo);

service.get('/oauth/opensocial/people/:id/@all',
  passport.authenticate('bearer', {session: false}),
  routes.openSocialContacts);