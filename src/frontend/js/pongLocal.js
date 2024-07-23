/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   pongLocal.js                                       :+:      :+:    :+:   */
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

let modality;
let ctx;
let canvas;

let seconds = 0;
let statePaddles = { x1: 0, y1: 0, score1: 0, x2: 0, y2: 0, score2: 0 };
let stateBall = { x: 0, y: 0, vx: 0, vy: 0 };
let stateGame = { v: 0, ballWidth: 0, ballHeight: 0, playerWidth: 0, playerHeight: 0, finalScore: 0, name1: '', name2: ''};
let state;
let name1;
let name2;
let id;
let id_tournament;
let ballInterval = null;
let aiInterval = null;
let timerInterval = null;
let countdownInterval = null;
const refreshTime = 1000/30;

function startGameLocal(mode, player2, id_match, id_tour){
	modality = mode;
	if (isLoggedIn()) {
		name1 = getUsernameFromToken();
		if (!player2)
			name2 = 'AI';
		else
			name2 = player2;
		if (!id_match)
			id = 0; // Es un partido NORMAL
		else
			id = id_match; // Es un partido de TORNEO
		id_tournament = id_tour;
		showGameScreen();
		startPongLocal();
	}else{
		router.route('/login');
	}
}

function showGameScreen() {
	const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
    <div class="container mt-5 game-container">
        <div class="row align-items-center">
            <div class="col-12 col-lg-8 mx-auto">
                <div class="bg-dark text-white p-3 rounded-3">
                    <div class="d-flex justify-content-between mb-2">
                        <h2 id="game-score" class="mb-0">${name1} 0 - 0 ${name2}</h2>
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
	attachGameControlEventListeners();
}

function attachGameControlEventListeners() {
	document.getElementById('pause-game').addEventListener('click', pauseGame);
 	document.getElementById('quit-game').addEventListener('click', quitGame);
 	document.addEventListener('keydown', handleKeyDown);
	window.addEventListener('resize', resizeCanvas);
}

function initializeGame() {
    canvas = document.getElementById("pong-game");
	ctx = canvas.getContext('2d');
	resetTime();
	const container = document.querySelector('.game-container');
	const width = container.clientWidth;
	const height = Math.max(width * 0.5, 300);
	canvas.width = width;
	canvas.height = height;
	ctx.fillStyle = '#000';
	ctx.fillRect(0, 0, canvas.width, canvas.height); //Borra todo
	drawBorders();
}

function resizeCanvas() {
    const container = document.querySelector('.game-container');
    if (canvas && container) {
        const width = container.clientWidth;
        const height = Math.max(width * 0.5, 300);
        canvas.width = width;
        canvas.height = height;
		drawPong();
    }
}

function startTimer() {
    const timerDisplay = document.getElementById("game-timer");
	
	function pad(number) {return number < 10 ? '0' + number : number;}
	
    timerInterval = setInterval(() => {
	        seconds++;
    	    let minutes = Math.floor(seconds / 60);
    	    let remainingSeconds = seconds % 60;
    	    timerDisplay.textContent = `${pad(minutes)}:${pad(remainingSeconds)}`;
	}, 1000);
}

function resetTime(){
	const timerDisplay = document.getElementById("game-timer");
	clearInterval(timerInterval);
	timerInterval = null;
	seconds = 0;
	timerDisplay.textContent = `00:00`;
}

function pauseGame() {
	let textButton = document.getElementById("pause-game");
	
	if (state == 'pause'){
		textButton.textContent = "Pause";
		startAnimation();
	}else if (state == 'playing'){
		textButton.textContent = "Resume";
		stopAnimation();
	}
}

function quitGame() {
	if (state == 'playing'){
		stopAnimation();
		Swal.fire({
			confirmButtonColor: '#32B974',
			title: "Are you sure ?",
			showDenyButton: true,
			showCancelButton: false,
			confirmButtonText: "Yes",
			denyButtonText: `No`
	  	}).then((result) => {
			if (result.isConfirmed) {
				deleteMatch();
				initPlayPage();
				return;
			}else if (result.isDenied){
				document.getElementById("pause-game").textContent = "Pause";
				startAnimation();
			}
		});
	}
}

function playAI(){
	
	function viewGame(){
		let xp = canvas.width;
		// Calcular la posición anticipada de la bola
		const t = (xp - stateBall.x) / stateBall.vx;
		let yp = stateBall.y + t * stateBall.vy;
		if (yp < 0){
			yp = 0;
		}else if (yp > canvas.height){
			yp = canvas.height;
		}
		return yp;
	}
	
	if (stateBall.vx > 0) {
		let yp = stateBall.y;
		setInterval(() => {
			yp = viewGame();
		}, 1000);
		
	    let event;
	    // Simular eventos de teclado para mover la pala
    	if (yp < statePaddles.y2) {
        	event = new KeyboardEvent('keydown', { key: 'A' });
			document.dispatchEvent(event);
    	} else if (yp > statePaddles.y2 + stateGame.playerHeight) {
        	event = new KeyboardEvent('keydown', { key: 'D' });
			document.dispatchEvent(event);
    	}
	}
}

function initAnimation(){

	const centerX = canvas.width / 2;
	const centerY = canvas.height / 2;
	let timeLeft = 3;
	const fx = canvas.width;
	const fy = canvas.height;

	state =  'countdown';
	countdownInterval = setInterval(() => {
		
		ctx.fillStyle = '#000';
		ctx.fillRect(0, 0, canvas.width, canvas.height); //Borra todo
		drawBorders();
		ctx.fillStyle = '#FFF';
		ctx.fillRect(statePaddles.x1 * fx, statePaddles.y1 * fy, stateGame.playerWidth * fx, stateGame.playerHeight * fy); //Dibuja la paleta 1
		ctx.fillRect(statePaddles.x2 * fx, statePaddles.y2 * fy, stateGame.playerWidth * fx, stateGame.playerHeight * fy); //Dibuja la paleta 2	

		// Calculate minutes and seconds
		const seconds = timeLeft % 60;
		const displayTime = `${seconds}`;

		// Set font size relative to canvas size
		const fontSize = Math.min(canvas.width, canvas.height) / 3;
		ctx.strokeStyle = '#FFF';
		ctx.font = `${fontSize}px Arial` ;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		// Draw the countdown text
		ctx.fillStyle = '#FFF';
		ctx.fillText(displayTime, centerX, centerY);

		// Draw the circle
		ctx.beginPath();
		const radius = Math.min(canvas.width, canvas.height) / 2.5;
		ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
		ctx.strokeStyle = '#FFF';
		ctx.lineWidth = 10;
		ctx.setLineDash([]);
		ctx.stroke();

		// Update the time left
		timeLeft--;

		// Stop the countdown when it reaches zero
		if (timeLeft < 0) {
			drawPong();
			clearInterval(countdownInterval);
			countdownInterval = null;
			startAnimation();
		}
	}, 1000);
}

function startAnimation(){
	state = 'playing';
	startTimer();
	if (!ballInterval)
		ballInterval = setInterval(moveBall, refreshTime);
	if (modality == 'solo' && !aiInterval){
		aiInterval = setInterval(playAI, refreshTime);
	}
}

function stopAnimation(){
	state = 'pause';
	clearInterval(ballInterval);
	ballInterval = null;
	clearInterval(timerInterval);
	timerInterval = null;
	if (modality == 'solo'){
		clearInterval(aiInterval);
		aiInterval = null;
	}
}

function gameOver(){
	let texto;
	if (statePaddles.score1 >= stateGame.finalScore)
		texto = stateGame.name1;
	else 
		texto = stateGame.name2;
	saveMatch();
	deleteMatch();
	Swal.fire({
		title: texto + " WINS",
		confirmButtonColor: '#32B974',
	}).then((result) => {	
		if (result.isConfirmed){
			if (id == 0){ //Pedir volver a jugar si no es un torneo
				Swal.fire({
					confirmButtonColor: '#32B974',
					title: "Play again ?",
					showDenyButton: true,
					showCancelButton: false,
					confirmButtonText: "Yes",
					denyButtonText: `No`
			  	}).then((result) => {
					if (result.isConfirmed) {
						startPongLocal();
					}else if (result.isDenied){
						initPlayPage();
				}});
			}else{
				initPlayPage();
			}
		}
	})
}

function drawPong(){
	const fx = canvas.width;
	const fy = canvas.height;

	ctx.fillStyle = '#000';
	ctx.fillRect(0, 0, canvas.width, canvas.height); //Borra todo
	drawBorders();
	drawNet();
	ctx.fillStyle = '#FFF';
	ctx.fillRect(statePaddles.x1 * fx, statePaddles.y1 * fy, stateGame.playerWidth * fx, stateGame.playerHeight * fy); //Dibuja la paleta 1
	ctx.fillRect(statePaddles.x2 * fx, statePaddles.y2 * fy, stateGame.playerWidth * fx, stateGame.playerHeight * fy); //Dibuja la paleta 2
	ctx.fillRect(stateBall.x * fx, stateBall.y * fy, stateGame.ballWidth * fy, stateGame.ballHeight * fy);// Dibuja la bola
}

function drawPaddles(newPaddles){
	const fx = canvas.width;
	const fy = canvas.height;

	ctx.fillStyle = '#000';
	ctx.fillRect(statePaddles.x1 * fx - 1, statePaddles.y1 * fy - 1, stateGame.playerWidth * fx + 2, stateGame.playerHeight * fy + 2); //Borra la paleta 1
	ctx.fillRect(statePaddles.x2 * fx - 1, statePaddles.y2 * fy - 1, stateGame.playerWidth * fx + 2, stateGame.playerHeight * fy + 2); //Borra la paleta 2

	statePaddles = newPaddles;

	ctx.fillStyle = '#FFF';
	ctx.fillRect(statePaddles.x1 * fx, statePaddles.y1 * fy, stateGame.playerWidth * fx, stateGame.playerHeight * fy); //Dibuja la paleta 1
	ctx.fillRect(statePaddles.x2 * fx, statePaddles.y2 * fy, stateGame.playerWidth * fx, stateGame.playerHeight * fy); //Dibuja la paleta 2	
}

function drawBall(newBall){
	const fx = canvas.width;
	const fy = canvas.height;

	ctx.fillStyle = '#000';
	ctx.fillRect(stateBall.x * fx - 1, stateBall.y * fy - 1, stateGame.ballWidth * fy + 2, stateGame.ballHeight * fy + 2); //Borra la bola
	
	stateBall = newBall; //Obtiene la nueva posición de la bola
	
	ctx.fillStyle = '#FFF';
	drawNet();
	drawBorders();
	ctx.fillRect(statePaddles.x1 * fx, statePaddles.y1 * fy, stateGame.playerWidth * fx, stateGame.playerHeight * fy); //Dibuja la paleta 1
	ctx.fillRect(statePaddles.x2 * fx, statePaddles.y2 * fy, stateGame.playerWidth * fx, stateGame.playerHeight * fy); //Dibuja la paleta 2	
	ctx.fillRect(stateBall.x * fx, stateBall.y * fy, stateGame.ballWidth * fy, stateGame.ballHeight * fy);// Dibuja la bola
}

function drawScores(newScore1, newScore2){
	statePaddles.score1 = newScore1;
	statePaddles.score2 = newScore2;
	document.getElementById('game-score').innerHTML =
		`${stateGame.name1} ${statePaddles.score1} - ${statePaddles.score2} ${stateGame.name2}`;
}

function drawBorders(){
	const w = 0.005 * canvas.height;

	ctx.fillStyle = '#FFF';
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

function drawNet(){
	const w = 0.01 * canvas.width;

	ctx.strokeStyle = '#FFF';
	ctx.lineWidth = w;
	ctx.beginPath();
	ctx.moveTo(canvas.width / 2, w);
	ctx.lineTo(canvas.width / 2, canvas.height);
	ctx.setLineDash([0.1 * canvas.height, 0.02 * canvas.height]);
	ctx.stroke();
}

/***************** CONNECTING WITH API ********************/
/** Por defecto, la función fetch utiliza el método GET  **/


async function  startPongLocal(){	
	const apiUrl = `/api/match/new?id_match=${id}&name1=${name1}&name2=${name2}`;
	try{
		const response = await fetch(apiUrl);
		if (response.ok){
			const responsedata = await response.json();
			id = responsedata.id;
			stateGame = responsedata.game;
			stateBall = responsedata.ball;
			statePaddles = responsedata.paddles;
			drawScores(0, 0);
			resetTime();
			if (!countdownInterval) initAnimation();
		}
	} catch (error) {
		console.error('Error initializing game:', error);
	}
}

async function deleteMatch(){
	const apiUrl = `/api/match/delete?id_match=${id}`;
	try{
		const response = await fetch(apiUrl, {
			method: 'DELETE'
		});
		if (response.ok){
			const responsedata = await response.json();
			console.log(responsedata.msg);
		}
	} catch (error) {
		console.error('Error deleting match:', error);
	}
}

async function saveMatch(){
	const apiUrl = `/api/match/save?id_match=${id}&id_tournament=${id_tournament}`;
	try{
		const response = await fetch(apiUrl);
		if (response.ok){
			const responsedata = await response.json();
			console.log(responsedata.msg);
		}
	} catch (error) {
		console.error('Error saving match:', error);
	}
}

async function resetBall(){
	const apiUrl = `/api/game/reset?id_match=${id}`;
	try{
		const response = await fetch(apiUrl);
		if (response.ok){
			const responsedata = await response.json();
			drawBall(responsedata.ball);
		}
	} catch (error) {
		console.error('Error reseting ball:', error);
	}
}

async function handleKeyDown(e) {
    let pressed = e.key;
	if (e.ctrlKey && pressed == 'v'){
		pressed = 'VelocityUp';
	}
	if (e.ctrlKey && pressed == 'c'){
		pressed = 'VelocityDown';
	}
	if (state != 'pause' && (pressed == 'ArrowUp' || pressed == 'ArrowDown' ||
       (modality == "local" && (pressed == "w" || pressed == "W" || pressed == "s" || pressed == "S")) ||
       (modality == "solo"  && (pressed == "A" || pressed == "D")) ||
	    pressed == 'VelocityUp' || pressed == 'VelocityDown')){
			const apiUrl = `/api/game/paddles?id_match=${id}&key=${pressed}`;
			try {
				const response = await fetch(apiUrl);
				if (response.ok){
					const responsedata = await response.json();
					drawPaddles(responsedata.paddles);
				}
			} catch (error) {
				console.error('Error moving paddles:', error);
			}
	}
}

async function moveBall() {
	const apiUrl = `/api/game/ball?id_match=${id}`;
	try{
		const response = await fetch(apiUrl);
		if (response.ok){
			const responsedata = await response.json();
			if (responsedata.msg == "scored"){
				console.log("Scored");
				stopAnimation();
				drawScores(responsedata.score1, responsedata.score2);
				resetBall();
				if (!countdownInterval) initAnimation();
			}
			else if (responsedata.msg == "gameover"){
				console.log("Game Over");
				stopAnimation();
				drawScores(responsedata.score1, responsedata.score2);
				gameOver();
			}
			else if (responsedata.msg == "playing")
				console.log("Playing");
				drawBall(responsedata.ball);
		}
	} catch (error) {
		console.error('Error moving ball:', error);
	}
}

function stopCountDown(){
	clearInterval(countdownInterval);
	countdownInterval = null;
}

export {stopAnimation, startGameLocal, stopCountDown }