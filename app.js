var siteurl = "http://localhost:5000";

// setup =======================================================================
var express  = require('express');
var app 	 = express();
var port 	 = process.env.PORT || 5000;
var passport = require('passport');
var flash	 = require('connect-flash');

var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

var _ = require('underscore');
var cors = require('cors');
var pagination = require('pagination');

// configuration ===============================================================
// var siteurl = "http://afternoon-springs-1968.herokuapp.com";
var siteurl 	= "http://localhost:5000";

require('./config/passport')(passport);

app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(bodyParser.json());

app.set('view engine', 'ejs');
app.set('view options', {layout:false});

app.use(cors());
app.use('/bower_components', express.static(__dirname + '/bower_components'));
app.use('/public', express.static('public'));
app.use(session({
	secret: 'whatamisupposedtoputinhere',
	resave: true,
	saveUninitialized: false,
	cookie: {
		secure: false,
		maxAge: (4 * 60 * 60 * 1000)
	},
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// routes ======================================================================
require('./app/routes.js')(app, passport);

// launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port);