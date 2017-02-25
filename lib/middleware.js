'use strict'
// helper function to add req.user
exports.ensureUser = (req, res, next) => {
    if (req.session) {
        req.user = req.session.user;
    }
    return next();
};