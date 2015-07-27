'use strict';
var models = require('./models');

exports = module.exports = function (app) {


app.admin.addPage('OAuth', '/admin/oauth');

app.get('/admin/oauth', function(req, res, next) {
  models.Client.find({}, function (err, clients) {
    if (err) {
      return next(err);
    }
    res.render(__dirname + '/../views/oauth-admin', {clients: clients || []});
  });
});

app.post('/admin/oauth', function(req, res, next) {
  var client = new models.Client({
    name: req.body.name,
    secret: req.body.secret,
    redirectURI: req.body.redirectURI
  });
  client.save(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect(303, '/admin/oauth');
  });
});

app.get('/admin/oauth/delete/:clientId', function(req, res, next) {
  models.Client.findByIdAndRemove(req.params.clientId, function (err) {
    if (err) {
      return next(err);
    }
    res.redirect(303, '/admin/oauth');
  });
});


};
