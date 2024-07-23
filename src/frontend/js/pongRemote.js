/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   pongRemote.js                                      :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jutrera- <jutrera-@student.42madrid.com    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/04/08 11:49:24 by adpachec          #+#    #+#             */
/*   Updated: 2024/05/03 20:39:19 by jutrera-         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { isLoggedIn, getUsernameFromToken } from "./auth.js";
import router from "./main.js";
import initPlayPage from "./play.js";

let ctx;
let canvas;
let socket;

let statePaddles = { x1: 0, y1: 0, score1: 0, x2: 0, y2: 0, score2: 0 };
let stateBall = { x: 0, y: 0, vx: 0, vy: 0 };
let stateGame = {
	v: 0,
	ballWidth: 0,
	ballHeight: 0,
	playerWidth: 0,
	playerHeight: 0,
	finalScore: 0,
	name1: "",
	name2: "",
};
let stateMatch = {
	id: 0,
	state: "",
	paddles: statePaddles,
	ball: stateBall,
	game: stateGame,
};

let id_tournament;
let playerNumber; //1 or 2
let elapsedTime = 0;
let ballInterval = null;
let timerInterval = null;
const refreshTime = 1000 / 30;

function startGameRemote(id_match, id_tour) {
	if (isLoggedIn()) {
		stateMatch.game.name1 = getUsernameFromToken();
		showGameScreen();
		if (id_match == 0) {
			selectMatch();
		} else {
			joinMatch(id_match);
		}
		id_tournament = id_tour;
	} else {
		router.route("/login");
	}
}

function showGameScreen() {
	const mainContent = document.getElementById("main-content");
	mainContent.innerHTML = `
    <div class="container mt-5 game-container">
        <div class="row align-items-center">
            <div class="col-12 col-lg-8 mx-auto">
                <div class="bg-dark text-white p-3 rounded-3">
                    <div class="d-flex justify-content-between mb-2">
                        <h2 id="game-score" class="mb-0">${stateMatch.game.name1} 0 - 0 (waiting)</h2>
                        <h3 id="game-timer" class="mb-0">00:00</h3>
                    </div>
                    <canvas id="pong-game" class="w-100"></canvas>
                </div>
            </div>
        </div>
        <div class="row mt-3">
            <div class="col-12 text-center">
                <button class="btn btn-success btn-lg mx-2" id="pause-game">Pause</button>
                <button class="btn btn-danger btn-lg mx-2" id="quit-game">Quit</button>
            </div>
        </div>
    </div>
    `;
	initializeGame();
}

function initializeGame() {
	canvas = document.getElementById("pong-game");
	ctx = canvas.getContext("2d");
	resetTime();
	const container = document.querySelector(".game-container");
	const width = container.clientWidth;
	const height = Math.max(width * 0.5, 300);
	canvas.width = width;
	canvas.height = height;
	ctx.fillStyle = "#000";
	ctx.fillRect(0, 0, canvas.width, canvas.height); //Borra todo
	drawBorders();
	drawNet();
}

function attachGameControlEventListeners() {
	document.getElementById("pause-game").addEventListener("click", pauseGame);
	document.getElementById("quit-game").addEventListener("click", quitGame);
	document.addEventListener("keydown", handleKeyDown);
	window.addEventListener("resize", resizeCanvas);
}

async function handleKeyDown(e) {
	let pressed = e.key;
	if (e.ctrlKey && pressed == 'v'){
		pressed = 'VelocityUp';
	}
	if (e.ctrlKey && pressed == 'c'){
		pressed = 'VelocityDown';
	}
	if (stateMatch.state != "pause" &&	(pressed == "ArrowUp" || pressed == "ArrowDown" ||
		pressed == "VelocityUp" || pressed == "VelocityDown")) {
		if (playerNumber == 2) {
			pressed == "ArrowUp" ? (pressed = "w") : (pressed = "s");
		}
		const apiUrl = `/api/game/paddles?id_match=${stateMatch.id}&key=${pressed}`;
		try {
			const response = await fetch(apiUrl);
			if (response.ok) {
				const responsedata = await response.json();
				sendPaddles(responsedata.paddles);
			}
		} catch (error) {
			console.error("Error moving paddles:", error);
		}
	}
}

function resizeCanvas() {
	const container = document.querySelector(".game-container");
	if (canvas && container) {
		const width = container.clientWidth;
		const height = Math.max(width * 0.5, 300);
		canvas.width = width;
		canvas.height = height;
		drawPong();
	}
}

function updateTimeDisplay() {
	function pad(number) {
		return number < 10 ? "0" + number : number;
	}
	const timerDisplay = document.getElementById("game-timer");
	const totalSeconds = Math.floor(elapsedTime / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const remainingSeconds = totalSeconds % 60;
	timerDisplay.textContent = `${pad(minutes)}:${pad(remainingSeconds)}`;
}

function startTimer() {
	if (!timerInterval) {
		let startTime = Date.now() - elapsedTime; // Ajustar el tiempo de inicio
		timerInterval = setInterval(() => {
			elapsedTime = Date.now() - startTime;
			updateTimeDisplay();
		}, 1000);
	}
}

function resetTime() {
	clearInterval(timerInterval);
	timerInterval = null;
	elapsedTime = 0;
	updateTimeDisplay();
}

function pauseTimer() {
	if (timerInterval) {
		clearInterval(timerInterval);
		timerInterval = null;
	}
}

function pauseGame() {
	if (stateMatch.state == "pause") {
		sendState("playing");
	} else if (stateMatch.state == "playing") {
		sendState("pause");
	}
}

function quitGame() {
	if (stateMatch.state == "playing") {
		sendState("pause");
		Swal.fire({
			confirmButtonColor: "#32B974",
			title: "Are you sure ?",
			showDenyButton: true,
			showCancelButton: false,
			confirmButtonText: "Yes",
			denyButtonText: `No`,
		}).then((result) => {
			if (result.isConfirmed) {
				socket.close();
				initPlayPage();
			} else if (result.isDenied) {
				document.getElementById("pause-game").textContent = "Pause";
				sendState("playing");
			}
		});
	}
}

function initAnimation() {
	const centerX = canvas.width / 2;
	const centerY = canvas.height / 2;
	let timeLeft = 3;
	const fx = canvas.width;
	const fy = canvas.height;
	const countdownInterval = setInterval(() => {
		ctx.fillStyle = "#000";
		ctx.fillRect(0, 0, canvas.width, canvas.height); //Borra todo
		drawBorders();
		ctx.fillStyle = "#FFF";
		ctx.fillRect(
			stateMatch.paddles.x1 * fx,
			stateMatch.paddles.y1 * fy,
			stateMatch.game.playerWidth * fx,
			stateMatch.game.playerHeight * fy
		); //Dibuja la paleta 1
		ctx.fillRect(
			stateMatch.paddles.x2 * fx,
			stateMatch.paddles.y2 * fy,
			stateMatch.game.playerWidth * fx,
			stateMatch.game.playerHeight * fy
		); //Dibuja la paleta 2

		// Calculate minutes and seconds
		const seconds = timeLeft % 60;
		const displayTime = `${seconds}`;

		// Set font size relative to canvas size
		const fontSize = Math.min(canvas.width, canvas.height) / 3;
		ctx.strokeStyle = "#FFF";
		ctx.font = `${fontSize}px Arial`;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";

		// Draw the countdown text
		ctx.fillStyle = "#FFF";
		ctx.fillText(displayTime, centerX, centerY);

		// Draw the circle
		ctx.beginPath();
		const radius = Math.min(canvas.width, canvas.height) / 2.5;
		ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
		ctx.strokeStyle = "#FFF";
		ctx.lineWidth = 10;
		ctx.setLineDash([]);
		ctx.stroke();

		// Update the time left
		timeLeft--;

		// Stop the countdown when it reaches zero
		if (timeLeft < 0) {
			drawPong();
			clearInterval(countdownInterval);
			sendState("playing");
		}
	}, 1000);
}

function drawPong() {
	const fx = canvas.width;
	const fy = canvas.height;

	ctx.fillStyle = "#000";
	ctx.fillRect(0, 0, canvas.width, canvas.height); //Borra todo
	drawBorders();
	drawNet();

	ctx.fillStyle = "#FFF";
	ctx.fillRect(
		stateMatch.paddles.x1 * fx,
		stateMatch.paddles.y1 * fy,
		stateMatch.game.playerWidth * fx,
		stateMatch.game.playerHeight * fy
	); //Dibuja la paleta 1
	ctx.fillRect(
		stateMatch.paddles.x2 * fx,
		stateMatch.paddles.y2 * fy,
		stateMatch.game.playerWidth * fx,
		stateMatch.game.playerHeight * fy
	); //Dibuja la paleta 2
	ctx.fillRect(
		stateMatch.ball.x * fx,
		stateMatch.ball.y * fy,
		stateMatch.game.ballWidth * fy,
		stateMatch.game.ballHeight * fy
	); // Dibuja la bola
}

function drawPaddles(newPaddles) {
	const fx = canvas.width;
	const fy = canvas.height;

	ctx.fillStyle = "#000";
	ctx.fillRect(
		stateMatch.paddles.x1 * fx - 1,
		stateMatch.paddles.y1 * fy - 1,
		stateMatch.game.playerWidth * fx + 2,
		stateMatch.game.playerHeight * fy + 2
	); //Borra la paleta 1
	ctx.fillRect(
		stateMatch.paddles.x2 * fx - 1,
		stateMatch.paddles.y2 * fy - 1,
		stateMatch.game.playerWidth * fx + 2,
		stateMatch.game.playerHeight * fy + 2
	); //Borra la paleta 2

	stateMatch.paddles = newPaddles;
	ctx.fillStyle = "#FFF";
	ctx.fillRect(
		stateMatch.paddles.x1 * fx,
		stateMatch.paddles.y1 * fy,
		stateMatch.game.playerWidth * fx,
		stateMatch.game.playerHeight * fy
	); //Dibuja la paleta 1
	ctx.fillRect(
		stateMatch.paddles.x2 * fx,
		stateMatch.paddles.y2 * fy,
		stateMatch.game.playerWidth * fx,
		stateMatch.game.playerHeight * fy
	); //Dibuja la paleta 2
}

function drawBall(newBall) {
	const fx = canvas.width;
	const fy = canvas.height;

	ctx.fillStyle = "#000";
	ctx.fillRect(
		stateMatch.ball.x * fx - 1,
		stateMatch.ball.y * fy - 1,
		stateMatch.game.ballWidth * fy + 2,
		stateMatch.game.ballWidth * fy + 2
	); //Borra la bola

	stateMatch.ball = newBall; //Obtiene la nueva posición de la bola
	ctx.fillStyle = "#FFF";
	drawNet();
	drawBorders();
	ctx.fillRect(
		stateMatch.paddles.x1 * fx,
		stateMatch.paddles.y1 * fy,
		stateMatch.game.playerWidth * fx,
		stateMatch.game.playerHeight * fy
	); //Dibuja la paleta 1
	ctx.fillRect(
		stateMatch.paddles.x2 * fx,
		stateMatch.paddles.y2 * fy,
		stateMatch.game.playerWidth * fx,
		stateMatch.game.playerHeight * fy
	); //Dibuja la paleta 2
	ctx.fillRect(
		stateMatch.ball.x * fx,
		stateMatch.ball.y * fy,
		stateMatch.game.ballWidth * fy,
		stateMatch.game.ballHeight * fy
	); // Dibuja la bola
}

function drawScores(newScore1, newScore2) {
	const scoreDisplay = document.getElementById("game-score");
	scoreDisplay.innerHTML = `${stateMatch.game.name1} ${newScore1} - ${newScore2} ${stateMatch.game.name2}`;
}

function drawBorders() {
	const w = 0.005 * canvas.height;

	ctx.fillStyle = "#FFF";
	ctx.lineWidth = 2 * w;
	ctx.beginPath();
	ctx.moveTo(w, w);
	ctx.lineTo(canvas.width - w, w);
	ctx.lineTo(canvas.width - w, canvas.height - w);
	ctx.lineTo(w, canvas.height - w);
	ctx.lineTo(w, w);
	ctx.setLineDash([]);
	ctx.stroke();
}

function drawNet() {
	const w = 0.01 * canvas.width;

	ctx.strokeStyle = "#FFF";
	ctx.lineWidth = w;
	ctx.beginPath();
	ctx.moveTo(canvas.width / 2, w);
	ctx.lineTo(canvas.width / 2, canvas.height);
	ctx.setLineDash([0.1 * canvas.height, 0.02 * canvas.height]);
	ctx.stroke();
}

/***************** CONNECTING WITH API ********************/
/** Por defecto, la función fetch utiliza el método GET  **/

async function selectMatch() {
	const inputOptions = new Promise((resolve) => {
		setTimeout(() => {
			resolve({
				new: "New",
				join: "Join",
			});
		}, 1000);
	});

	const { value: m } = await Swal.fire({
		title: "Select mode",
		input: "radio",
		inputOptions,
		inputValidator: (value) => {
			if (!value) {
				return "You need to choose something!";
			}
		},
	});

	if (m == "new") newMatch(null);
	else joinMatch(null);
}

async function newMatch(id_match) {
	let isTournament = true;
	if (!id_match) {
		id_match = Math.floor(Math.random() * (9999 - 1000 + 1) + 1000);
		isTournament = false;
	}

	try {
		stateMatch.game.name2 = "";
		const apiUrl = `/api/match/new?id_match=${id_match}&name1=${stateMatch.game.name1}&name2=${stateMatch.game.name2}`;
		const response = await fetch(apiUrl);
		if (response.ok) {
			const wsUrl = `wss://${window.location.host}/wss/pong/${id_match}/`;
			socket = new WebSocket(wsUrl);

			configureSocketEvents();

			const data = await response.json();
			stateMatch.id = data.id;
			stateMatch.game = data.game;
			stateMatch.paddles = data.paddles;
			stateMatch.ball = data.ball;

			if (!isTournament) {
				Swal.fire({
					icon: "success",
					title: "Match match code: " + stateMatch.id,
				});
			}
		} else {
			console.error("Fetch error:  ", response.status);
		}
	} catch (error) {
		console.error("fetch request error: ", error);
		return false;
	}
}

async function joinMatch(id_match) {
	let isTournament = true;
	if (!id_match) {
		const { value: matchId } = await Swal.fire({
			title: "Enter match code",
			input: "text",
			inputPlaceholder: "Match code",
			inputValidator: (value) => {
				if (!value) {
					return "You need to write something!";
				}
			},
		});
		id_match = matchId;
		isTournament = false;
	}

	try {
		const apiUrl = `/api/match/join?id_match=${id_match}&name1=${stateMatch.game.name1}`;
		const response = await fetch(apiUrl);
		if (response.status == 404) {
			if (isTournament) {
				console.error("El match no existe aún");
				newMatch(id_match);
			} else {
				Swal.fire({
					icon: "error",
					title: "Match not found",
				}).then((e) => (window.location.href = "/"));
			}
		} else if (response.status == 400) {
			Swal.fire({
				icon: "error",
				title: "Match already started",
			}).then((e) => (window.location.href = "/"));
		} else if (response.ok) {
			const wsUrl = `wss://${window.location.host}/wss/pong/${id_match}/`;
			socket = new WebSocket(wsUrl);
			configureSocketEvents();

			const data = await response.json();
			stateMatch.id = data.id;
			stateMatch.game = data.game;
			stateMatch.paddles = data.paddles;
			stateMatch.ball = data.ball;
			sendNames();
		}
	} catch (error) {
		console.error("fetch request error: ", error);
		return false;
	}
}

async function deleteMatch() {
	const apiUrl = `/api/match/delete?id_match=${stateMatch.id}`;
	try {
		const response = await fetch(apiUrl, {
			method: "DELETE",
		});
		if (response.ok) {
			const responsedata = await response.json();
			console.log(responsedata.msg);
		}
	} catch (error) {
		console.error("Error deleting match:", error);
	}
}

async function saveMatch() {
	const apiUrl = `/api/match/save?id_match=${stateMatch.id}&id_tournament=${id_tournament}`;
	try {
		const response = await fetch(apiUrl);
		if (response.ok) {
			const responsedata = await response.json();
			console.log(responsedata.msg);
		}
	} catch (error) {
		console.error("Error saving match:", error);
	}
}

async function resetBall() {
	const apiUrl = `/api/game/reset?id_match=${stateMatch.id}`;
	try {
		const response = await fetch(apiUrl);
		if (response.ok) {
			const responsedata = await response.json();
			sendBall(responsedata.ball);
		}
	} catch (error) {
		console.error("Error reseting ball:", error);
	}
}

async function moveBall() {
	const apiUrl = `/api/game/ball?id_match=${stateMatch.id}`;
	try {
		const response = await fetch(apiUrl);
		if (response.ok) {
			const responsedata = await response.json();
			if (responsedata.msg == "scored") {
				clearInterval(ballInterval);
				ballInterval = null;
				sendScores(responsedata.score1, responsedata.score2);
			} else if (responsedata.msg == "gameover") {
				clearInterval(ballInterval);
				ballInterval = null;
				sendGameOver(responsedata.score1, responsedata.score2);
			} else if (responsedata.msg == "playing")
				sendBall(responsedata.ball);
		}
	} catch (error) {
		console.error("Error moving ball:", error);
	}
}

async function updateScores(newScore1, newScore2) {
	const apiUrl = `/api/match/updatescores?id_match=${stateMatch.id}&score1=${newScore1}&score2=${newScore2}`;
	try {
		const response = await fetch(apiUrl);
		if (response.ok) {
			const responsedata = await response.json();
			console.log(responsedata.msg);
			sendGameOver(newScore1, newScore2);
		}
	} catch (error) {
		console.error("Error updating scores:", error);
	}
}

async function sendGameOver(newScore1, newScore2) {
	if (socket) {
		while (socket.readyState !== WebSocket.OPEN) {
			await new Promise((resolve) => setTimeout(resolve, 100)); // Esperar 100ms antes de volver a comprobar
		}
		socket.send(
			JSON.stringify({
				event: "game_over",
				score1: newScore1,
				score2: newScore2,
			})
		);
	}
}

async function sendState(newState) {
	if (socket) {
		while (socket.readyState !== WebSocket.OPEN) {
			await new Promise((resolve) => setTimeout(resolve, 100)); // Esperar 100ms antes de volver a comprobar
		}
		socket.send(
			JSON.stringify({
				event: "change_state",
				state: newState,
			})
		);
	}
}

async function sendNames() {
	if (socket) {
		while (socket.readyState !== WebSocket.OPEN) {
			await new Promise((resolve) => setTimeout(resolve, 100)); // Esperar 100ms antes de volver a comprobar
		}
		socket.send(
			JSON.stringify({
				event: "write_names",
				name1: stateMatch.game.name1,
				name2: stateMatch.game.name2,
			})
		);
	}
}

async function sendPaddles(newPaddles) {
	if (socket) {
		while (socket.readyState !== WebSocket.OPEN) {
			await new Promise((resolve) => setTimeout(resolve, 100)); // Esperar 100ms antes de volver a comprobar
		}
		socket.send(
			JSON.stringify({
				event: "move_paddles",
				paddles: newPaddles,
			})
		);
	}
}

async function sendBall(newBall) {
	if (socket) {
		while (socket.readyState !== WebSocket.OPEN) {
			await new Promise((resolve) => setTimeout(resolve, 100)); // Esperar 100ms antes de volver a comprobar
		}
		socket.send(
			JSON.stringify({
				event: "move_ball",
				ball: newBall,
			})
		);
	}
}

async function sendScores(newScore1, newScore2) {
	if (socket) {
		while (socket.readyState !== WebSocket.OPEN) {
			await new Promise((resolve) => setTimeout(resolve, 100)); // Esperar 100ms antes de volver a comprobar
		}
		socket.send(
			JSON.stringify({
				event: "write_scores",
				score1: newScore1,
				score2: newScore2,
			})
		);
	}
}

function configureSocketEvents() {
	socket.onopen = (e) => {
		console.log("Connection established");
	};

	socket.onclose = (e) => {
		console.log("Game socket closed", e);
	};

	socket.onerror = (e) => {
		console.error("WebSocket error: ", e);
	};

	socket.onmessage = (e) => {
		handleSocketMessage(e);
	};
}

function handleSocketMessage(e) {
	const data = JSON.parse(e.data);

	if (data.event == "show_error") {
		Swal.fire({
			icon: "error",
			title: data.error,
		}).then((e) => (window.location.href = "/"));
	} else if (data.event == "Connected") {
		if (data.server_ip) {
			const serverIP = data.server_ip;
			console.log("Server IP received from server: ", serverIP);
		} else console.log("NO server IP received from server");
	} else if (data.event == "write_names") {
		if (data.name1 != "") stateMatch.game.name1 = data.name1;
		if (data.name2 != "") stateMatch.game.name2 = data.name2;
		document.getElementById(
			"game-score"
		).innerHTML = `${stateMatch.game.name1} 0 - 0 ${stateMatch.game.name2}`;
	} else if (data.event == "ready") {
		console.log("Game start player: ", data.player);
		playerNumber = data.player;
		attachGameControlEventListeners();
		sendState("countdown");
	} else if (data.event == "opponent_left") {
		pauseTimer();
		setTimeout(() => {
			Swal.fire({
				icon: "info",
				title: "Opponent Left",
				confirmButtonText: "OK",
			}).then((e) => {
				if (playerNumber == 1) updateScores(3, 0);
				else updateScores(0, 3);
			});
		}, 400);
	} else if (data.event == "game_over") {
		pauseTimer();
		document.getElementById(
			"game-score"
		).innerHTML = `${stateMatch.game.name1} ${data.score1} - ${data.score2} ${stateMatch.game.name2}`;
		let winner;
		data.score1 > data.score2
			? (winner = stateMatch.game.name1)
			: (winner = stateMatch.game.name2);
		let currentName = getUsernameFromToken();
		Swal.fire({
			icon: winner == currentName ? "success" : "error",
			title: winner == currentName ? "YOU WIN!" : "YOU LOSE!",
			confirmButtonText: "OK",
		}).then((result) => {
			if (result.isConfirmed) {
				saveMatch();
				deleteMatch();
				socket.close(4000);
				initPlayPage();
			}
		});
	} else if (data.event == "move_paddles") {
		drawPaddles(data.paddles);
	} else if (data.event == "move_ball") {
		drawBall(data.ball);
	} else if (data.event == "write_scores") {
		pauseTimer();
		drawScores(data.score1, data.score2);
		resetBall();
		sendState("countdown");
	} else if (data.event == "change_state") {
		stateMatch.state = data.state;

		if (data.state == "playing") {
			document.getElementById("pause-game").textContent = "Pause";
			startTimer();
			if (playerNumber == 1 && !ballInterval)
				ballInterval = setInterval(moveBall, refreshTime);
		} else if (data.state == "pause") {
			document.getElementById("pause-game").textContent = "Resume";
			if (playerNumber == 1 && ballInterval) {
				clearInterval(ballInterval);
				ballInterval = null;
			}
			pauseTimer();
		} else if (data.state == "countdown") {
			initAnimation();
		}
	}
}

function closeSocket() {
	if (socket) socket.close();
}

export { startGameRemote, closeSocket };
