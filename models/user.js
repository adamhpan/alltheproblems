// app/models/user.js

var exports = module.exports = {};
var bcrypt 	= require('bcrypt');



// METHODS =====================================================================
	// HASH GENERATION
	exports.generateHash = function (password){
		return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
	}

	// CHECKING IF THE PASSOWRD IS CORRECT
	exports.validPassword = function (password){
		return bcrypt.conpareSync(password, this.local.password);
	}

	