'use strict';
exports = module.exports = app => {


	require('./lib/admin')(app);
	require('./lib/app')(app);


};
/**
 * oauth implementation shouldn't be exposed, IMHO --- Ply_py
 */
// exports.oauth = require('./lib/oauth2');