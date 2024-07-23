/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   play.js                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: alaparic <alaparic@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/04/08 11:49:24 by adpachec          #+#    #+#             */
/*   Updated: 2024/07/13 14:10:02 by alaparic         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { startGameLocal, stopAnimation, stopCountDown } from "./pongLocal.js";
import { startGameRemote, closeSocket } from "./pongRemote.js";

let selectedMatchID = null;
let mode = null;
let id_tournament = 0;

function initPlayPage() {
	stopAnimation();
	stopCountDown();
	closeSocket();
	renderGameOptions();
	attachEventListeners();
}

function renderGameOptions() {
	const mainContent = document.getElementById("main-content");
	mainContent.innerHTML = `
        <div class="play-wrapper">
            <div class="play-options-container text-center mt-5">
                <h1 class="play-title mb-4">Elige tu Modo de Juego</h1>
                <div class="play-btn-group">
                    <button id="solo-vs-ai" class="play-btn play-btn-primary">Solo vs AI</button>
                    <button id="local-vs-human" class="play-btn play-btn-light">Local vs Human</button>
                    <button id="remote-vs-human" class="play-btn play-btn-success">Remote vs Human</button>
                </div>
            </div>
        </div>
    `;
}

function attachEventListeners() {
	document.getElementById("solo-vs-ai").addEventListener("click", () => {
		mode = "solo";
		startGameLocal(mode, null, 0, id_tournament);
	});
	document.getElementById("local-vs-human").addEventListener("click", () => {
		mode = "local";
		showMatchTypeOptions();
	});
	document.getElementById("remote-vs-human").addEventListener("click", () => {
		mode = "remote";
		showMatchTypeOptions();
	});
}

function showMatchTypeOptions() {
	const mainContent = document.getElementById("main-content");
	mainContent.innerHTML = `
        <div class="play-wrapper">
            <div class="play-title">Select Match Type</div>
            <div class="play-btn-group">
                <button id="normal-match" class="play-btn play-btn-primary">Normal Match</button>
                <button id="tournament-match" class="play-btn play-btn-success">Tournament Match</button>
            </div>
        </div>
    `;
	if (mode == "local") {
		document
			.getElementById("normal-match")
			.addEventListener("click", () => loadLogin(null));
	} else {
		document
			.getElementById("normal-match")
			.addEventListener("click", () => startGameRemote(0, id_tournament));
	}
	document
		.getElementById("tournament-match")
		.addEventListener("click", handleLocalVsHumanClick);
}

async function handleLocalVsHumanClick() {
	const apiUrl = "/api/tournaments/user/matches";

	const requestOptions = {
		method: "GET",
		headers: { "Content-Type": "application/json" },
		credentials: "include",
	};

	try {
		const response = await fetch(apiUrl, requestOptions);
		if (response.ok) {
			const matches = await response.json();
			showMatchOptions(matches);
		} else {
			showNotification(
				"Error fetching matches. Please try again later.",
				false
			);
		}
	} catch (error) {
		showNotification(
			"Error fetching matches. Please try again later.",
			false
		);
	}
}

function showMatchOptions(matches) {
	const mainContent = document.getElementById("main-content");
	mainContent.innerHTML = `
        <div class="play-wrapper">
            <div class="play-title">Select a Match</div>
            <ul id="match-list" class="match-list">
                ${matches
					.map(
						(match) => `
                    <li class="match-item">
                        <div class="match-header">
                            <div class="tournament-name">${match.tournamentName}</div>
                        </div>
                        <div class="match-details">
                            <span class="match-info">${match.player1_username} vs ${match.player2_username}</span>
                            <button class="play-btn play-btn-primary select-match-btn" data-match-id="${match.matchID}" data-user2-match="${match.player2_username}"data-tournament-id="${match.tournamentID}">Select</button>
                        </div>
                    </li>
                `
					)
					.join("")}
            </ul>
        </div>
    `;

	const matchButtons = document.querySelectorAll(".select-match-btn");
	matchButtons.forEach((button) => {
		button.addEventListener("click", (event) => {
			selectedMatchID = event.target.getAttribute("data-match-id");
			id_tournament = event.target.getAttribute("data-tournament-id");
			if (mode === "local") {
				const user2Match =
					event.target.getAttribute("data-user2-match");
				loadLogin(user2Match);
			} else {
				startGameRemote(selectedMatchID, id_tournament);
			}
		});
	});
}

function loadLogin(user2Match) {
	// Verificar si la superposición ya existe
	if (document.querySelector(".login-overlay")) {
		document.querySelector(".login-overlay").remove();
	}

	if (!user2Match) user2Match = "Name";

	const loginOverlay = document.createElement("div");
	loginOverlay.className = "login-overlay";
	loginOverlay.innerHTML = `
        <div class="wrapper">
            <div class="flip-card__inner">
                <div class="flip-card__front">
                    <button class="close-btn" id="close-login-overlay">X</button>
                    <div class="title">Log in</div>
                    <form action="" class="flip-card__form" id="login-form">
                        <input type="text" id="userName" class="flip-card__input" value="${user2Match}">
                        <input type="password" placeholder="Password" id="password" class="flip-card__input">
                        <button type="submit" class="flip-card__btn" id="login-btn">Start Game!</button>
                        <div class="text" id="login-msg"> </div>
                    </form>
                </div>
            </div>   
        </div>
    `;
	document.body.appendChild(loginOverlay);

	const closeBtn = document.getElementById("close-login-overlay");
	closeBtn.addEventListener("click", () => {
		document.querySelector(".login-overlay").remove();
	});

	const loginForm = document.getElementById("login-form");
	loginForm.addEventListener("submit", handleLoginSubmit);
}

async function handleLoginSubmit(event) {
	event.preventDefault();
	let player2_name = document.getElementById("userName").value;

	const apiUrl = "/api/auth/login/local_match";
	const requestBody = {
		player2_username: player2_name,
		player2_password: document.getElementById("password").value,
		matchID: selectedMatchID ? selectedMatchID : -1, //-1 for normal match and it is created in the backend
	};

	const requestOptions = {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(requestBody),
		credentials: "include",
	};

	try {
		const response = await fetch(apiUrl, requestOptions);

		if (response.ok) {
			const data = await response.json();
			document.querySelector(".login-overlay").remove();
			startGameLocal(
				"local",
				player2_name,
				selectedMatchID,
				id_tournament
			);
		} else {
			const errorData = await response.json();
			document.getElementById(
				"login-msg"
			).textContent = `Error: ${errorData.message}`;
		}
	} catch (error) {
		document.getElementById("login-msg").textContent =
			"Error logging in. Please try again later.";
	}
}

function showNotification(message, isSuccess = true) {
	let notification = document.getElementById("notification");
	if (notification) {
		notification.remove();
	}
	notification = document.createElement("div");
	notification.id = "notification";
	notification.textContent = message;
	notification.className = `notification ${isSuccess ? true : false}`;

	document.body.appendChild(notification);
	notification.classList.add("show");
	setTimeout(() => {
		notification.classList.remove("show");
		setTimeout(() => {
			notification.remove();
		}, 500);
	}, 5000);
}

export default initPlayPage;
