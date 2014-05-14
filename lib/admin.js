var Common = require(global.__commonModule)
,   models = require('./models')
,   express = require('express')
,   app = Common.app
,   mid = Common.mid
,   admin = Common.module.admin

admin.addModulePage('OAuth', '/admin/oauth')

app.get('/admin/oauth', mid.forceLogin, function(req, res, next) {
  models.Client.findAll()
  .then(function(clients) {
    res.render(__dirname + '/../views/oauth-admin', {clients: clients || []})

  }, function(err) {
    next(err)

  })
})

app.post('/admin/oauth', mid.forceLogin, function(req, res, next) {

  models.Client.create({
    name: req.body.name,
    secret: req.body.secret,
    redirectURI: req.body.redirectURI
  }).then(function() {

    res.redirect('/admin/oauth', 303)
  }, function(err) {

    next(err)
  })

})

app.get('/admin/oauth/delete/:clientId', mid.forceLogin, function(req, res, next) {

  models.Client.find(req.params.clientId)
  .then(function(client) {

    return client.destroy()

  }, function(err) { next(err) })
  .then(function() {

    res.redirect('/admin/oauth', 303)

  }, function(err) { next(err) })

})

