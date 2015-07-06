var express = require('express');
var _ = require('underscore');
var bodyParser = require('body-parser');
var config = require('./lib/config');
var cors = require('cors');
var Q = require('q');
var pagination = require('pagination');
var mysql = require('mysql');
var config = require('./lib/config');
var passport = require('passport');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var app =  express();
var FacebookStrategy = require('passport-facebook').Strategy;

// var siteurl = "http://afternoon-springs-1968.herokuapp.com";
var siteurl = "http://localhost:5000";
var FACEBOOK_APP_ID = "304683993067792"
	, FACEBOOK_APP_SECRET = "143ca9e2209005564b75d491e374f654";

// creating initial connection pool
var pool = mysql.createPool({
	// maximum new connections at one time
	connectionLimit: 100,
	host: 'us-cdbr-iron-east-02.cleardb.net',
	user: 'b4813ec7b454d9',
	password: '2c10c5ac',
	database: 'heroku_4bd6aca5ce613e5',
	// port: '5432',
	debug: false
});

// middleware
app.set('view engine', 'ejs');
app.set('view options', {layout:false});
app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use('/bower_components', express.static(__dirname + '/bower_components'));
app.use('/public', express.static('public'));
app.use(session({
	secret: 'Some Long Ass Random String',
	resave: true,
	saveUninitialized: false,
	cookie: {
		secure: false,
		maxAge: (4 * 60 * 60 * 1000)
	},
}));
app.use(passport.initialize());
app.use(passport.session());


// Passport
passport.use(new FacebookStrategy({
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

passport.serializeUser(function(user, done){
	curuser = {};
	curuser.id = user.id;
	curuser.provider = user.provider;
	done(null, curuser);
});

passport.deserializeUser(function(user, done){
	console.log('Deserialize User');
	console.log(user);
	switch(user.provider){
		case 'facebook':
		var querystring = "SELET * FROM users WHERE oauth_provider = facebook";
		break;
		default:
		var querystring = "SELET * FROM users";
		break;
	}
	query(querystring).then(function(user){
		console.log("user query");
		console.log(JSON.parse(JSON.stringify(user)));
		
	});
	
	if(user.id == undefined)
	user.id="test";
	user.email="test@test.com";
	done(user, true);
	// query(querystring).then(function(rows){
		// done(err, rows[0]);
	// });
});


// Auth
function requireSession(req, res, next){
	if(req.session && req.session.user){
		switch(req.body.authtype){
			case "local":
				querystring = "SELECT * FROM USER"
				break;
			case "facebook":
				querystring = "SELECT * FROM user WHERE user_facebook ="+req.body.userid;
				break;
			default:
				querystring = "";
		}
		query(querystring).then(function(err, user){

		})
	}
}

function query(querystring){
	var deferred = Q.defer();
	pool.getConnection(function(err, connection){
		if(err){
			connection.release();
			res.status(500).send('Query Error');
			return;
		}
		connection.query( querystring, function(err, rows){
			connection.release();
			if(!err){
				deferred.resolve(rows);
			}
		});
	});
	return deferred.promise;
}

app.get('/auth/facebook', 
	passport.authenticate('facebook'),
	function (req,res){}
);

app.get('/auth/facebook/callback', 
	passport.authenticate('facebook', {faliureRedirect: '/login'}),
	function (req, res){
		console.log("Facebook Callback");
		res.redirect('/dashboard');
	});

function requireLogin(req, res, next) {
  	if (req.isAuthenticated()) { 
  		return next(); }
	res.redirect('/login');
};

function getPostByDate(querystring){
	var deferred = Q.defer();

	querystring = typeof querystring !== 'undefined' ? 
	querystring : "SELECT * FROM post ORDER BY post_date LIMIT 15";

	pool.getConnection(function(err, connection){
		if(err){
			connection.release();
			res.status(500).send('Initial get posts connection error');
			return;
		}
		connection.query( querystring, function(err, rows){
			connection.release();
			if(!err){
				deferred.resolve(rows);
			}
		});
	});
	return deferred.promise;
}

function getRecentPost(){
	var deferred = Q.defer();

	querystring = "SELECT * FROM post ORDER BY post_date LIMIT 3";
	getPostByDate(querystring).then(function(recenttab){
		deferred.resolve(recenttab);
	});

	return deferred.promise;
}

function getPopularPost(){
	var deferred = Q.defer();

	querystring = "SELECT * FROM post ORDER BY post_voterelate DESC LIMIT 3";
	getPostByDate(querystring).then(function(recenttab){
		deferred.resolve(recenttab);
	});

	return deferred.promise;
}

function getQuote(){
	var deferred = Q.defer();

	pool.getConnection(function (err, connection){
		if(err){
			connection.release();
			res.status(500).send('Initial get posts connection error');
			return;
		}

		connection.query("SELECT * FROM quotes ORDER BY id DESC LIMIT 1", function (err, quote){
			connection.release();
			if(!err){
				deferred.resolve(quote);
			}
		});
	});
	return deferred.promise;
}

function generatePost(rawpost){
	var title = rawpost.post_title || "";
	var curdate = formatDate(rawpost.post_date);
	var html = '<div class="grid-item col-lg-4 col-md-6 col-sm-12 col-xs-12" data-postid="new' + rawpost.id + '">' +
		'<div class="grid-gutter">' +
			'<h3>' + title + '</h3>' +
			'<div class="col-md-3 pull-left" id="posttag">' +
			'</div>' +
			'<div class="postdate pull-right">' +
				'<i class="fa fa-calendar pull-left" style="margin:2px 10px"></i>' + curdate +
			'</div>' +
			'<div class="clearfix"></div>' +
			'<p>'
				 + rawpost.post_content + 
			'</p>' +
			'<a class="readmore pull-right btn btn-danger">' +
				'Read More' +
			'</a><div class="clearfix"></div><hr/>' +
			'<div class="col-md-3 col-sm-3 col-xs-3 ihover" data-vote="relate"><i class="fa fa-heart-o fa-lg"></i><span>' + rawpost.post_voterelate + '</span></div>' +
			'<div class="col-md-3 col-sm-3 col-xs-3 ihover" data-vote="love"><i class="fa fa-smile-o fa-lg"></i><span>' + rawpost.post_votelove + '</span></div>' +
			'<div class="col-md-3 col-sm-3 col-xs-3 ihover" data-vote="hate"><i class="fa fa-frown-o fa-lg"></i><span>' + rawpost.post_votehate + '</span></div>' +
			'<div class="col-md-3 col-sm-3 col-xs-3 ihover share"><i class="fa fa-share-square-o fa-lg"></i></div>' +
			'<div class="clear"></div>' +
		'</div>' +
	'</div>';

	return html;
}

function formatDate(dateinput){
	var curdate = new Date(dateinput);
	var mS = ['Jan', 'Feb', 'March', 'April', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
	var newdate = curdate.getDate()+" "+mS[(curdate.getMonth()+1)]+" "+curdate.getFullYear();
	return newdate;
}

// index load - starting the app
app.get("/", function (req,res) {
	Q.all([getPostByDate(), getRecentPost(), getPopularPost(), getQuote()]).then(function(result){
		posts = result[0];
		recent = result[1];
		popular = result[2];
		quote = result[3][0];
		quote.query = false;
		var data = {title: "All The Problems", siteurl:siteurl, user: req.user,
		posts:posts, recent:recent, popular:popular, quote:quote};
		res.render('index', data);
	});
});

app.get("/contact-us", function (req,res){
	res.render('contact-us', {siteurl:siteurl});
});


app.get("/s/:postid", function (req, res){
	var querystring = "SELECT * FROM post WHERE id = " + req.params.postid;
	getPostByDate(querystring).then(function (row){
		var metadata = {url:row[0].post_title, description:row[0].post_content};
		res.render('single', {siteurl: siteurl, post: row[0], metaset:metadata});
		return;
	});
});

app.get("/loadmore", function (req,res){
	pool.getConnection(function(err, connection){
		if(err){
			connection.release();
			res.status(500).send('Vote query connection sucks.');
		}
		var querystring = "SELECT * FROM post ORDER BY post_date LIMIT " + req.query.currentrow + ",15";
		connection.query(querystring, function(err, rows){
			if(!err){
				connection.release();
				if(typeof rows[0] == 'undefined'){
					res.json({
						status: "nopost"
					});
					return;
				}
				var newpost = [];
				for( i = 0; i < rows.length; i++ ){
					newpost[i] = generatePost(rows[i]);
				}
				res.json({status: "success", posts: newpost});
			}
		});
	});
});

app.get("/search*", function (req, res){
	var terms = "";
	var termarray = req.query.q.split(" ");
	for( i = 0; i < termarray.length; i++){
		terms += " +"+termarray[i];
	}

	pool.getConnection(function (err, connection){
		if(err){
			connection.release();
			return false;
		}
		Q.all([getRecentPost(), getPopularPost(), getQuote()]).then(function(result){
			recent = result[0];
			popular = result[1];
			quote = result[2][0];
			quote.query = false;
			var querystring = "SELECT * FROM post WHERE MATCH(post_content,post_title, post_tags)"+
			"AGAINST('" + terms + "' IN BOOLEAN MODE)";

			if(req.query.currentrow > 14){
				querystring += " LIMIT " + req.query.currentrow + ",15";
			}

			connection.query(querystring, function (err, rows){
				if(!err){
					connection.release();
					var quotetoquery = {
						quote: 'We tried our best to find "' + req.query.q + '"',
						quoter: "The friendly ATP robot",
						query: req.query.q
					}
					res.render('index', {siteurl:siteurl, recent:recent, popular:popular, posts:rows, quote: quotetoquery});
				}
			});
		})
	})
});

// updating a post's votes
app.post("/vote", function (req,res) {
	pool.getConnection(function(err, connection){
		if(err){
			connection.release();
			res.status(500).send('Vote query connection sucks.');
		}
		var query = "UPDATE post SET post_vote"+req.body.votetype+" = post_vote"+req.body.votetype+" + 1 WHERE id ="+req.body.postid;
		connection.query(query, function(err, rows){
			if(!err){
				connection.release();
				res.json({status: "success"});
			}
		});
	});
});

app.post("/contact-us", function (req,res){
	pool.getConnection(function(err, connection){
		var data = {status: "fail"};
		if(err){
			connection.release();
			res.status(500).send("We just suck at coding, sorry.");
		}
		var info = req.body;
		var query = 'INSERT contactus (contactus_email, contactus_reason, contactus_content)' +
		'VALUES ("' + info.email + '","' + info.reason + '","' + info.content + '");';
		
		connection.query(query, function(err, result){
			if(!err){
				connection.release();
				data.status = "success";
			}
			res.json(data); 
		});
	});
});

app.get("/login", function (req, res, next){
	res.render("login", {siteurl:siteurl});
});

app.get('/logout', function (req, res){
	req.logout();

	res.redirect('/');
});

app.get("/dashboard", requireLogin, function (req, res, next){
	console.log('dashboard call');
	console.log(req.user.id);
	res.render("dashboard", {siteurl:siteurl, user:req.user});
});
app.listen(process.env.PORT || 5000);