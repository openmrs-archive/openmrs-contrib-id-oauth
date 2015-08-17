'use strict';
/*jshint expr: true*/
var url = require('url');
var request = require('request');
var async = require('async');
var expect = require('chai').expect;
var querystring = require('querystring');
var cheerio = require('cheerio');
var mongoose = require('mongoose');
var _ = require('lodash');

var AccessToken = require('../lib/models').AccessToken;

require('../../../logger'); // patch the log4js
var User = require('../../../models/user');


var conf = require('./conf');
var site = conf.site;
var username = conf.user.username;
var password = conf.user.password;
var redirectURI = conf.redirectURI;
var clientID = conf.clientID;
var clientSecret = conf.clientSecret;

var clear = function (callback) {
  User.findOne({username: username}, function (err, user) {
    expect(err).to.be.null;
    AccessToken.findOneAndRemove({userId: user._id, clientId: clientID},
      function (err) {

      expect(err).to.be.null;
      return callback();
    });
  });
};
describe('OAuth2', function () {
  before(function (done) {
    mongoose.connect(conf.mongoURI, function () {
      clear(done);
    });
  });
  after(function (done) {
    clear(done);
  });


  it ('lala', function (done) {
    async.waterfall([

    function login (callback) {
      // enable cookie
      request.post({
        url: url.resolve(site, 'login'),
        jar: true,
        form: {
          loginusername: username,
          loginpassword: password,
        },
      }, function (e, r, body) {
        expect(e).to.be.null;
        callback();
      });
    },

    function ensure (callback) {
      request.get({
        url: url.resolve(site, 'login'),
        jar: true,
        followRedirect: false,
      }, function (e, r, body) {
        expect(e).to.be.null;
        // if already logged in, you'll be redirected
        expect(r.statusCode).to.equal(302);
        callback();
      });
    },

    function retrieveAuthCode (callback) {
      var qs = querystring.stringify({
        response_type: 'code',
        client_id: clientID,
        redirect_uri: redirectURI,
      });
      var tmp = url.resolve(site, 'oauth/authorize') + '?' + qs;
      request.get({
        url: tmp,
        jar: true,
        followRedirect: false,
      }, function (e, r, body) {
        expect(e).to.be.null;
        var $ = cheerio.load(body);
        var data = {
          transaction_id: $('form input[name=transaction_id]').val(),
          client_id: clientID,
          allow: 'allow',
        };

        request.post({
          url: url.resolve(site, 'oauth/authorize/decision'),
          form: data,
          jar: true,
        }, function (e, r, body) {
          expect(e).to.be.null;
          expect(r.statusCode).to.equal(302);

          var location = r.headers.location;
          var code = url.parse(location, true).query.code;
          return callback(null, code);
        });

      });

    },

    function exchangeAccessToken (code, callback) {
      var data = {
        client_id: clientID,
        redirect_uri: redirectURI,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
      };
      request.post({
        url: url.resolve(site, 'oauth/token'),
        form: data,
      }, function (e, r, body) {
        expect(e).to.be.null;
        body = JSON.parse(body);
        expect(body.access_token).to.exist;
        callback(null, body.access_token);
      });
    },

    function checkAPICall (token, callback) {
      request.get({
        url: url.resolve(site, 'oauth/userinfo'),
        headers: {
          'Authorization': 'BEARER ' + token,
        },
      }, function (e, r, body) {
        body = JSON.parse(body);
        expect(body.uid).to.equal(username);
        callback();
      });
    },

    function testImmediate (callback) { // do authorization again
      var qs = querystring.stringify({
        response_type: 'code',
        client_id: clientID,
        redirect_uri: redirectURI,
      });
      var tmp = url.resolve(site, 'oauth/authorize') + '?' + qs;
      request.get({
        url: tmp,
        jar: true,
        followRedirect: false,
      }, function (e, r, body) {
        expect(e).to.be.null;
        expect(r.statusCode).to.equal(302);
        expect(_.startsWith(r.headers.location, redirectURI)).to.be.true;
        callback();
      });
    }

    ], done);
  });
});
