let auth = require('./auth.js');
let db = require('./database.js');

let recent_msgs = []
let io;

/**
 * IE8 Date.now compatibility
 */
if (!Date.now)
{
	Date.now = function() { return new Date().getTime(); }
}

/**
 * Handles the initial connection between the client and the server
 */
function onConnection(socket)
{
	/**
	 * @emits JSON token
	 */
	socket.on('get token', async combo =>
	{
		let validlogged = await auth.loginOnDatabase(combo.user, combo.pass);

		if (!validlogged)
			return false;

		let auth_token = auth.authenticate(combo);
		socket.emit('token', auth_token)
	});

	/**
	 * Executes database registration
	 */
	socket.on('register', combo =>
	{
		auth.register(combo.user, combo.pass);
	});

	/**
	 * Authentificates user through token
	 */
	socket.on('auth', async token =>
	{

		let user = auth.validate(token);

		/**
		 * Checks whether user is authentificated
		 */
		if(user != null)
		{
			/**
			 * Adds a friend to the user's friendlist
			 */
			socket.on('addfriend', async friend =>
			{
				var userdata = await db.getUserData(user.signedInAs);
				var friends = userdata.friends;

				for (var i = 0; i < friends.length; i++)
				{
					if (friends[i] == friend)
						return;
				}

				await db.addFriend(user.signedInAs, friend);

				userdata = await db.getUserData(user.signedInAs);
				friends = userdata.friends;

				socket.emit('friendlist', friends);
			});

			/**
			 * Sends most recent messages to user
			 */
			socket.on('searchuser', async searchquery =>
			{
				var searchresults = await db.findUsers(searchquery, user.signedInAs);
				socket.emit('search finished', searchresults);
			});

			/**
			 * Sends message
			 */
			socket.on('send message', msg =>
			{
				let message = {
					timestamp: Date.now(),
					author: user.signedInAs,
					msg: msg,
				};
				io.emit('new message', message);
				recent_msgs.push(message);

				//Clear any old messages
				if(recent_msgs.length>50)
					recent_msgs.splice(0, recent_msgs.length-50)
			});

			/**
			 * Sends friendlist after auth
			 */
			var userdata = await db.getUserData(user.signedInAs);
			var friends = userdata.friends;
			socket.emit('friendlist', friends);

			/**
			 * Sends most recent messages to client
			 */
			recent_msgs.forEach(msg =>
			{
				socket.emit('new message', msg);
			});
		}
		else
		{
			socket.emit('auth_error', "Invalid credentials.");
		}
	});
}

module.exports.serve = function(http)
{
	io = require('socket.io')(http);
	io.on('connection', onConnection);
}