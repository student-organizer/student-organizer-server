let jwt = require('jsonwebtoken');
var db = require('./database.js');
var enc = require('./encryption.js');

module.exports = {
	authenticate: function(combo)
	{
		return jwt.sign({'signedInAs': combo.user}, 'MySuperSecretKey');
	},

	validate: function(token) {
		try{
			return jwt.verify(token, 'MySuperSecretKey');
		}catch(e){
			return null;
		}
	},

	loginOnDatabase: async function(username, password) {
		var userExists = await db.IsUserExisting(username);

		if (!userExists)
			return false;

		var userData = await db.GetUserData(username);
		var passwordMatch = await enc.DoesPasswordMatch(password, userData.user.password);

		if (!passwordMatch)
			return false;

		console.log(username + " successfully logged in!");

		return true;
	},

	register: async function(username, password) {
		var password_hashed = await enc.GenerateHash(password);

		await db.CreateUser(username, password_hashed);
	}
};