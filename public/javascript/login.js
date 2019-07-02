let socket = io();

function login(){
	let username = document.getElementById('username');
	let pass = document.getElementById('password');
	let combo = {'user': username.value, 'pass': pass.value};

	socket.on('token', token => {
		if(token !== null){
			username.value = '';
			pass.value = '';
			createCookie("auth_token",token,7);
			alert("Successfully logged in!"); //TODO: this is ugly, make good
		}else{
			alert("Invalid credentials.");
		}
	});
	socket.emit("get token", combo);
}