'use strict';
/*jshint expr: true*/
const url = require('url');
const request = require('request');
const async = require('async');
const expect = require('chai').expect;
const querystring = require('querystring');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const _ = require('lodash');

const AccessToken = require('../lib/models').AccessToken;

require('../../../logger'); // patch the log4js
const User = require('../../../models/user');


const conf = require('./conf');
const site = conf.site;
const username = conf.user.username;
const password = conf.user.password;
const redirectURI = conf.redirectURI;
const clientID = conf.clientID;
const clientSecret = conf.clientSecret;

const clear = callback => {
	User.findOne({
		username: username
	}, (err, user) => {
		expect(err).to.be.null;
		AccessToken.findOneAndRemove({
				userId: user._id,
				clientId: clientID
			},
			err => {

				expect(err).to.be.null;
				return callback();
			});
	});
};
describe('OAuth2', () => {
	before(done => {
		mongoose.connect(conf.mongoURI, () => {
			clear(done);
		});
	});
	after(done => {
		clear(done);
	});


	it('lala', done => {
		async.waterfall([

			function login(callback) {
				// enable cookie
				request.post({
					url: url.resolve(site, 'login'),
					jar: true,
					form: {
						loginusername: username,
						loginpassword: password,
					},
				}, (e, r, body) => {
					expect(e).to.be.null;
					callback();
				});
			},

			function ensure(callback) {
				request.get({
					url: url.resolve(site, 'login'),
					jar: true,
					followRedirect: false,
				}, (e, r, body) => {
					expect(e).to.be.null;
					// if already logged in, you'll be redirected
					expect(r.statusCode).to.equal(302);
					callback();
				});
			},

			function retrieveAuthCode(callback) {
				const qs = querystring.stringify({
					response_type: 'code',
					client_id: clientID,
					redirect_uri: redirectURI,
				});
				const tmp = `${url.resolve(site, 'oauth/authorize')}?${qs}`;
				request.get({
					url: tmp,
					jar: true,
					followRedirect: false,
				}, (e, r, body) => {
					expect(e).to.be.null;
					const $ = cheerio.load(body);
					const data = {
						transaction_id: $('form input[name=transaction_id]').val(),
						client_id: clientID,
						allow: 'allow',
					};

					request.post({
						url: url.resolve(site, 'oauth/authorize/decision'),
						form: data,
						jar: true,
					}, (e, r, body) => {
						expect(e).to.be.null;
						expect(r.statusCode).to.equal(302);

						const location = r.headers.location;
						const code = url.parse(location, true).query.code;
						return callback(null, code);
					});

				});

			},

			function exchangeAccessToken(code, callback) {
				const data = {
					client_id: clientID,
					redirect_uri: redirectURI,
					client_secret: clientSecret,
					code: code,
					grant_type: 'authorization_code',
				};
				request.post({
					url: url.resolve(site, 'oauth/token'),
					form: data,
				}, (e, r, body) => {
					expect(e).to.be.null;
					body = JSON.parse(body);
					expect(body.access_token).to.exist;
					callback(null, body.access_token);
				});
			},

			function checkAPICall(token, callback) {
				request.get({
					url: url.resolve(site, 'oauth/userinfo'),
					headers: {
						'Authorization': `BEARER ${token}`,
					},
				}, (e, r, body) => {
					body = JSON.parse(body);
					expect(body.uid).to.equal(username);
					callback();
				});
			},

			function testImmediate(callback) { // do authorization again
				const qs = querystring.stringify({
					response_type: 'code',
					client_id: clientID,
					redirect_uri: redirectURI,
				});
				const tmp = `${url.resolve(site, 'oauth/authorize')}?${qs}`;
				request.get({
					url: tmp,
					jar: true,
					followRedirect: false,
				}, (e, r, body) => {
					expect(e).to.be.null;
					expect(r.statusCode).to.equal(302);
					expect(_.startsWith(r.headers.location, redirectURI)).to.be.true;
					callback();
				});
			}

		], done);
	});
});