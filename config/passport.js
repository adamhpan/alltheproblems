// config/passport.js

// load the strategies
var LocalStrategy	 = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;

// load database
var configDB 		= require('./database.js');
var mysql 			= require('mysql');
var bcrypt 			= require('bcrypt-nodejs');
var connection		= mysql.createConnection(configDB);

// variables
var FACEBOOK_APP_ID 	= "304683993067792"
var FACEBOOK_APP_SECRET = "143ca9e2209005564b75d491e374f654";
var siteurl				= "http://localhost:5000";

module.exports = function(passport){
	// =====================================
	// PASSPORT SESSION SETUP ==============
	// =====================================
	passport.serializeUser(function(user, done){
		curuser = {};
		curuser.id = user.id;
		curuser.provider = user.provider;
		done(null, curuser);
	});

	passport.deserializeUser(function(user, done){
		var qs = "SELECT * FROM users WHERE id = " + user.id;
		connection.query(qs, function(err, rows){
			done(err, rows[0]);
		});
	});

	
	// =====================================
	// LOCAL SIGNUP ========================
	// =====================================
	passport.use(
		'local-signup',
		new LocalStrategy({
			usernameField 	  : 'email',
			passwordField 	  : 'password',
			passReqToCallback : true
		}, 
		function(req, email, password, done){
			var qs = "SELECT * FROM users WHERE email = " + connection.escape(email);
			connection.query(qs, function(err, rows){
				if(err)
					return done(err);
				if(rows.length){
					return done(null, false, req.flash('signupMessage', 'That username is already taken.'))
				}else{
					var newUser = {
						username: email,
						password: bcrypt.hashSync(password, bcrypt.genSaltSync(8), null)
					};

					var qs = "INSERT INTO users (email, password) values (?,?)";

					connection.query(qs, [newUser.username, newUser.password], function(err, rows){
						if(err)
							console.log(err);
						newUser.id = rows.insertId;

						return done(null, newUser);
					});
				}
			});
		}
	));

	// =====================================
	// LOCAL SIGNIN ========================
	// =====================================
	passport.use(
		'local-signin', 
		new LocalStrategy({
			usernameField 	  : 'email',
			passwordField 	  : 'password',
			passReqToCallback : true
		},
		function(req, email, password, done){
			var qs = "SELECT * FROM users WHERE email = " + connection.escape(email);
			connection.query(qs, function(err, rows){
				if(err)
					return done(err);
				if(!rows.length){
					return done(null, false, req.flash('loginMessage', 'No user found.'));
				}
				if(!bcrypt.compareSync(password, rows[0].password)){
					return done(null, false, req.flash('loginMessage', 'Incorrect password.'));
				}
				return done(null, rows[0]);
			});
		})
	);
	// =====================================
	// FACEBOOK SIGNUP =====================
	// =====================================
	passport.use(
		'facebook',
		new FacebookStrategy({
		clientID: FACEBOOK_APP_ID,
		clientSecret: FACEBOOK_APP_SECRET,
	    callbackURL: siteurl+"/auth/facebook/callback"
	  },
	  function(accessToken, refreshToken, profile, done) {
	    process.nextTick(function () {
	      return done(null, profile);
	    });
	  }
	));

}

