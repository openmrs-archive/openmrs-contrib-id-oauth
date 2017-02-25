'use strict';
const models = require('./models');

exports = module.exports = app => {


    app.admin.addPage('OAuth', '/admin/oauth');

    app.get('/admin/oauth', (req, res, next) => {
        models.Client.find({}, (err, clients) => {
            if (err) {
                return next(err);
            }
            res.render(`${__dirname}/../views/oauth-admin`, {
                clients: clients || []
            });
        });
    });

    app.post('/admin/oauth', (req, res, next) => {
        const client = new models.Client({
            name: req.body.name,
            secret: req.body.secret,
            redirectURI: req.body.redirectURI
        });
        client.save(err => {
            if (err) {
                return next(err);
            }
            res.redirect(303, '/admin/oauth');
        });
    });

    app.get('/admin/oauth/delete/:clientId', (req, res, next) => {
        models.Client.findByIdAndRemove(req.params.clientId, err => {
            if (err) {
                return next(err);
            }
            res.redirect(303, '/admin/oauth');
        });
    });


};