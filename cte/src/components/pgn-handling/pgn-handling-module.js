// ---------------------
// PGN related Functions
// ---------------------

/* eslint linebreak-style: ["error", "unix"] */
/* eslint indent: ["error", "tab", { "SwitchCase": 1 }] */
/* eslint semi-style: ["error", "last"] */
/* eslint semi: ["error"] */

/* eslint no-undef: "error"*/
/* global console */

/* eslint no-unused-vars: "error"*/
/* exported */

import { parse } from '../../lib/pgn-parser/pgn-parser-1.4.18-esm-min.js';

/*
	Source: https://github.com/mliebelt/pgn-parser

	Component download:
	https://www.npmjs.com/package/@mliebelt/pgn-parser 

	https://unpkg.com/@mliebelt/pgn-parser@1.4.18/lib/index.umd.js // Original
	https://cdn.jsdelivr.net/npm/@mliebelt/pgn-parser@1.4.18/lib/index.umd.min.js // Minified
	https://cdn.jsdelivr.net/npm/@mliebelt/pgn-parser@1.4.18/+esm // Minified ESM version

*/

/**
 * PGN File pre-processing and cleanp prior to parsing
 *
 * @param {string} PGNData - The raw text version of the PGN file
 * @returns {string} - The processed text version of the PGN file
 */
function cleanPGNFile(PGNData) {
	// Clean up the file prior to processing
	PGNData = PGNData.trim(); // Remove extra blank lines before and after the content

	// Replace other null move identifiers with Z0 notation which is already supported by the parser as a null move.
	// See: https://chess.stackexchange.com/questions/14072/san-for-nullmove for list of possible null move indicators

	let NullMoveIndicators = ['0000', '00-00', '@@@@', '<>', '(null)'];

	// Excluding "null" and "pass" so that it doesn't inadvertently change any annotation text (like "passed pawn" becoming "Z0ed pawn")
	// Also excluding "--" from replacement since it is now directly supported in the parser.  Internally, the object returned will replace it to Z0.

	NullMoveIndicators.forEach((nullmove) => {
		PGNData = PGNData.replaceAll(nullmove, 'Z0');
	});

	// Fix for weird issue in some PGNs where the draw indication has extra spaces which will fail parsing
	PGNData = PGNData.replaceAll('1/2 - 1/2', '1/2-1/2');

	return PGNData;
}

/**
 * Prep the incoming PGN file and then send to the PGN Parser
 *
 * @param {text} PGNFile The text of the PGN file to parse
 * @returns {object} The parsed JSON object of the PGN file
 */
function loadPGNFile(PGNFile) {

	// Clean up before parsing
	PGNFile = cleanPGNFile(PGNFile);
	// Try to parse the file.  Display error if issue discovered.
	try {
		// Get original set of puzzles from the PGN
		let puzzlesetOriginal = parse(PGNFile, { startRule: 'games' });

		return puzzlesetOriginal;
	} catch (err) {
		console.log(`${err.name}: ${err.message}`);
		console.log(err.errorHint);

		return [];
	}
}

export { loadPGNFile };
