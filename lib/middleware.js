// helper function to add req.user
exports.ensureUser = function (req, res, next) {
  if (req.session) {
    req.user = req.session.user;
  }
  return next();
};

