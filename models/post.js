// models/post.js

var exports = module.exports = {};

// variables
var Q = require('q');
var mysql = require('mysql');
var configDB = require('../config/database.js');
var pool = mysql.createPool(configDB);


exports.save = function(post, title, userid){
	var deferred = Q.defer();

	pool.getConnection(function (err, connection){
		if(err){
			connection.release();
			res.status(500).send('Connection Error');
			return;
		}

		connection.query('INSERT INTO posts (post_content, post_title, post_author) VALUES (?,?,?)', [post, title, userid], function(err, result){
			connection.release();
			if(!err){
				deferred.resolve(result);
			}
		});
	});
	return deferred.promise;
}

exports.byId = function (id){
	var deferred = Q.defer();

	qs = "SELECT * FROM posts WHERE id = " + id;
	pool.getConnection(function(err, connection){
		if(err){
			throw err;
			connection.release();
			res.status(500).send('Initial get posts connection error');
			return;
		}
		connection.query(qs, function(err, result){
			connection.release();
			if(!err){
				deferred.resolve(result);
			}
		});
	});
	return deferred.promise;
}

function byDate(limit){
	var deferred = Q.defer();

	limit = typeof limit !== 'undefined' ? limit : 15;

	querystring = typeof querystring !== 'undefined' ? 
	querystring : "SELECT posts.*, users.nickname FROM posts INNER JOIN users ON users.id = posts.post_author ORDER BY post_date LIMIT " + limit;

	pool.getConnection(function(err, connection){
		if(err){
			throw err;
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

exports.byRecent = function (){
	var deferred = Q.defer();

	querystring = "SELECT * FROM posts ORDER BY post_date LIMIT 3";
	byDate(querystring).then(function(recenttab){
		deferred.resolve(recenttab);
	});

	return deferred.promise;
}

exports.byPopular = function (){
	var deferred = Q.defer();

	querystring = "SELECT * FROM posts ORDER BY post_voterelate DESC LIMIT 3";
	byDate(querystring).then(function(recenttab){
		deferred.resolve(recenttab);
	});

	return deferred.promise;
}

exports.generate = function (rawpost){
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

module.exports.byDate = byDate;