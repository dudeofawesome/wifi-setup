module.exports = {
	/* requirements = {lowercase: true, uppercase: true, numbers: true, symbols: true} */
	/* specialLists = {lowercase: "??", uppercase: "??", numbers: "??", symbols: "??"} */
	generateStrongPassword: function (length, requirements, specialLists) {
		var lowercase = "abcdefghijklmnopqrstuvwxyz";
		var uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		var numbers = "0123456789";
		var symbols = "!@#$%^&*()-_+=,<.>/?|`~";
		if (specialLists != undefined) {
			if (specialLists.lowercase != undefined)
				lowercase = specialLists.lowercase;
			if (specialLists.uppercase != undefined)
				uppercase = specialLists.uppercase;
			if (specialLists.numbers != undefined)
				numbers = specialLists.numbers;
			if (specialLists.symbols != undefined)
				symbols = specialLists.symbols;
		}

		if (requirements == undefined)
			requirements = {};
		if (requirements.lowercase == undefined)
			requirements.lowercase = true;
		if (requirements.uppercase == undefined)
			requirements.uppercase = true;
		if (requirements.numbers == undefined)
			requirements.numbers = true;
		if (requirements.symbols == undefined)
			requirements.symbols = true;
		if (length == undefined)
			length = 24;

		var characters = ((requirements.lowercase) ? lowercase : "") + ((requirements.uppercase) ? uppercase : "") + ((requirements.numbers) ? numbers : "") + ((requirements.symbols) ? symbols : "");
		var password = "";
		for (var i = 0; i < length; i++) {
			password += characters[Math.floor(Math.random() * characters.length)];
		}

		return password;
	}
}