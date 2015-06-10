var exports = module.exports = {};

 // using the mysql module to connect to the db
var mysql = require('mysql');
var config = require('../lib/config');

 // creating initial connection pool
var pool = mysql.createPool({
	// maximum new connections at one time
	connectionLimit: 100,
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'alltheproblems',
	debug: false
});

// main function which will return either the requested posts or an error page
function get_posts(posttype){
	pool.getConnection(function(err, connection){
		if(err){
			connection.release();
			res.status(500).send('Initial get posts connection error');
			return;
		}
		connection.query("SELECT * FROM post LIMIT 2", function(err, rows){
			connection.release();
			if(!err){
				console.log("Returned rows");
				return {
					posts: rows
				};
			}
		});

	});
}

// function handle_database(req, res) {
// 	pool.getConnection(function(err, connection){
// 		if(err) {
// 			connection.release();
// 			res.json({"code": 100, "status": "Error in connecting to database"});
// 			return;
// 		}

// 		console.log('connected as id ' + connection.threadId);

// 		connection.query("select * from potluck", function(err, rows){
// 			connection.release();
// 			if(!err){
// 				res.json(rows);
// 			}
// 		});

// 		connection.on('error', function(err){
// 			res.json({"code": 100, "status" : "Error in connection database"});
// 			erturn;
// 		})
// 	});
// }

exports.get_posts = get_posts;