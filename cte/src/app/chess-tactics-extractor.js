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
import { getGames } from '../components/lichess/downloadgames.js';
import { loadPGNFile } from '../components/pgn-handling/pgn-handling-module.js';
import { Chess } from '../lib/chess/chess1.20.0-esm-customised.js';

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

	// Set some UI values and focus
	$('#gameValue').text(options.maxGames);
	$('#txt_userID').focus();
}

/**
 * Downloads the games from Lichess
 * 
 * @returns Array of JSON objects representing the results of the API call
 */
async function downloadLichessGames() {
	return await getGames(options);
}

/**
 * 
 * @param {string} PGNFile PGN text file to process
 * @param {object} options Options related to this function
 * @returns PGN file with the individual tactics as separate games
 */
function extractLines(PGNFile, options) {
	let errorSensitivity = options.sensitivity;
	let headers = [
		'Event',
		'Site',
		'Date',
		'White',
		'Black',
		'Result',
		'GameId',
		'UTCDate',
		'UTCTime',
		'WhiteElo',
		'BlackElo',
		'BlackTitle',
		'Variant',
		'TimeControl',
		'ECO',
		'Opening',
		'Termination',
		'Annotator',
	];
	let puzzleCollection = [];
	// NAG[0] '$2' for "Mistake"
	// NAG[0] '$4' for "Blunder"
	// NAG[0] '$6' for "Inaccuracy"
	let errorLevels = ['$2', '$4', '$6'];

	if (errorSensitivity < 1 || errorSensitivity > 3 || !Number.isInteger(errorSensitivity)) {
		errorSensitivity = 2;
	}

	if (errorSensitivity === 1) {
		errorLevels = ['$4'];
	}

	if (errorSensitivity === 2) {
		errorLevels = ['$2', '$4'];
	}

	let jsonGame = loadPGNFile(PGNFile);
	//console.log(jsonGame);

	jsonGame.forEach((game) => {
		//console.log(game)
		console.log(
			'Processing ' + game.tags.GameId + ': ' + game.tags.White + ' vs. ' + game.tags.Black + ' (' + game.tags.Event + ') - ' + game.tags.UTCDate.value
		);

		// Load the moves of the PGN into memory
		let chessgame = new Chess();
		game.moves.forEach((move) => {
			// Check to make sure the move to make is not a null move
			if (move.notation.notation !== 'Z0') {
				chessgame.move(move.notation.notation);
			}

			if (move.nag !== null) {
				// Notation found!

				// Found a mistake, blunder or inaccuracy
				if (errorLevels.includes(move.nag[0])) {
					// Exit this whole thing early if both players was not selected and the current player doesn't match
					if (!options.bothplayers) {
						// Find out if the user ID is White or black
						let playerTurn = 'w';

						if (game.tags.Black === options.userID) {
							playerTurn = 'b';
						}

						if (playerTurn !== move.turn) {
							return;
						}
					}

					// undo the last move in the game in order to get the current fen
					chessgame.undo();

					// Create a new Chess Game here and set it up with this fen.
					let tempChessGame = new Chess(chessgame.fen());

					// Add the headers
					headers.forEach((header) => {
						if (game.tags?.header !== '') {
							if (header === 'Date' || header === 'UTCDate' || header === 'UTCTime') {
								tempChessGame.setHeader(header, game.tags[header].value);
								return;
							}

							if (header === 'TimeControl') {
								tempChessGame.setHeader(header, game.tags[header][0].value);
								return;
							}

							tempChessGame.setHeader(header, game.tags[header]);
						}
					});

					let quality = 'Blunder';
					if (move.nag[0] === '$2') {
						quality = 'Mistake';
					}
					if (move.nag[0] === '$6') {
						quality = 'Inaccuracy';
					}

					let playedMove = move.notation.notation;
					if (move.turn === 'b') {
						playedMove = '... ' + move.notation.notation;
					}

					// Add comments indicating the previous bad move and its quality
					let annotation = createAnnotation(
						game.tags.White,
						game.tags.Black,
						game.tags.UTCDate,
						game.tags.UTCTime,
						playedMove,
						quality,
						game.tags.Site
					);
					tempChessGame.setComment(annotation);

					// Add the variation here
					move.variations[0].forEach((variationmove) => {
						tempChessGame.move(variationmove.notation.notation);
					});

					// Add this pgn to the collection
					puzzleCollection.push(tempChessGame.pgn());

					// Finally redo the current move
					chessgame.move(move.notation.notation);
				}
			}
		});
	});

	return puzzleCollection.join('\n\n');
}

/**
 * Create a custom annotation in the PGN indicating the situation with this position
 * 
 * @param {*} White Name of the white player
 * @param {*} Black Name of the black player
 * @param {*} UTCDate UTC date of the game
 * @param {*} UTCTime UTC time of the game
 * @param {*} playedMove The original move played in this position
 * @param {*} quality The quality (inaccuracy, mistake, blunder) of the original move
 * @param {*} site The URL to the specific game
 * @returns An HTML-formatted string ready to insert into the PGN as an annotation
 */
function createAnnotation(White, Black, UTCDate, UTCTime, playedMove, quality, site) {
	let annotation = '';

	let qualityComment = 'a <span style="font-weight: bold;color: #df5353;">Blunder</span>';
	if (quality === 'Mistake') {
		qualityComment = 'a <span style="font-weight: bold;color: #dc9601;">Mistake</span>';
	}
	if (quality === 'Inaccuracy') {
		qualityComment = 'an <span style="font-weight: bold;color: #53b2ea;">Inaccuracy</span>';
	}

	let playedMoveComment = '<span style="font-weight: bold;color: #0d6efd">' + playedMove + '</span>';

	annotation = White + ' vs. ' + Black + '\n\n';

	annotation = annotation + 'In a <a target="_blank" href="' + site + '">Lichess</a> game played on ' + UTCDate.value + ' @ ' + UTCTime.value + ', ';
	annotation = annotation + 'you played ' + playedMoveComment + ', which is ' + qualityComment + '.';

	return annotation;
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

/**
 * Main process. Download the games, extract the tactics, generate & download the file.
 */
async function processGames() {
	// Clear the console
	console.clear();

	// Calculate estimated time to download set based on published 20 games/sec rate
	let estimate = Math.round(parseInt(options.maxGames) / 20);
	let units = 'seconds';
	if (estimate === 1) {
		units = 'second';
	}

	console.log('Downloading games - please wait (estimated time: ' + estimate + ' ' + units + ')');
	addSpinner();

	let games = await downloadLichessGames();

	let tactics = [];
	games.forEach((game) => {
		// Exit this game early if this is not a standard game (maybe look to add fromPosition or other variants later...)
		if (game.variant !== 'standard') {
			return;
		}

		let tacticsLine = extractLines(game.pgn, options);
		// Only add to the list if there are tactics found
		if (tacticsLine.length > 0) {
			tactics.push(tacticsLine);
		}
	});

	let finalpuzzle = loadPGNFile(tactics.join('\n\n'));

	console.log('\nGames with tactics found: ' + tactics.length + ' out of ' + options.maxGames);
	console.log('Tactics puzzles generated: ' + finalpuzzle.length + '\n');

	if (finalpuzzle.length > 0) {
		download('tactics.pgn', tactics.join('\n\n'));
		console.log('tactics.pgn has been downloaded to your system');
	}
	$('#myConsole').scrollTop($('#myConsole').prop('scrollHeight'));

	removeSpinner();
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
