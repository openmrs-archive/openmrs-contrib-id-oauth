var Common = require(global.__commonModule);
var models = require('./models');
var app = Common.app;
var mid = Common.mid;
var admin = Common.module.admin;

admin.addModulePage('OAuth', '/admin/oauth');

app.get('/admin/oauth', mid.forceLogin, admin.useSidebar,
  function(req, res, next) {

  models.Client.find({}, function (err, clients) {
    if (err) {
      return next(err);
    }
    res.render(__dirname + '/../views/oauth-admin', {clients: clients || []});
  });
});

app.post('/admin/oauth', mid.forceLogin, function(req, res, next) {
  var client = new models.Client({
    name: req.body.name,
    secret: req.body.secret,
    redirectURI: req.body.redirectURI
  });
  client.save(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect('/admin/oauth', 303);
  });
});

app.get('/admin/oauth/delete/:clientId', mid.forceLogin,
  function(req, res, next) {

  models.Client.findByIdAndRemove(req.params.clientId, function (err) {
    if (err) {
      return next(err);
    }
    res.redirect('/admin/oauth', 303);
  });
});

