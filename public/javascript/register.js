let socket = io();

function register(){
	let username = document.getElementById('username');
	let pass = document.getElementById('password');
	let confirm = document.getElementById('confirm');
	if(confirm.value !== pass.value) {
		pass.value = '';
		confirm.value = '';
		pass.focus();
		alert("The passwords did not match."); //TODO: this is ugly, make good
		return false;
	}
	let combo = {'user': username.value, 'pass': pass.value};

	socket.on('register-callback', ret_user => {
		console.log("Hello");
		if(ret_user == username.value){
			username.value = '';
			pass.value = '';
			confirm.value = '';
			alert("Successfully registered!");
		}else{
			alert("Something went wrong.");
		}
	});
	socket.emit("register", combo);

}