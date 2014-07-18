var Common = require(global.__commonModule);
var app = require('./lib/app');

// Require oauth2, which contains goodies pertaining to our OAuth implementation
Common.module.oauth = require('./lib/oauth2');

// Load the app and mount it within OpenMRS ID
Common.app.use(app);

// Load the admin page
require('./lib/admin');