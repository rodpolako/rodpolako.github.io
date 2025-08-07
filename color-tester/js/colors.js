// -----------------------
// Define global variables
// -----------------------
let options = {};

var time = 0;
var start_time = 0;
var game_over = false;
var light = 0;
var num_right = 0;
var num_questions = 20;

// Required modules
import configuration from '../app/config.js';
import * as dataTools from '../util/datatools-module.js';

function game_over_reset() {
	document.getElementById('gameover').style.display = 'block';
	document.getElementById('squarecolor').style.display = 'none';
	setstatus('0/' + num_questions.toString());
	game_over = true;
}

function start_game() {
	document.getElementById('gameover').style.display = 'none';
	document.getElementById('gamesuccess').style.display = 'none';
	document.getElementById('startbutton').style.display = 'none';
	document.getElementById('squarecolor').style.display = 'block';
	game_over = false;
	num_right = 0;
	setTimeout(inc_time, 100);
	setstatus('0/' + num_questions.toString());

	gen_square();

	let st = new Date();
	start_time = st.getTime();
}

function inc_time() {
	let st = new Date();
	time = st.getTime() - start_time;

	time /= 1000;
	time = time.toFixed(1);

	settimer('Time: ' + time);

	if (!game_over) setTimeout(inc_time, 100);
}

function gen_square() {
	var col = Math.floor(Math.random() * 8);
	var row = Math.floor(Math.random() * 8) + 1;

	var spot = (row - 1) * 8 + col;

	if ((row - 1) % 2 == 0) light = spot % 2;
	else light = 1 - (spot % 2);

	col = String.fromCharCode(col + 97);

	setsquare(col + row);
}

function click_light() {
	if (light == 1) next_square();
	else game_over_reset();
}

function click_dark() {
	if (light == 0) next_square();
	else game_over_reset();
}

function next_square() {
	num_right++;
	if (num_right == num_questions) {
		winner();
		return;
	}
	setstatus(num_right + '/' + num_questions.toString());
	gen_square();
}

function winner() {
	game_over = 1;
	document.getElementById('squarecolor').style.display = 'none';
	document.getElementById('gamesuccess').style.display = 'block';
	let st = new Date();
	let time = st.getTime() - start_time;
	time = Math.round(time / 10) / 100;
	setfinaltime('Final Time: ' + time);
	document.getElementById('ft').value = time;
	document.getElementById('fc').value = gc(time);
}

function setfinaltime(text) {
	$('#finaltime').html(text);
}

function settimer(text) {
	$('#statustimer').html(text);
}

function setstatus(text) {
	$('#status').html(text);
}

function setsquare(text) {
	text = 'Square: ' + text;
	$('#squareid').html(text);
}

function gc(t) {
	return calc(t);
}

/**
 * Saves the current settings to local storage
 */
function saveSettings() {
	dataTools.saveItem('numQuestions', options.numQuestions);
	dataTools.saveItem('light', options.lightColor);
	dataTools.saveItem('dark', options.darkColor);
	console.log('saved', options)
}

/**
 * Read saved settings from local storage
 */
function loadSettings() {
	// Set number of questions
	options.numQuestions = parseInt(dataTools.readItem('numQuestions'));
	$('#gameValue').text(options.numQuestions);
	num_questions = options.numQuestions;
	$('#numQuestions').val(num_questions);

	// Set color options
	options.lightColor = dataTools.readItem('light');
	$('#btn_light').css('background-color', options.lightColor);
	$('#txt_lightSquare').val(options.lightColor);

	options.darkColor = dataTools.readItem('dark');
	$('#btn_dark').css('background-color', options.darkColor);
	$('#txt_darkSquare').val(options.darkColor);

	console.log('loaded', options)
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

	console.log(options);

	// Set some UI values and focus
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
	num_questions = options.numQuestions;
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
		start_game();
	});

	$('#btn_restart').on('click', function () {
		start_game();
	});

	$('#btn_light').on('click', function () {
		click_light();
	});

	$('#btn_dark').on('click', function () {
		click_dark();
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
