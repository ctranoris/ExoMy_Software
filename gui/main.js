
// Runtime variables to manage the gamepad
var moveXY = [0,0,0,0];
var moveYP = [0,0,0,0];
var moveArms = [0,50,0,50];
var moveHead = [50,50];
var gamepadTimer;
var gamePadActive = 0;
var jsJoystick;




/*
 * Gamepad Functions go here!
 */
// Turn on controller support
function controllerOn() {
	if (gamePadActive == 0) {
		$('#cont-area').removeClass('d-none');
		resetInfo();
		joypad.set({ axisMovementThreshold: 0.2 });
		joypad.on('connect', e => updateInfo(e));
		joypad.on('disconnect', e => resetInfo(e));
		joypad.on('axis_move', e => {
			console.log(e.detail);
			return moveAxis(e);
		});
		joypad.on('button_press', e => {
			console.log(e.detail);
			return pressButton(e);
		});	
		moveXY[0] = 0;
		moveXY[2] = 0;
		gamePadActive = 1;
	}
}


// When controller is disconnected
function resetInfo(e) {
	if (gamePadActive == 1) {
		$('#cont-area').attr('data-original-title','Disconnected');
		$('#cont-area').addClass('bg-danger');
		$('#cont-area').removeClass('bg-success');
		//$('#joystick').removeClass('d-none');
		clearInterval(gamepadTimer);
		moveXY[0] = 0;
		moveXY[2] = 0;
		sendMovementValues();
		gamePadActive = 0;
	}
}

// When a new controller is connected
function updateInfo(e) {
	const { gamepad } = e;
	$('#cont-area').attr('data-original-title','Connected');
	$('#cont-area').removeClass('bg-danger');
	$('#cont-area').addClass('bg-success');
	//$('#joystick').addClass('d-none');
	gamepadTimer = setInterval(sendMovementValues, 100); 
}

// When a controller button is pressed
function pressButton(e) {
	const { buttonName } = e.detail;
	
	// A or Cross button - Sad eye expression
	if (buttonName === 'button_0') {
		servoPresets(document.getElementById('eyes-sad'),'eyes-sad','i');
	
	// B or Circle button - Right head tilt
	} else if (buttonName === 'button_1') {
		servoPresets(document.getElementById('eyes-right'),'eyes-right','l');
	
	// X or Square button - Left head tilt
	} else if (buttonName === 'button_2') {
		servoPresets(document.getElementById('eyes-left'),'eyes-left','j');
	
	// Y or Triangle button - Neutral eye expression
	} else if (buttonName === 'button_3') {
		servoPresets(document.getElementById('eyes-neutral'),'eyes-neutral','k');
	
	// Left Trigger button - Lower left arm
	} else if (buttonName === 'button_6') {
		moveArms[0] = -1;
	
	// Left Bumper button - Raise left arm
	} else if (buttonName === 'button_4') {
		moveArms[0] = 1;
		
	// Right Trigger button - Lower right arm
	} else if (buttonName === 'button_7') {
		moveArms[2] = -1;
		
	// Right Bumper button - Raise right arm
	} else if (buttonName === 'button_5') {
		moveArms[2] = 1;
	
	// Press down on left stick - Move arms back to neutral position
	} else if (buttonName === 'button_10') {
		moveArms[0] = 0;
		moveArms[1] = 50;
		moveArms[2] = 0;
		moveArms[3] = 50;
		servoPresets(document.getElementById('arms-neutral'),'arms-neutral','n');
	
	// Press down on right stick - Move head back to neutral position
	} else if (buttonName === 'button_11') {
		moveHead[0] = 50;
		servoControl(document.getElementById('head-rotation'),'G',50);
		moveHead[1] = 125;
		servoPresets(document.getElementById('head-neutral'),'head-neutral','g');
		
	// Back or Share button - Turn on/off automatic servo mode
	} else if (buttonName === 'button_8') {
		if ($('#auto-anime').parent().hasClass('active')) {
			$('#auto-anime').parent().removeClass('active');
			$('#manu-anime').parent().addClass('active');
			sendSettings('animeMode',0);
			servoInputs(1);
		} else if ($('#manu-anime').parent().hasClass('active')) {
			$('#auto-anime').parent().addClass('active');
			$('#manu-anime').parent().removeClass('active');
			sendSettings('animeMode',1);
			servoInputs(0);
		}
	
	// Left d-pad button - Play random sound
	} else if (buttonName === 'button_14') {
		var fileNames = [];
		var fileLengths = [];
		$("#audio-accordion div div a").each(function() { 
			fileNames.push($(this).attr('file-name'));
			fileLengths.push($(this).attr('file-length'));
		});
		var randomNumber = Math.floor((Math.random() * fileNames.length));
		playAudio(fileNames[randomNumber],fileLengths[randomNumber]);
		
	// Right d-pad button - Play random servo animation
	} else if (buttonName === 'button_15') {
		var fileNames = [];
		var fileLengths = [];
		$("#anime-accordion div div a").each(function() { 
			fileNames.push($(this).attr('file-name'));
			fileLengths.push($(this).attr('file-length'));
		});
		var randomNumber = Math.floor((Math.random() * fileNames.length));
		anime(fileNames[randomNumber],fileLengths[randomNumber]);
		console.log(randomNumber);
	}
}

// When a controller axis movement is detected
function moveAxis(e) {
	const { axis, axisMovementValue } = e.detail;
	
	if (axis === 0) {
		moveXY[0] = axisMovementValue;
	} else if (axis === 1) {
		moveXY[2] = axisMovementValue;
	} else if (axis === 2) {
		moveYP[0] = axisMovementValue;
	} else if (axis === 3) {
		moveYP[2] = axisMovementValue;
	} 
}

// Send the movement values at fixed intervals
function sendMovementValues() {
	
	// X or Y motor movement
	if (moveXY[0] != moveXY[1] || moveXY[2] != moveXY[3]) {
		
		// X-axis (left/right turning)
		if (moveXY[0] != moveXY[1]) moveXY[1] = moveXY[0];
		else moveXY[0] = 0;
		
		// Y-axis (forward/reverse movement)
		if (moveXY[2] != moveXY[3]) moveXY[3] = moveXY[2];
		else moveXY[2] = 0;
		
		$('#joytext').html('x: ' + Math.round(moveXY[1]*100) + ', y: ' + Math.round(moveXY[3]*-100));
		
		// Send data to python app, so that it can be passed on
		$.ajax({
			url: "/motor",
			type: "POST",
			data: {"stickX": moveXY[1], "stickY": -moveXY[3]},
			dataType: "json",
			success: function(data){
				if(data.status == "Error"){
					showAlert(1, 'Error!', data.msg, 0);
				} else {
					// Do nothing
				}
			},
			error: function(error) {
				showAlert(1, 'Unknown Error!', 'Could not send movement command.', 0);
			}
		});
	} else {
		moveXY[0] = 0;
		moveXY[2] = 0;
	}
	
	// Yaw Axis (head rotation left/right)
	if (moveYP[0] != moveYP[1]) {
		moveYP[1] = moveYP[0];
	} else moveYP[0] = 0;
	if (moveYP[1] != 0) {
		moveHead[0] += moveYP[1] * headMultiplier;
		if (moveHead[0] > 100) moveHead[0] = 100;
		else if (moveHead[0] < 0) moveHead[0] = 0;
		servoControl(document.getElementById('head-rotation'), 'G', Math.round(moveHead[0]));
	}
	
	
	// Pitch Axis (head tilt up/down)
	if (moveYP[2] != moveYP[3]) {
		moveYP[3] = moveYP[2];
	} else moveYP[2] = 0;
	if (moveYP[3] != 0) {
		moveHead[1] += moveYP[3] * headMultiplier;
		if (moveHead[1] > 200) moveHead[1] = 200;
		else if (moveHead[1] < 0) moveHead[1] = 0;
		if (moveHead[1] < 100) {
			servoControl(document.getElementById('neck-top'), 'T', Math.round(moveHead[1]));
			servoControl(document.getElementById('neck-bottom'), 'B', 0);
		} else if (moveHead[1] < 160) {
			servoControl(document.getElementById('neck-top'), 'T', Math.round(200 - moveHead[1]));
			servoControl(document.getElementById('neck-bottom'), 'B', Math.round(moveHead[1] - 100));
		} else {
			servoControl(document.getElementById('neck-top'), 'T', Math.round(moveHead[1]) - 110);
			servoControl(document.getElementById('neck-bottom'), 'B', 60);
		}
	}

	// Left Arm
	if (moveArms[0] != 0) {
		moveArms[1] += moveArms[0] * armsMultiplier;
		if (moveArms[1] > 100) moveArms[1] = 100;
		else if (moveArms[1] < 0) moveArms[1] = 0;
		servoControl(document.getElementById('arm-left'), 'L', Math.round(moveArms[1]));
		if ((moveArms[0] == -1) && (typeof joypad.buttonEvents.joypad[0].button_6 == 'undefined' || !joypad.buttonEvents.joypad[0].button_6.hold)) moveArms[0] = 0;
		else if ((moveArms[0] == 1) && (typeof joypad.buttonEvents.joypad[0].button_4 == 'undefined' || !joypad.buttonEvents.joypad[0].button_4.hold)) moveArms[0] = 0;
	}
	
	// Right Arm
	if (moveArms[2] != 0) {
		moveArms[3] += moveArms[2] * armsMultiplier;
		if (moveArms[3] > 100) moveArms[3] = 100;
		else if (moveArms[3] < 0) moveArms[3] = 0;
		servoControl(document.getElementById('arm-right'), 'R', Math.round(moveArms[3]));
		if ((moveArms[2] == -1) && (typeof joypad.buttonEvents.joypad[0].button_7 == 'undefined' || !joypad.buttonEvents.joypad[0].button_7.hold)) moveArms[2] = 0;
		else if ((moveArms[2] == 1) && (typeof joypad.buttonEvents.joypad[0].button_5 == 'undefined' || !joypad.buttonEvents.joypad[0].button_5.hold)) moveArms[2] = 0;
	}
}



/*
 * This function is run once when the page is loading
 */
window.onload = function () { 
	var h = window.innerHeight - 100;

}




/*
 * This function is run once when the page has finished loading
 */
$(document).ready(function () {

	
	controllerOn();
	if (joypad.instances[0] != null && joypad.instances[0].connected) updateInfo(joypad.instances[0]);
	
	
});
