let auth = require('./auth.js');
let db = require('./database.js');
let uuidv1 = require('uuid/v1');
let cr = require('./chatroom.js');

let sockets = {};
let recent_msgs = [];
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
		sockets[user.signedInAs] = socket;

		/**
		 * Checks whether user is authentificated
		 */
		if(user != null)
		{
			/**
			 * Send a friendrequest to an user
			 */
			socket.on('addfriend', async friend =>
			{
				var userdata = await db.getUserData(user.signedInAs);
				var friends = userdata.friends;

				for (let i = 0; i < friends.length; i++)
				{
					if (friends[i] == friend)
						return;
				}

				await db.createFriendrequest(uuidv1(), user.signedInAs, friend);

				var friendrequests_friend = await db.getFriendrequestsforUser(friend);

				if (typeof sockets[friend] !== 'undefined')
				{
					sockets[friend].emit('friendrequests', friendrequests_friend);
				}
			});

			/**
			 * Client accepts or denies friendrequest
			 */
			socket.on('answer friendrequest', async data =>
			{
				var dbstatus = await db.getFriendrequestData(data.id);

				if (data.status == 'send' || dbstatus.status != 'send')
					return;

				if (data.status == 'accepted')
				{
					await db.updateFriendrequest(data.id, 'accepted');
					await db.addFriend(user.signedInAs, data.requester);
					await db.addFriend(data.requester, user.signedInAs);
					var chatroom = new cr.Chatroom(Date.now(), [user.signedInAs, data.requester], [], 'Chat: ' + user.signedInAs + "," + data.requester, uuidv1());
					await db.createChatroom(chatroom);
				}

				if (data.status == 'denied')
				{
					await db.updateFriendrequest(data.id, 'denied');
				}

				var userdata = await db.getUserData(user.signedInAs);
				var friends = userdata.friends;
				var friendrequests = await db.getFriendrequestsforUser(user.signedInAs);
				socket.emit('friendlist', friends);
				socket.emit('friendrequests', friendrequests);

				var requesterdata = await db.getUserData(data.requester);
				var friends_requester = requesterdata.friends;
				var friendrequests_requester = await db.getFriendrequestsforUser(data.requester);

				if (typeof sockets[data.requester] !== 'undefined')
				{
					sockets[data.requester].emit('friendlist', friends_requester);
					sockets[data.requester].emit('friendrequests', friendrequests_requester);
				}
			});

			/**
			 * Searches for users in the database
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
				if(recent_msgs.length > 50)
					recent_msgs.splice(0, recent_msgs.length-50)
			});

			/**
			 * Deletes client from object of connected users
			 */
			socket.on('disconnect', function()
			{
				sockets[user.signedInAs] = undefined;
			});

			/**
			 * Sends friendlist after auth
			 */
			var userdata = await db.getUserData(user.signedInAs);
			var friends = userdata.friends;
			socket.emit('friendlist', friends);

			/**
			 * Sends friendrequests after auth
			 */
			var friendrequests = await db.getFriendrequestsforUser(user.signedInAs);
			socket.emit('friendrequests', friendrequests);

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
};