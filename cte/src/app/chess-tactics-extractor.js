/*
 * Chess-Tactics-Extractor
 */

/* eslint linebreak-style: ["error", "unix"] */
/* eslint indent: ["error", "tab", { "SwitchCase": 1 }] */
/* eslint semi-style: ["error", "last"] */
/* eslint semi: ["error"] */

/* eslint no-undef: "error"*/
/* global $, document, window, console,  */
/* global */

/* eslint no-unused-vars: "error"*/
/* exported */

// -----------------------
// Define global variables
// -----------------------
let options = {};

// Required modules
import configuration from './config.js';
import { getLichessGames } from '../components/lichess/lichessgames.js';
import { loadPGNFile } from '../components/pgn-handling/pgn-handling-module.js';
import { extractLines } from '../components/extracttactics/extracttactics.js';
import { parse } from '../lib/pgn-parser/pgn-parser-1.4.18-esm-min.js';

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
	options.userID = '';
	options.lichessToken = '';
	options.maxGames = configuration.defaults.maxGames;
	options.sensitivity = configuration.defaults.sensitivity;
	options.color = configuration.defaults.color;
	options.opponent = configuration.defaults.opponent;
	options.rated = configuration.defaults.rated;
	options.gameSpeed = configuration.defaults.gameSpeed;
	options.since = configuration.defaults.since;
	options.until = configuration.defaults.until;
	options.bothplayers = configuration.defaults.bothplayers;
	options.eco = configuration.defaults.eco;
	options.minimumDepth = configuration.defaults.minimumDepth;
	options.maxiumDepth = configuration.defaults.maxiumDepth;

	// Set some UI values and focus
	$('#gameValue').text(options.maxGames);
	$('#minPlyValue').text(options.minimumDepth);
	$('#minPly').val(options.minimumDepth);
	$('#maxPlyValue').text('No Limit');
	$('#maxPly').val(options.maxiumDepth);
	$('#txt_userID').focus();
}

/**
 * Simple method to automatically start a download of a text file
 *
 * @param {*} filename Filename to assign to the file
 * @param {*} text Contents of the file
 */
function download(filename, text) {
	// Credit for this goes to:
	// https://stackoverflow.com/questions/65050679/javascript-a-simple-way-to-save-a-text-file
	var element = document.createElement('a');
	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
	element.setAttribute('download', filename);

	element.style.display = 'none';
	document.body.appendChild(element);

	element.click();

	document.body.removeChild(element);
}

function validateECO(ecoString) {
	// Exit if string is blank
	if (!ecoString) {
		return false;
	}

	// Confirm input is a string
	if (typeof ecoString !== 'string') {
		return false;
	}

	// Confirm length is 3
	if (ecoString.length != 3) {
		return false;
	}

	// Confirm first char is a letter between A-E
	if (!['A', 'B', 'C', 'D', 'E'].includes(ecoString.substring(0, 1).toUpperCase())) {
		return false;
	}

	// Confirm second and third char is a number between 0 and 9
	if (
		!['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(ecoString.slice(-2, -1)) ||
		!['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(ecoString.slice(-1))
	) {
		return false;
	}
}

function splitPGN(filedata) {
	let splitgames = [];
	filedata = filedata.trim();
	splitgames = filedata.split('\n\n\n');

	return splitgames;
}

async function applyFiltersLocally(pgnJSON) {
	let filteredArray = [];
	pgnJSON.forEach((game) => {
		// Exit this game early if this is not a standard game (maybe look to add fromPosition or other variants later...)
		if (game.tags.Variant !== 'Standard') {
			return;
		}

		// Don't process any games that don't match a provided ECO
		if (options.eco !== '' && validateECO) {
			if (game.tags.ECO !== options.eco) {
				return;
			}
		}

		// Exclude games of the non-selected color (if selected)  Emulates API filter
		if (options.color !== '') {
			if (options.color === 'white' && game.tags.White.toLowerCase() !== options.userID.toLowerCase()) {
				return;
			}

			if (options.color === 'black' && game.tags.Black.toLowerCase() !== options.userID.toLowerCase()) {
				return;
			}
		}

		// Exclude games where the opponent is not included (if selected)  Emulates API filter
		if (options.opponent !== '') {
			if (game.tags.White.toLowerCase() !== options.opponent.toLowerCase() && game.tags.Black.toLowerCase() !== options.opponent.toLowerCase()) {
				return;
			}
		}

		filteredArray.push(game);
	});

	return filteredArray;
}

async function extractTactics(games) {
	let tactics = [];
	games.forEach((game) => {
		let tacticsLine = extractLines(game.pgn, options);
		// Only add to the list if there are tactics found
		if (tacticsLine.length > 0) {
			tactics.push(tacticsLine);
		}
	});

	return tactics;
}

async function convertPGNToJSON(pgnArray) {
	let NDJSON = [];
	pgnArray.forEach((game) => {
		let gamedata = {};
		gamedata = parse(game, { startRule: 'game' });
		gamedata.pgn = game;
		NDJSON.push(gamedata);
	});
	return NDJSON;
}

async function loadLocalPGNFile() {
	// Get data - read the file
	let myObject = await fetch('test.pgn' + '?v=' + Date.now());
	let PGNData = await myObject.text();

	// Convert the PGN into array of PGN games. Assumes two blank lines between games in source PGN.
	let games = splitPGN(PGNData);

	// Create JSON object of the PGN with the PGN itself as an key/value pair
	games = await convertPGNToJSON(games);

	// Apply relevant filters for local PGN files (instead of lichess)
	games = await applyFiltersLocally(games);

	return games;
}

async function displayResults(tactics) {
	//console.log(tactics);

	let finalpuzzle = loadPGNFile(tactics.join('\n\n'));

	console.log('\nGames with tactics found: ' + tactics.length);
	console.log('Tactics puzzles generated: ' + finalpuzzle.length + '\n');

	if (finalpuzzle.length > 0) {
		download('tactics.pgn', tactics.join('\n\n'));
		console.log('tactics.pgn has been downloaded to your system');
	}
	$('#myConsole').scrollTop($('#myConsole').prop('scrollHeight'));

	removeSpinner();
}

async function applyFiltersToDownloadedData(pgnJSON) {
	let filteredArray = [];
	pgnJSON.forEach((game) => {
		// Exit this game early if this is not a standard game (maybe look to add fromPosition or other variants later...)
		if (game.variant !== 'standard') {
			return;
		}

		// Don't process any games that don't match a provided ECO
		if (options.eco !== '' && validateECO) {
			if (game.opening.eco !== options.eco) {
				return;
			}
		}
		filteredArray.push(game);
	});

	return filteredArray;
}

async function downloadLicessData() {
	// Calculate estimated time to download set based on published 20 games/sec rate
	let estimate = Math.round(parseInt(options.maxGames) / 20);
	let units = 'seconds';
	if (estimate === 1) {
		units = 'second';
	}
	console.log('Downloading games - please wait (estimated time: ' + estimate + ' ' + units + ')');

	// Get data
	let games = await getLichessGames(options);
	if (games === false) {
		return;
	}

	// Apply lichess-specific filters not available in the API (like ECO or variant)
	games = await applyFiltersToDownloadedData(games);

	// Return filtered list for tactic extraction
	return games;
}

/**
 * Main process. Download the games, extract the tactics, generate & download the file.
 */
async function processGames() {
	// Clear the console
	console.clear();
	addSpinner();

	// Get data
	//let games = await loadLocalPGNFile();
	let games = await downloadLicessData();

	// Find tactics
	let tactics = await extractTactics(games);

	// Display results and download file
	await displayResults(tactics);
}

/**
 * Covert a date in YYYYMMDD format to epoch in UTC format
 *
 * @param {*} dateString The text component of the date
 * @param {*} timeComponent The time component of the date
 * @returns Epoch time for the provided input
 */
function convertDateToEpoch(dateString, timeComponent) {
	const event = new Date(dateString + ' ' + timeComponent);

	var myDate = new Date(event.toUTCString());
	var myEpoch = myDate.getTime();
	return myEpoch;
}

/**
 * Update the API query options based on the current settings of all the radio buttons
 */
function setOptionsBasedOnRadioSettings() {
	// Color
	if ($('#rdo_color1').is(':checked')) {
		options.color = '';
	}
	if ($('#rdo_color2').is(':checked')) {
		options.color = 'white';
	}
	if ($('#rdo_color3').is(':checked')) {
		options.color = 'black';
	}

	// Rated
	if ($('#rdo_rated1').is(':checked')) {
		options.rated = '';
	}
	if ($('#rdo_rated2').is(':checked')) {
		options.rated = 'true';
	}
	if ($('#rdo_rated3').is(':checked')) {
		options.rated = 'false';
	}

	// Sensitivity
	if ($('#rdo_sensitivity1').is(':checked')) {
		options.sensitivity = 1;
	}
	if ($('#rdo_sensitivity2').is(':checked')) {
		options.sensitivity = 2;
	}
	if ($('#rdo_sensitivity3').is(':checked')) {
		options.sensitivity = 3;
	}
}

/**
 * Update the API query options based on the current settings of all the checkboxes
 */
function setOptionsBasedOnCheckboxSettings() {
	// Build the variantlist
	let variantList = [];

	configuration.collection.checkboxlist.forEach((checkbox) => {
		if ($(checkbox).is(':checked')) {
			variantList.push($(checkbox).val().toLowerCase());
		}
	});

	options.gameSpeed = variantList.join(',');

	setOptionsBasedOnSwitches();
}

/**
 * Update the API query options based on the current settings of all the text inputs
 */
function setOptionsBasedOnTextInputs() {
	options.userID = $('#txt_userID').val();
	options.opponent = $('#txt_opponent').val();
	options.eco = $('#txt_eco').val();
}

/**
 * Update the API query options based on the current settings of all the switch settings
 */
function setOptionsBasedOnSwitches() {
	options.bothplayers = false;
	if ($('#switchBothPlayers').is(':checked')) {
		options.bothplayers = true;
	}
}

/**
 * Update the API query options based on the current settings of all the slider values
 */
function setOptionsBasedOnSliderSettings() {
	options.maxGames = $('#num_games').val();
	$('#gameValue').text(options.maxGames);

	options.minimumDepth = parseInt($('#minPly').val());
	$('#minPlyValue').text(options.minimumDepth);

	options.maxiumDepth = parseInt($('#maxPly').val());
	$('#maxPlyValue').text(options.maxiumDepth);
	if (options.maxiumDepth === 49) {
		$('#maxPlyValue').text('No limit');
	}
}

/**
 * Adds a spinner to the on-screen console
 */
function addSpinner() {
	var spinner = $('<div>').attr('id', 'spinner');
	$('#myConsole').append(spinner);
	$('#spinner').addClass('spinner-border');
	$('#spinner').addClass('spinner-border-sm');
	$('#spinner').addClass('text-light');
}

/**
 * Removes the spinner
 */
function removeSpinner() {
	$('#spinner').remove();
}

/**
 * Create an on-screen "console" so that output can be displayed there
 *
 * @param {*} container The name of the element that will house the console div
 * @returns
 */
function initializeConsoleDisplay(container) {
	if (container === '') {
		return;
	}
	// Create console container
	var consoleDiv = $('<div>').attr('id', 'myConsole').css({
		position: 'relative',
		top: '0',
		left: '0',
		width: '100%',
		height: '300px',
		'background-color': '#333',
		color: '#fff',
		overflow: 'auto',
		padding: '10px',
		'box-sizing': 'border-box',
		'font-family': 'monospace',
		'z-index': '1000',
	});

	// Create pre element for console output
	var consoleOutput = $('<pre>').attr('id', 'consoleOutput').css({
		margin: '0',
		'white-space': 'pre-wrap',
	});

	// Append pre to div and div to body
	consoleDiv.append(consoleOutput);
	$(container).append(consoleDiv);

	// Override console.log
	var originalConsoleLog = console.log;
	console.log = function (message) {
		$(window).scrollTop($('#myConsole').offset().top);
		originalConsoleLog.apply(console, arguments);
		$('#consoleOutput').append(message + '\n');
		$('#myConsole').scrollTop($('#myConsole').prop('scrollHeight'));
	};

	// Create override for console.clear
	var originalConsoleClear = console.clear;
	console.clear = function () {
		originalConsoleClear.apply(console);
		$('#consoleOutput').text('');
	};
}

/**
 * Assign all the required event listeners to the required controls
 */
function initializeControls() {
	// Assign action to buttons
	$('#btn_submit').on('click', function () {
		if (options.userID === '') {
			console.clear();
			console.log('Lichess user ID required');
			return;
		}
		processGames();
	});

	// Assign actions on change to options

	// Update the options based on the radio settings
	$('input[type="text"]').on('input', function () {
		setOptionsBasedOnTextInputs();
	});

	// Update the options based on the radio settings
	$('input[type="radio"]').on('change', function () {
		// Your code to execute when any radio button is clicked
		setOptionsBasedOnRadioSettings();
	});

	// Update the options based on the checkboxes
	$('input[type="checkbox"]').on('change', function () {
		setOptionsBasedOnCheckboxSettings();
	});

	// Update the options based on the sliders
	$('input[type="range"]').on('change', function () {
		setOptionsBasedOnSliderSettings();
	});

	// Set the start date range
	$('#startDate').on('change', function (e) {
		options.since = convertDateToEpoch(e.target.value, '00:00:00');
	});

	// Set the end date range
	$('#endDate').on('change', function (e) {
		options.until = convertDateToEpoch(e.target.value, '23:59:59');
	});

	// Set Enter key to submit
	$(document).on('keydown', function (event) {
		if (event.which === 13) {
			event.preventDefault(); // Prevent form submission if input is in a form
			$('#btn_submit').click(); // Trigger button click
		}
	});
}

/**
 * Start initialization once page is ready
 */
$(document).ready(function () {
	initializeApp();
	initializeConsoleDisplay('#consoleDisplay');
	initializeControls();
});
