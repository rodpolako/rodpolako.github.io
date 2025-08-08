// -----------------------
// Define global variables
// -----------------------
let options = {};
let startingTime = 0;
let light_square = false;
let numberCorrect = 0;
let numberQuestions = 0;

// Required modules
import configuration from '../app/config.js';
import * as dataTools from '../util/datatools-module.js';

// TODO: Clean up the JS

// Game-related functions

/**
 * Generate a square to test and show it to the user
 */
function generateTestSquare() {
	// Generate a random row and column (within limits)
	let row = randomInteger(1, options.rowLimit);
	let col = randomInteger(1, options.columnLimit);

	// If BOTH row & column are even or if BOTH are odd then the square is dark, otherwise it is light
	light_square = true;

	if ((row % 2 === 0 && col % 2 === 0) || (row % 2 !== 0 && col % 2 !== 0)) {
		light_square = false;
	}

	// Show the value on the screen
	let chosenSquare = String.fromCharCode(col + 96) + row;
	$('#squareName').html(chosenSquare);
}

/**
 * Start a new game
 */
function startGame() {
	// Visual elements to hide/show at start of game
	manageElements(['#squarecolor', '#statusDetails', '#squareName'], 'display', 'block');
	manageElements(['#gameFail', '#gameSuccess', '#startButton'], 'display', 'none');

	// Set initial values and update progress bar
	numberCorrect = 0;
	updateProgressBar(numberCorrect, numberQuestions);

	// Note the starting time in order to compute the elapsed time later
	startingTime = new Date().getTime();

	// Pick a test square
	generateTestSquare();
}

/**
 * End the game and show either the success or fail message
 *
 * @param {boolean} winner 	Set to true to show success.  Set to false to show fail.
 * @returns
 */
function gameEnd(winner) {
	// Update the progress bar
	updateProgressBar(numberCorrect, numberQuestions);

	// Compute the elapsed time and display it
	let finishTime = new Date();
	let elapsedTime = finishTime.getTime() - startingTime;
	elapsedTime = Math.round(elapsedTime / 10) / 100;
	$('#elapsedTime').html('Elapsed Time: ' + elapsedTime);

	// Rename the start button to Restart in order to quickly go again
	$('#btn_start').val('Restart');

	// Shared visual elements hide/show regardless of win/loss
	manageElements(['#squareName'], 'display', 'none');
	manageElements(['#startButton', '#squarecolor'], 'display', 'block');

	// If winner, show the Success message then exit
	if (winner) {
		manageElements(['#gameSuccess'], 'display', 'block');
		return;
	}

	// Show the Fail message
	manageElements(['#gameFail'], 'display', 'block');
}

/**
 * Helper function to compare the user choice against the value of the light_square status
 * If a match either way, update counts and progress bar and then proceed to the next question
 * Otherwise, the game is over
 *
 * @param {Boolean} square 	Set to true if user choses light square and false if user selects dark square
 * @returns
 */
function checkSquare(square) {
	// Exit early if the test is not yet started
	if ($('#squareName').html() === '') {
		return;
	}

	// If answer is correct, increment, update progress and ask next question
	if (square === light_square || !square === !light_square) {
		numberCorrect += 1;
		updateProgressBar(numberCorrect, numberQuestions);

		nextQuestion();
		return;
	}

	// Wrong answer, show fail
	gameEnd(false);
}

/**
 * Check if the game is over (ie: number of right answers = total number of questions)
 *
 * @returns
 */
function nextQuestion() {
	// Exit early if game is over
	if (numberCorrect === numberQuestions) {
		gameEnd(true);
		return;
	}

	// Ask the next question by chosing a new square
	generateTestSquare();
}

/**
 * Function to set the same CSS attribute to an array of elements
 *
 * @param {Array} elementArray 	The array of the element names
 * @param {string} attribute 	The attribute to modify
 * @param {string} value 		The value to use for the CSS
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
 * @param {int} min 	The lower end of the range
 * @param {int} max 	The upper end of the range
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
	dataTools.saveItem('rowLimit', options.rowLimit);
	dataTools.saveItem('columnLimit', options.columnLimit);

	//console.log('saved', options)
}

/**
 * Read saved settings from local storage
 */
function loadSettings() {
	// Set number of questions
	options.numQuestions = parseInt(dataTools.readItem('numQuestions'));
	numberQuestions = parseInt(options.numQuestions);
	$('#gameValue').text(options.numQuestions);
	$('#numQuestions').val(numberQuestions);

	// Set the row & column limits (to help make the grid smaller for easier learning)
	options.rowLimit = parseInt(dataTools.readItem('rowLimit'));
	$('#numRowsValue').text(options.rowLimit);
	$('#numRows').val(options.rowLimit);

	options.columnLimit = parseInt(dataTools.readItem('columnLimit'));
	$('#numColumnsValue').text(options.columnLimit);
	$('#numColumns').val(options.columnLimit);

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
	loadConfigSettings();

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

	if (dataTools.readItem('rowLimit') === null) {
		dataTools.saveItem('rowLimit', options.rowLimit);
	}

	if (dataTools.readItem('columnLimit') === null) {
		dataTools.saveItem('columnLimit', options.columnLimit);
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
	options.numQuestions = parseInt($('#numQuestions').val());
	$('#gameValue').text(options.numQuestions);
	numberQuestions = options.numQuestions;

	options.rowLimit = parseInt($('#numRows').val());
	$('#numRowsValue').text(options.rowLimit);

	options.columnLimit = parseInt($('#numColumns').val());
	$('#numColumnsValue').text(options.columnLimit);
}

/**
 * Load settings from config file
 */
function loadConfigSettings() {
	options.numQuestions = configuration.defaults.numQuestions;
	options.lightColor = configuration.defaults.lightColor;
	options.darkColor = configuration.defaults.darkColor;
	options.rowLimit = configuration.defaults.rowLimit;
	options.columnLimit = configuration.defaults.columnLimit;
}

/**
 * Reset all settings back to config defaults
 */
function resetSettings() {
	loadConfigSettings();
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
