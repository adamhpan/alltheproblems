// app/routes.js

module.exports = function(app, passport, siteurl){

	// variables
	var siteurl 	= siteurl;
	var Q 			= require('q');
	var post_M 		= require('../models/post.js');
	var quote_M 	= require('../models/quote.js');
	var mysql 		= require('mysql');
	var configDB 	= require('../config/database.js');
	var connection	= mysql.createConnection(configDB);
	
	// =====================================
	// HOME PAGE ===========================
	// =====================================
	app.get("/", function (req,res) {
		Q.all([post_M.byDate(), post_M.byRecent(), post_M.byPopular(), quote_M.byDate()]).then(function(result){
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

	
	// =====================================
	// LOGIN PAGE ==========================
	// =====================================
	// Login form
	app.get("/login", function (req, res, next){
		res.render("login", {siteurl:siteurl, message: req.flash('loginMessage')});
	});

	app.post('/login', passport.authenticate('local-signin', {
		successRedirect : '/dashboard',
		faliureRedirect : '/signup',
		failureFlash	: true
	}));

	// =====================================
	// SIGN UP =============================
	// =====================================
	app.get('/signup', function (req, res){
		res.render('signup', {siteurl:siteurl, message: req.flash('signupMessage')});
	});

	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/dashboard',
		faliureRedirect : '/signup',
		failureFlash 	: true
	}));

	// =====================================
	// LOGOUT CALL =========================
	// =====================================
	app.get('/logout', function (req, res){
		req.logout();
		res.redirect('/');
	});

	// =====================================
	// CONTACT US PAGE =====================
	// =====================================
	app.get("/contact-us", function (req,res){
		res.render('contact-us', {siteurl:siteurl});
	});

	// Submit contact us form
	app.post("/contact-us", function (req,res){
		var data = {status: "fail"};
		var info = req.body;
		var query = 'INSERT contactus (contactus_email, contactus_reason, contactus_content)' +
		'VALUES ("' + info.email + '","' + info.reason + '","' + info.content + '");';
		
		connection.query(query, function(err, result){
			if(!err){
				data.status = "success";
			}
			res.json(data); 
		});
	});

	// =====================================
	// FWP POST PAGES ======================
	// =====================================
	// Main posts page
	app.get("/s/:postid", function (req, res){
		post_M.byId(req.params.postid).then(function (row){
			var metadata = {url:row[0].post_title, description:row[0].post_content};
			res.render('single', {siteurl: siteurl, post: row[0], metaset:metadata});
			return;
		});
	});

	// Searching for posts
	app.get("/search*", function (req, res){
		var terms = "";
		var termarray = req.query.q.split(" ");
		for( i = 0; i < termarray.length; i++){
			terms += " +"+termarray[i];
		}

		Q.all([post_M.byRecent(), post_M.byPopular(), quote_M.byDate()]).then(function(result){
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
					var quotetoquery = {
						quote: 'We tried our best to find "' + req.query.q + '"',
						quoter: "The friendly ATP robot",
						query: req.query.q
					}
					res.render('index', {siteurl:siteurl, recent:recent, popular:popular, posts:rows, quote: quotetoquery});
				}
			});
		})
	});

	// Loading more posts
	app.get("/loadmore", function (req,res){
		var querystring = "SELECT * FROM posts ORDER BY post_date LIMIT " + req.query.currentrow + ",15";
		connection.query(querystring, function(err, rows){
			if(!err){
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

	// updating a post's votes
	app.post("/vote", function (req,res) {
		var qs = "UPDATE post SET post_vote"+req.body.votetype+" = post_vote"+req.body.votetype+" + 1 WHERE id ="+req.body.postid;
		connection.query(qs, function(err, rows){
			if(!err){
				res.json({status: "success"});
			}
		});
	});

	// =====================================
	// USER DASHBOARD ======================
	// =====================================
	// dashboard view
	app.get("/dashboard", requireLogin, function (req, res, next){
		console.log('dashboard call');
		if(req.user.group_id == 1){

		}
		post_M.byDate(1000).then(function (result){
			console.log(result);
			res.render("dashboard", {siteurl:siteurl, user:req.user, posts: result});
		});
	});

	app.post('/save/quote', requireLogin, function (req, res){
		limit = 1000;
		Q.all([quote_M.save(req.body.quote, req.body.author), post_M.byDate(limit)]).then(function(result){
			res.render('dashboard', {siteurl: siteurl, user:req.user, message: 'The quote has been added', posts:result[1]});
		});
	});

	app.post('/save/post', requireLogin, function (req, res){
		limit = 1000;
		console.log(req.user);
		Q.all([post_M.save(req.body.post, req.body.title, req.user.id), post_M.byDate(limit)]).then(function(result){
			res.render('dashboard', {siteurl: siteurl, user:req.user, message: 'The post has been added', posts:result[1]});
		});
	});

	// =====================================
	// FACEBOOK AUTHENTICATION =============
	// =====================================

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

	// route middle to make sure that they are logged in
	function requireLogin(req, res, next) {
	  	if (req.isAuthenticated())
	  		return next();
		res.redirect('/login');
	};
}