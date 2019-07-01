let jwt = require('jsonwebtoken');
var db = require('./database.js');
var enc = require('./encryption.js');

/**
 * Authentificates user by giving him an authentification token
 *
 * @param combo: object with user (username) and pass (password)
 * @returns auth-token
 */
module.exports.authenticate = function(combo)
{
	return jwt.sign({'signedInAs': combo.user}, 'MySuperSecretKey');
}

/**
 * Validates authentification token
 *
 * @param token: JSON token used to authentificate a user
 * @returns whether token is valid
 */
module.exports.validate = function(token)
{
	try
	{
		return jwt.verify(token, 'MySuperSecretKey');
	}
	catch(e)
	{
		return null;
	}
}

/**
 * Checks whether given login username and password are valid
 *
 * @param username: username used to identify the user in the database
 * @param password: plaintext password given as input by user
 * @returns whether user credentials are valid
 */
module.exports.loginOnDatabase = async function(username, password)
{
	var userExists = await db.isUserExisting(username);

	if (!userExists)
		return false;

	var userData = await db.getUserData(username);
	var passwordMatch = await enc.doesPasswordMatch(password, userData.password);

	if (!passwordMatch)
		return false;

	console.log(username + " successfully logged in!");

	return true;
}

/**
 * Creates user with given username & password
 *
 * @param username: username for the creation of a user on the database
 * @param password: plaintext password given as input by user
 */
module.exports.register = async function(username, password)
{
	var password_hashed = await enc.generateHash(password);

	await db.createUser(username, password_hashed);
}