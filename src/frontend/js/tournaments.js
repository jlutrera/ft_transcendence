/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   tournaments.js                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jutrera- <jutrera-@student.42madrid.com    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/04/08 11:49:29 by adpachec          #+#    #+#             */
/*   Updated: 2024/07/11 11:35:34 by jutrera-         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { isLoggedIn } from "./auth.js";
import router from "./main.js"
import { stopAnimation, stopCountDown } from "./pongLocal.js";
import { closeSocket } from "./pongRemote.js";

async function fetchTournaments() {
    const apiUrl = '/api/tournaments';
    return fetch(apiUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
    })
        .then(response => {
            if (!response.ok) {
                showNotification('Network response was not ok', false);
            }
            return response.json();
        })
        .catch(error => {
            console.error('Error fetching tournaments:', error);
            showNotification('Error fetching tournaments:' + error, false);
            return [];
        });
}

async function loadTournaments() {
	stopAnimation();
	stopCountDown();
	closeSocket();
    try {
        const tournaments = await fetchTournaments();
        updateTournamentHTML(tournaments);
    } catch (error) {
        console.error('Error loading tournaments:', error);
        showNotification('Error loading tournaments:' + error, false);
    }
}

function updateTournamentHTML(tournaments) {
    const tournamentsHTML = viewTournaments(tournaments);
    const html = `
        <div class="tournament-container">
            <h1 class="tournament-title">Tournaments</h1>
            <div class="btn-group" role="group" aria-label="Tournament Actions">
                <button class="button" id="createTournamentBtn">Create Tournament</button>
            </div>
            <div id="tournament-list" class="tournament-list">${tournamentsHTML}</div>
        </div>
    `;
    document.getElementById('main-content').innerHTML = html;
    attachEventListeners();
}

function attachEventListeners() {
    document.getElementById('createTournamentBtn').addEventListener('click', showCreateTournamentModal);

    const tournamentEntries = document.querySelectorAll('.tournament-entry');
    tournamentEntries.forEach(entry => {
        entry.querySelector('.tournament-name').addEventListener('click', function() {
            const details = entry.querySelector('.tournament-details');
            details.style.display = details.style.display === 'none' ? 'block' : 'none';
        });
    });

    document.addEventListener('click', handleDocumentClick);
}

function handleDocumentClick(e) {
    const viewBtn = e.target.closest('.view-tournament-btn');
    if (viewBtn) {
        e.preventDefault();
        const tournamentId = viewBtn.getAttribute('data-id');
        router.route(`/tournaments/${tournamentId}`);
    } else if (e.target.classList.contains('join-tournament-btn')) {
        e.preventDefault();
        const tournamentId = e.target.getAttribute('data-id');
        joinTournament(tournamentId);
    }
}

function viewTournaments(tournaments) {
    return tournaments.map(tournament => `
        <div class="tournament-entry">
            <h3 class="tournament-name">${tournament.name}</h3>
            <div class="tournament-details" style="display: none;">
                <p>Status: ${tournament.status}</p>
                <div class="participants-container">
                    <h4>Participants: ${tournament.number_participants}</h4>
                    <div class="participants-list">
                        ${tournament.participants.map(participant => `<span>${participant.username}</span>`).join('')}
                    </div>
                </div>
                <div class="button-div">
                    <button class="button view-tournament-btn" data-name="${tournament.name}" data-id="${tournament.id}">View Details</button>
                    ${tournament.status !== 'In Progress' ? `<button class="button join-tournament-btn" data-id="${tournament.id}">Join Tournament</button>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function showCreateTournamentModal() {
    const modal = document.getElementById('createTournamentModal');
    if (!isLoggedIn()) {
        localStorage.setItem('loginRedirect', 'true');
        router.route('/login');
        return ;
    }
    if (!modal) {
        createTournament();
    }
    document.getElementById('createTournamentModal').style.display = 'block';
}

function createTournament() {
    const formHTML = `
    <div id="createTournamentModal" class="modal">
        <div class="modal-content">
            <span class="close-button">×</span>
            <form id="createTournamentForm" class="tournament-form">
                <div class="form-group">
                    <label for="tournamentName">Tournament Name:</label>
                    <input type="text" id="tournamentName" name="tournamentName" required>
                </div>
                <div class="form-group">
                    <label for="numPlayers">Number of Players:</label>
                    <input type="number" id="numPlayers" name="numPlayers" required>
                </div>
                <button type="submit" class="button" id="create-tournament">Create Tournament</button>
            </form>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', formHTML);
    addModalEventListeners();
}
 
function addModalEventListeners() {
    document.querySelector('.close-button').addEventListener('click', function() {
        document.getElementById('createTournamentModal').style.display = 'none';
    });

    window.addEventListener('click', function(event) {
        if (event.target == document.getElementById('createTournamentModal')) {
            document.getElementById('createTournamentModal').style.display = 'none';
        }
    });

    document.getElementById('createTournamentForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const tournamentName = document.getElementById('tournamentName').value;
        const numPlayers = document.getElementById('numPlayers').value;
    
        if (tournamentName.length > 30) {
            showNotification('Error: Tournament name must be 30 characters or fewer.', false);
            return;
        }
    
        if (numPlayers > 20 || numPlayers <= 1) {
            showNotification('Error: Number of players must be 20 or fewer and more than 1', false);
            return;
        }
    
        document.getElementById('createTournamentModal').style.display = 'none';
        const requestBody = {
            name: tournamentName,
            number_participants: numPlayers,
        };
    
        const apiUrl = '/api/tournaments/create';
        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        })
        .then(response => {
            if (!response.ok) {
                showNotification('Network response was not ok', false);
            }
            return response.json();
        })
        .then(data => {
            console.log('Success:', data);
            showNotification('Tournament successfully created!');
            loadTournaments();
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error:' + error, false)
        });
    });
}

function showNotification(message, isSuccess = true) {
    let notification = document.getElementById('notification');
    if (notification) {
        notification.remove();
    }
    notification = document.createElement('div');
    notification.id = 'notification';
    notification.textContent = message;
    notification.className = `notification ${isSuccess ? 'success' : 'error'}`;   
    
    document.body.appendChild(notification);
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 5000);
}

async function joinTournament(tournamentId) {
    const username = localStorage.getItem('userToken');
    if (username) {
        console.log(`${username} logged in. Joining tournament with ID: ${tournamentId}`);

        const apiUrl = `/api/tournaments/${tournamentId}/join`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Join tournament successful:', data);
                showNotification(data.msg, true);
                loadTournaments(); // Carga la lista de torneos después de unirse.
            } else if (response.status === 400) {
                const errorData = await response.json();
                console.error('Error joining tournament:', errorData.error_msg);
                showNotification(`Error: ${errorData.error_msg}`, false);
            } else {
                console.error('Unexpected error:', response.status);
                showNotification('Unexpected error occurred. Please try again later.', false);
            }
        } catch (error) {
            console.error('Error joining tournament:', error);
            showNotification('Error joining tournament. Please try again later.', false);
        }
    } else {
        console.log('User not logged in. Please log in to join a tournament.');
        showNotification('Please log in to join a tournament.', false);
    }
}

document.removeEventListener('click', handleDocumentClick);
document.addEventListener('click', handleDocumentClick);

export { loadTournaments, createTournament, joinTournament, viewTournaments };
