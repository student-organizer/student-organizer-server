let jwt = require('jsonwebtoken');

module.exports = {
	authenticate: function(combo){ //TODO
		if(combo.pass === 'geheim123')
			return jwt.sign({'signedInAs': combo.user}, 'MySuperSecretKey');
		return null;
	},

	validate: function(token){
		try{
			return jwt.verify(token, 'MySuperSecretKey');
		}catch(e){
			return null;
		}
	}
};