var nn6 = document.getElementById && !document.all;

var time = 0;
var start_time = 0;
var game_over = false;
var light = 0;
var num_right = 0;
const num_questions = 25;

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
	setTimeout('inc_time()', 100);
	setstatus('0/' + num_questions.toString());

	gen_square();

	st = new Date();
	start_time = st.getTime();
}

function inc_time() {
	st = new Date();
	time = st.getTime() - start_time;

	time /= 1000;
	time = time.toFixed(1);

	settimer('Time: ' + time);

	if (!game_over) setTimeout('inc_time()', 100);
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
	st = new Date();
	time = st.getTime() - start_time;
	time = Math.round(time / 10) / 100;
	setfinaltime('Final Time: ' + time);
	document.getElementById('ft').value = time;
	document.getElementById('fc').value = gc(time);
}

function setfinaltime(text) {
	nn6 ? (document.getElementById('finaltime').innerHTML = text) : (document.all.finaltime.innerHTML = text);
}

function settimer(text) {
	nn6 ? (document.getElementById('statustimer').innerHTML = text) : (document.all.statustimer.innerHTML = text);
}

function setstatus(text) {
	nn6 ? (document.getElementById('status').innerHTML = text) : (document.all.status.innerHTML = text);
}

function setsquare(text) {
	text = 'Square: ' + text;
	nn6 ? (document.getElementById('squareid').innerHTML = text) : (document.all.squareid.innerHTML = text);
}

function gc(t) {
	return calc(t);
}
