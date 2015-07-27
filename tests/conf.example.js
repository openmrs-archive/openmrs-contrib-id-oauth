exports = module.exports = {
  site: 'http://localhost:3000', // Dashboard's url
  user: { // user used for testing
    username: 'lucky',
    password: 'secret',
  },
  // registered client
  redirectURI: 'http://localhost:4000/callback',
  clientID: '55bb543461e6a4fc2f727c0c',
  clientSecret: '8l2ozrLLocgM',
  // MongoDB connection URI, same as Dashboard's
  mongoURI: 'mongodb://mongo_user:secret@localhost/id_dashboard',
};
