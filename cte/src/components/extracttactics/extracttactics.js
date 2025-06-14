// Required modules
import { loadPGNFile } from '../../components/pgn-handling/pgn-handling-module.js';
import { Chess } from '../../lib/chess/chess1.20.0-esm-customised.js';

// Define global variables
let moveQualties = [
	{ moveQuality: 'Blunder', NAG: '$4', symbol: '??', color: '#df5353' },
	{ moveQuality: 'Mistake', NAG: '$2', symbol: '?', color: '#dc9601' },
	{ moveQuality: 'Inaccuracy', NAG: '$6', symbol: '?!', color: '#53b2ea' },
];

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

	//console.log(PGNFile)
	let jsonGame = loadPGNFile(PGNFile);

	jsonGame.forEach((game) => {
		//console.log(game);

		// Some cleansing if non-Lichess games are used. Bare minimum PGN needs Date, White, Black, & Event.
		if (game.tags?.UTCDate === undefined) {
			game.tags.UTCDate = game.tags.Date;
		}

		if (game.tags?.GameId === undefined) {
			game.tags.GameId = 'Non-Lichess Game';
		}

		let tagCheck = ['White', 'Black', 'Event'];
		tagCheck.forEach((tag) => {
			if (game.tags[tag] === undefined) {
				game.tags[tag] = '';
			}
		});

		// Output current game being processed to the console
		console.log(`${game.tags?.GameId}: ${game.tags?.White} vs. ${game.tags?.Black} (${game.tags?.Event}) - ${game.tags?.UTCDate?.value}`);

		// Load the moves of the PGN into memory
		let chessgame = new Chess();
		game.moves.forEach((move) => {
			//console.log(move)
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

						if (game.tags.Black.toLowerCase() === options.userID.toLowerCase()) {
							playerTurn = 'b';
						}

						// If the player to play is not the current move, exit early
						if (playerTurn !== move.turn) {
							return;
						}

						// If the color option has been set and it doesn't match the current turn, exit
						if (options.color !== '' && options.color.slice(0, 1).toLowerCase() !== move.turn) {
							return;
						}
					}

					// Skip if there are no moves in the variation
					if (move.variations.length === 0) {
						return;
					}

					// Check variation length to confirm it meets the minimum depth
					if (move.variations[0]?.length < options.minimumDepth) {
						return;
					}

					// undo the last move in the game in order to get the fen prior to the bad move
					chessgame.undo();

					// Create a new Chess Game here and set it up with this fen.
					let tempChessGame = new Chess(chessgame.fen());

					// Add the headers
					headers.forEach((header) => {
						if (game.tags?.header !== '') {
							if (header === 'Date' || header === 'UTCDate') {
								tempChessGame.setHeader(header, game.tags[header].value);
								return;
							}

							if (header === 'TimeControl' && game.tags.TimeControl?.value !== undefined) {
								tempChessGame.setHeader(header, game.tags[header][0].value);
								return;
							}

							tempChessGame.setHeader(header, game.tags[header]);
						}
					});

					// Determine the move quality based on the NAG value
					let quality = moveQualties.find(({ NAG }) => NAG === move.nag[0]).moveQuality;

					let playedMove = move.notation.notation;
					if (move.turn === 'b') {
						playedMove = '... ' + move.notation.notation;
					}

					// Add comments indicating the previous bad move and its quality
					let annotation = createLichessAnnotation(game.tags.White, game.tags.Black, game.tags.Site, game.tags.UTCDate, playedMove, quality);

					// This isn't a Lichess game, create a generic annotation instead
					if (!game.tags.Site.includes('https://lichess.org/')) {
						annotation = createOtherAnnotation(game.tags.White, game.tags.Black, game.tags.Event, game.tags.Date, playedMove, quality);
					}

					tempChessGame.setComment(annotation);

					// Limit variation line to specified maxium
					let limitVariation = true;
					if (options.maxiumDepth === 49) {
						limitVariation = false;
					}

					if (limitVariation) {
						for (let i = 0; i < options.maxiumDepth; i++) {
							// Only populate the variation up to the max depth (if not unlimited)
							if (i >= move.variations[0].length) {
								break;
							}

							tempChessGame.move(move.variations[0][i].notation.notation);
						}
					} else {
						// Test if any validations are valid and use the first one if so
						// This is to cover variations that continue the current move to show the reason why the move was bad
						let variationIndex = 0;
						let validLine = false;

						for (let i = 0; i < move.variations.length; i++) {
							try {
								tempChessGame.move(move.variations[i][0].notation.notation);
								tempChessGame.undo();
								variationIndex = i;
								validLine = true;
								break; // Stop on successful find of variation index
							} catch {
								validLine = false;
							}
						}

						if (!validLine) {
							// No valid lines found, exit.
							return;
						}

						// Add the variation here
						move.variations[variationIndex].forEach((variationmove) => {
							try {
								tempChessGame.move(variationmove.notation.notation);
							} catch {
								console.log(
									'Invalid variation for move ' +
										move.notation.notation +
										' (' +
										variationmove.notation.notation +
										') found on ' +
										computePly(chessgame.history().length + 2).color +
										' move #' +
										computePly(chessgame.history().length + 2).number +
										'. Skipping'
								);
								return;
							}
						});
					}

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

function computePly(plyNumber) {
	let move = {};

	if (plyNumber % 2 !== 0) {
		move.color = 'black';
		move.number = (plyNumber + 1) / 2;
	} else {
		move.color = 'white';
		move.number = plyNumber / 2;
	}

	return move;
}

/**
 * Create a custom annotation in the PGN indicating the situation with this position
 *
 * @param {*} White Name of the white player
 * @param {*} Black Name of the black player
 * @param {*} UTCDate UTC date of the game
 * @param {*} playedMove The original move played in this position
 * @param {*} quality The quality (inaccuracy, mistake, blunder) of the original move
 * @param {*} site The URL to the specific game
 * @returns An HTML-formatted string ready to insert into the PGN as an annotation
 */
function createLichessAnnotation(White, Black, site, UTCDate, playedMove, quality) {
	let annotation = '';

	let qualitySymbol = moveQualties.find(({ moveQuality }) => moveQuality === quality).symbol;
	let qualityColor = moveQualties.find(({ moveQuality }) => moveQuality === quality).color;

	let playedMoveComment = '<span style="font-weight: bold;color: ' + qualityColor + ';">' + playedMove + qualitySymbol + '</span>';

	annotation = White + ' vs. ' + Black + '\n\n';

	annotation = annotation + 'In a <a target="_blank" href="' + site + '">Lichess game</a> played on ' + UTCDate.value + ', ';
	annotation = annotation + 'you played ' + playedMoveComment + ', find a better move.';

	return annotation;
}

function createOtherAnnotation(White, Black, Event, Date, playedMove, quality) {
	let annotation = '';

	let qualitySymbol = moveQualties.find(({ moveQuality }) => moveQuality === quality).symbol;
	let qualityColor = moveQualties.find(({ moveQuality }) => moveQuality === quality).color;

	let playedMoveComment = '<span style="font-weight: bold;color: ' + qualityColor + ';">' + playedMove + qualitySymbol + '</span>';

	annotation = White + ' vs. ' + Black + '\n\n';

	annotation = annotation + 'In a game played at ' + Event + ' on ' + Date.value + ', ';
	annotation = annotation + 'you played ' + playedMoveComment + ', find a better move.';

	return annotation;
}

export { extractLines };
