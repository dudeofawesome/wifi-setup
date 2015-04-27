module.exports = {
	setText: function (msg, pos, clear) {
		if (clear == undefined)
			clear = true
		if (clear) {
			LCDqueue.push({func: 'home'});
			LCDqueue.push({func: 'clear'});
		}
		if (pos != undefined) {
			LCDqueue.push({func: 'setCursor', p1: pos.y, p2: pos.x});
		}
		LCDqueue.push({func: 'write', p1: msg});
		LCDqueue.push({func: 'home'});
	},
	clearText: function () {
		LCDqueue.push({func: 'clear'});
	},
	setColor: function (r, g, b) {
		toColor = {r:r, g:g, b:b};

		intervalColor = setInterval(function () {
			if ((color.r === toColor.r) &&
				(color.g === toColor.g) &&
				(color.b === toColor.b)) {
				clearInterval(intervalColor);
			} else {
				color.r = (color.r < toColor.r) ? color.r + 2 : color.r - 2;
				color.g = (color.g < toColor.g) ? color.g + 2 : color.g - 2;
				color.b = (color.b < toColor.b) ? color.b + 2 : color.b - 2;
				// catch bounds
				color.r = (color.r < 0) ? 0 : color.r;
				color.g = (color.g < 0) ? 0 : color.g;
				color.b = (color.b < 0) ? 0 : color.b;
				color.r = (color.r > 255) ? 255 : color.r;
				color.g = (color.g > 255) ? 255 : color.g;
				color.b = (color.b > 255) ? 255 : color.b;
			}
			LCD.setColor(color.r * brightness, color.g * brightness, color.b * brightness);
		}, 1);
	},
	brighten: function () {
		var intervalBrightness = setInterval(function () {
			if (brightness >= 1) {
				brightness = 1;
				clearInterval(intervalBrightness);
			}
			else
				brightness += 0.0025;
			LCD.setColor(color.r * brightness, color.g * brightness, color.b * brightness);
		}, 1)
	},
	dim: function () {
		intervalBrightness = setInterval(function () {
			if (brightness <= 0) {
				brightness = 0;
				clearInterval(intervalBrightness);
			}
			else
				brightness -= 0.0025;
			LCD.setColor(color.r * brightness, color.g * brightness, color.b * brightness);
		}, 2)
	},
	setBrightness: function (b) {
		brightness = b;
		LCD.setColor(color.r * brightness, color.g * brightness, color.b * brightness);
	}
};

var i2cLCD;
var LCD;

var color = {r: 255, b: 255, g:255};
var toColor = {r: 255, b: 255, g:255};
var brightness = 1;
var intervalBrightness, intervalColor;

var LCDqueue = [];
var LCDqueueRunner = setInterval(function () {
    var command = LCDqueue.shift();
    if (command != undefined) {
        if (command.p1 != undefined && command.p2 != undefined) {
            (LCD[command.func])(command.p1, command.p2);
        } else if (command.p1 != undefined) {
            (LCD[command.func])(command.p1);
        } else {
            (LCD[command.func])();
        }
    }
}, 25);

function init () {
	i2cLCD = require('jsupm_i2clcd');
	LCD = new i2cLCD.Jhd1313m1 (6, 0x3E, 0x62);

	LCD.scroll(false);
	LCD.home();
	LCD.clear();
	LCD.home();
	LCD.write("Starting...");
	LCD.home();
}

init();
