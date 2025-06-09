// ---------------------
// Lichess Game Download
// ---------------------

/* eslint linebreak-style: ["error", "unix"] */
/* eslint indent: ["error", "tab", { "SwitchCase": 1 }] */
/* eslint semi-style: ["error", "last"] */
/* eslint semi: ["error"] */

/* eslint no-undef: "error"*/
/* global fetch,URLSearchParams console,  */
/* global */

/* eslint no-unused-vars: "error"*/
/* exported */

/**
 * Generic error handling for API calls
 *
 * @param {response} response The response from the API after a request
 * @returns
 */
function errorCheck(response) {
	// This will happen if the study permission for "Share and Export" is set to "Nobody"
	if (response.status === 403) {
		console.log('Forbidden: 403');
		return false;
	}

	// Wrong PAT supplied - Returns 401 (Unauthorized)
	if (response.status === 401) {
		console.log('Unauthorized: 401');
		return false;
	}

	// Too many Requests - Returns 429 (Too Many Requests)
	if (response.status === 429) {
		console.log('Too Many Requests: 429');
		return false;
	}

	// Player not found - Returns 404 (Not found)
	if (response.status === 404) {
		console.log('Player not found: 404');
		return false;
	}

	// Return any other unknown error
	if (response.status !== 200) {
		console.log('Error: ' + response.status);
		return false;
	}

	return true;
}

/**
 * Make a request to the Lichess API
 *
 * @param {object} options The options for this request
 * @returns The NDJSON object with the requested games
 */
async function fetchLichessData(options) {
	const headers = {
		Authorization: 'Bearer ' + options.lichessToken,
		Accept: 'application/x-ndjson',
	};

	let url = 'https://lichess.org/api/games/user/' + options.userID;

	// Parameter explanations found at https://lichess.org/api#tag/Games/operation/apiGamesUser
	let params = {
		max: options.maxGames.toString(), // How many games to download. Leave empty to download all games.
		analysed: 'true', // [Filter] Only games with or without a computer analysis available
		evals: 'true', // Include analysis evaluations and comments, when available. Either as PGN comments: 12. Bxf6 { [%eval 0.23] } a3 { [%eval -1.09] } Or in an analysis JSON field, depending on the response type.
		moves: 'true', // Include the PGN moves.
		literate: 'true', // Insert textual annotations in the PGN about the opening, analysis variations, mistakes, and game termination. Example: 5... g4? { (-0.98 → 0.60) Mistake. Best move was h6. } (5... h6 6. d4 Ne7 7. g3 d5 8. exd5 fxg3 9. hxg3 c6 10. dxc6)
		pgnInJson: 'true', // Include the full PGN within the JSON response, in a pgn field. The response type must be set to application/x-ndjson by the request Accept header.
		opening: 'false', // Include the opening name. Example: [Opening "King's Gambit Accepted, King's Knight Gambit"]
		clocks: 'false', // Include clock status when available. Either as PGN comments: 2. exd5 { [%clk 1:01:27] } e5 { [%clk 1:01:28] } Or in a clocks JSON field, as centisecond integers, depending on the response type.
		accuracy: 'false', // Include accuracy percent of each player, when available. Only available in JSON.
		division: 'false', // Plies which mark the beginning of the middlegame and endgame. Only available in JSON
		lastFen: 'false', // Include the FEN notation of the last position of the game. The response type must be set to application/x-ndjson by the request Accept header.
		perfType: options.gameSpeed, // Only games in these speeds or variants. Multiple perf types can be specified, separated by a comma. Example: blitz,rapid,classical
		vs: options.opponent, // Only games played against this opponent
		rated: options.rated, // Only rated (true) or casual (false) games. Leave empty for both.
		color: options.color, // Only games played as this color. Leave empty for both.
		since: options.since, // Download games played since this timestamp. Defaults to account creation date. Uses epoch time.
		until: options.until, // Download games played until this timestamp. Defaults to now. Uses epoch time.
	};

	let response;

	try {
		response = await fetch(url + '?' + new URLSearchParams(params).toString(), { headers: headers, cache: 'no-store' });

		if (!errorCheck(response)) {
			return false;
		}

		let responseText = await response.text();
		return responseText;
	} catch (error) {
		console.log(error);
		return false;
	}
}

/**
 * Get the games from Lichess API and parse result
 *
 * @param {object} options The options for this request
 * @returns Array of JSON objects with the individual games
 */
async function getGames(userDetails, options) {
	var ndjson = await fetchLichessData(userDetails, options);

	if (ndjson === false) {
		return [];
	}

	// Convert the NDJSON file that is returned into array of JSON objects
	// Adapted from https://gist.github.com/yaggytter/f74feeede736c8161bd0eee225a161b4 to convert NDJSON to Array of JSON
	var json = '[' + ndjson.replace(/\r?\n/g, ',').replace(/,\s*$/, '') + ']';
	var jsondata = JSON.parse(json);

	return jsondata;
}

export { getGames };
