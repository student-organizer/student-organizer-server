let auth = require('./auth');

//IE8 Date.now compatibility
if (!Date.now) {
	Date.now = function() { return new Date().getTime(); }
}

let recent_msgs = []
let io;

function onConnection(socket) {

	socket.on('get token', combo =>{
		let auth_token = auth.authenticate(combo);
		socket.emit('token', auth_token)
	});

	socket.on('auth', token => {

		let user = auth.validate(token);

		if(user != null){ //Auth successful

			//Send message
			socket.on('send message', msg => {
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

			//Give new clients the most recent messages
			recent_msgs.forEach(msg => {
				socket.emit('new message', msg);
			});

		}else{
			socket.emit('auth_error', "Invalid credentials.");
		}
	});
}

module.exports = {
	serve: function(http){
		io = require('socket.io')(http);
		io.on('connection', onConnection);
	}
};