// -----------------------
// Define global variables
// -----------------------
let options = {};
var startingTime = 0;
var game_over = false;
var light_square = false;
var numberCorrect = 0;
var numberQuestions = 20;
var rowLimit = 8;
var columnLimit = 8;

// Required modules
import configuration from '../app/config.js';
import * as dataTools from '../util/datatools-module.js';

// TODO: Clean up the JS

// Game-related functions
function gameOver() {
	game_over = true;
	manageElements(['#gameFail', '#startButton', '#squarecolor'], 'display', 'block');
	manageElements(['#squareTitle'], 'display', 'none');
	$('#btn_start').val('Restart');
	updateProgressBar(numberCorrect, numberQuestions);
}

function winner() {
	game_over = true;
	manageElements(['#startButton', '#gameSuccess', '#squarecolor'], 'display', 'block');
	manageElements(['#squareTitle'], 'display', 'none');
	$('#btn_start').val('Restart');
	updateProgressBar(numberCorrect, numberQuestions);

	let st = new Date();
	let time = st.getTime() - startingTime;
	time = Math.round(time / 10) / 100;
	setfinaltime('Final Time: ' + time);
}

function startGame() {
	game_over = false;
	manageElements(['#squarecolor', '#statusDetails', '#squareTitle'], 'display', 'block');
	manageElements(['#gameFail', '#gameSuccess', '#startButton'], 'display', 'none');

	numberCorrect = 0;
	updateProgressBar(numberCorrect, numberQuestions);

	generateTestSquare();

	startingTime = new Date().getTime();
}



function generateTestSquare() {
	// Generate a random row and column (within limits)
	var row = randomInteger(1, rowLimit);
	var col = randomInteger(1, columnLimit);

	// If BOTH row & column are even or if BOTH are odd then the square is dark, otherwise it is light
	light_square = true;

	if ((row % 2 === 0 && col % 2 === 0) || (row % 2 !== 0 && col % 2 !== 0)) {
		light_square = false;
	}

	// Show the value on the screen
	let chosenSquare = String.fromCharCode(col + 96) + row;
	setsquare(chosenSquare);
}

function nextQuestion() {
	numberCorrect += 1;
	if (numberCorrect === numberQuestions) {
		winner();
		return;
	}

	updateProgressBar(numberCorrect, numberQuestions);
	generateTestSquare();
}

function setfinaltime(text) {
	$('#finaltime').html(text);
}

function setsquare(text) {
	$('#squareTitle').html(text);
}





// ---------------------------------------------------------------------------------


/**
 * Helper function to compare the status of the called function against the value of the light_square status
 * If a match either way, proceed to the next question
 * Otherwise, the game is over
 * 
 * @param {Boolean} square 	Send true if testing against Light squares and false if testing against Dark squares
 * @returns 
 */
function checkSquare(square) {
	if (square === light_square || !square === !light_square) {
		nextQuestion();
		return;
	}

	gameOver();
}

/**
 * Function to set the same CSS attribute to an array of elements
 * 
 * @param {*} elementArray 	The array of the element names
 * @param {*} attribute 	The attribute to modify
 * @param {*} value 		The value to use for the CSS
 */
function manageElements(elementArray, attribute, value) {
	elementArray.forEach((element) => {
		$(element).css(attribute, value);
	});
}

/**
 * Updates the progress bar on the screen
 *
 * @param {int} partial_value  The number of completed puzzles (numerator)
 * @param {int} total_value    The total number of puzzles (denominator)
 */
function updateProgressBar(partial_value, total_value) {
	// Do the math
	const progress = Math.round((partial_value / total_value) * 100);

	// Show the result
	let progresspercent = progress + '%';
	$('#progressbar').width(progresspercent);
	$('#progressbar').text(progresspercent);
}

/**
 * Generate a random integer within a range (inclusive of the start and end)
 * 
 * @param {*} min 	The lower end of the range
 * @param {*} max 	The upper end of the range
 * @returns 	The randomly generated number
 */
function randomInteger(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Saves the current settings to local storage
 */
function saveSettings() {
	dataTools.saveItem('numQuestions', options.numQuestions);
	dataTools.saveItem('light', options.lightColor);
	dataTools.saveItem('dark', options.darkColor);
	//console.log('saved', options)
}

/**
 * Read saved settings from local storage
 */
function loadSettings() {
	// Set number of questions
	options.numQuestions = parseInt(dataTools.readItem('numQuestions'));
	numberQuestions = options.numQuestions;
	$('#gameValue').text(options.numQuestions);
	$('#numQuestions').val(numberQuestions);

	// Set color options
	options.lightColor = dataTools.readItem('light');
	$('#btn_light').css('background-color', options.lightColor);
	$('#txt_lightSquare').val(options.lightColor);

	options.darkColor = dataTools.readItem('dark');
	$('#btn_dark').css('background-color', options.darkColor);
	$('#txt_darkSquare').val(options.darkColor);

	//console.log('loaded', options)
}

/**
 * Program Initialization. Load config settings and other related tasks
 */
function initializeApp() {
	// Name the app
	$('title').text(`${configuration.app.name}`);
	$('#title_topbar').text(`${configuration.app.name}`);

	// Version number of the app
	$('#versionNumber').text('version: ' + `${configuration.app.version}`);
	$('#versionNumber').addClass('h6');

	// Load up initial options from config
	options.numQuestions = configuration.defaults.numQuestions;
	options.lightColor = configuration.defaults.lightColor;
	options.darkColor = configuration.defaults.darkColor;

	// Save defaults to local storage if not already present
	if (dataTools.readItem('numQuestions') === null) {
		dataTools.saveItem('numQuestions', options.numQuestions);
	}

	if (dataTools.readItem('light') === null) {
		dataTools.saveItem('light', options.lightColor);
	}

	if (dataTools.readItem('dark') === null) {
		dataTools.saveItem('dark', options.darkColor);
	}

	// Set the UI values and focus
	loadSettings();
	$('#btn_start').focus();
}

/**
 * Update the options based on the current settings of all the text inputs
 */
function setOptionsBasedOnTextInputs() {
	options.lightColor = $('#txt_lightSquare').val();
	options.darkColor = $('#txt_darkSquare').val();

	$('#btn_light').css('background-color', options.lightColor);
	$('#btn_dark').css('background-color', options.darkColor);
}

/**
 * Update the API query options based on the current settings of all the slider values
 */
function setOptionsBasedOnSliderSettings() {
	options.numQuestions = $('#numQuestions').val();
	$('#gameValue').text(options.numQuestions);
	numberQuestions = options.numQuestions;
}

function resetSettings() {
	options.numQuestions = configuration.defaults.numQuestions;
	options.lightColor = configuration.defaults.lightColor;
	options.darkColor = configuration.defaults.darkColor;

	saveSettings();
	loadSettings();

	location.reload();
}

/**
 * Assign all the required event listeners to the required controls
 */
function initializeControls() {
	// Assign action to buttons
	$('#btn_start').on('click', function () {
		startGame();
	});

	$('#btn_light').on('click', function () {
		checkSquare(true);
	});

	$('#btn_dark').on('click', function () {
		checkSquare(false);
	});

	$('#btn_reset').on('click', function () {
		resetSettings();
	});

	// Assign actions on change to options

	// Update the options based on the radio settings
	$('input[type="text"]').on('input', function () {
		setOptionsBasedOnTextInputs();
		saveSettings();
	});

	// Update the options based on the sliders
	$('input[type="range"]').on('change', function () {
		setOptionsBasedOnSliderSettings();
		saveSettings();
	});

	// Set up the color pickers
	$(document).ready(function () {
		$('.colorpicker').each(function () {
			$(this).minicolors({
				control: 'wheel',
				format: 'hex',
				letterCase: 'lowercase',
				theme: 'bootstrap',
			});
		});
	});
}

/**
 * Start initialization once page is ready
 */
$(document).ready(function () {
	initializeApp();
	initializeControls();
});
