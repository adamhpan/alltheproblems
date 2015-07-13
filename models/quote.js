// models/quotes.js

var exports = module.exports = {};

// variables
var Q = require('q');
var mysql = require('mysql');
var configDB = require('../config/database.js');
var pool = mysql.createPool(configDB);

exports.byDate = function (){
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

exports.save = function(quote, author){
	var deferred = Q.defer();

	pool.getConnection(function (err, connection){
		if(err){
			connection.release();
			res.status(500).send('Connection Error');
			return;
		}

		connection.query('INSERT INTO quotes (quote, quoter) VALUES (?,?)', [quote, author], function(err, result){
			connection.release();
			if(!err){
				deferred.resolve(result);
			}
		});
	});
	return deferred.promise;
}