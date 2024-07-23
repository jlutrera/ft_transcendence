/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   tournamentDetails.js                               :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jutrera- <jutrera-@student.42madrid.com    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/04/16 18:11:12 by adpachec          #+#    #+#             */
/*   Updated: 2024/07/11 11:34:09 by jutrera-         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

async function fetchTournamentById(id) {
    const apiUrl = `/api/tournaments/${id}`;
    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const tournament = await response.json();
        return tournament;
    } catch (error) {
        console.error('Error fetching tournament:', error);
        return null;
    }
}

let tournament = null;

async function loadTournamentDetails(id) {

    
    try {
        tournament = await fetchTournamentById(id);
    } catch (error) {
        console.error('Error loading tournament:', error);
    }

    const matches = Array.isArray(tournament.matches) ? tournament.matches : [];

    const previousMatches = matches.filter(match => match.played);
    const upcomingMatches = matches.filter(match => !match.played);

    const standings = tournament.standings.map(player => ({
        ...player,
        games_played: Number(player.games_played),
        games_won: Number(player.games_won),
        games_lost: Number(player.games_lost),
        points_for: Number(player.points_for),
        points_against: Number(player.points_against),
    }));

    const sortedStandings = standings.sort((a, b) => {
        if (b.games_won !== a.games_won) {
            return b.games_won - a.games_won;
        }
        return b.points_for - a.points_for;
    });

    const tournamentDetailsHTML = `
    <div class="container mt-5 tournament-details-container">
        <h1 class="text-center mb-3 tournament-header">${tournament.name}</h1>
        <div class="d-flex justify-content-center my-4">
            ${tournament.status !== 'In Progress' ? `<button class="button join-tournament-btn2 mx-2" data-id="${tournament.id}">Join Tournament</button>` : ''}
            <button class="button leave-tournament-btn2 mx-2" data-id="${tournament.id}">Leave Tournament</button>
        </div>
        <div class="row">
            <div class="col-lg-5">
                <div class="card custom-card mb-4">
                    <div class="card-header custom-card-header">Previous Results</div>
                    <ul class="custom-list-group">
                        ${previousMatches.length > 0 ? `
                            ${previousMatches.map(match => `
                                <li class="list-group-item custom-list-item">
                                    <span class="match-title">${match.player1_username} vs ${match.player2_username}</span>
                                    <span class="match-result">${match.player1_points} - ${match.player2_points}</span>
                                </li>
                            `).join('')}
                        ` : '<li class="list-group-item custom-list-item">No previous matches</li>'}
                    </ul>
                </div>
                <div class="card custom-card mb-4">
                    <div class="card-header custom-card-header">Upcoming Matches</div>
                    <ul class="custom-list-group">
                        ${upcomingMatches.length > 0 ? `
                            ${upcomingMatches.map(match => `
                                <li class="list-group-item custom-list-item">
                                    <span class="match-title">${match.player1_username} vs ${match.player2_username}</span>
                                </li>
                            `).join('')}
                        ` : '<li class="list-group-item custom-list-item">No upcoming matches</li>'}
                    </ul>
                </div>
            </div>
            <div class="col-md-12 col-lg-7">
                <div class="card custom-card">
                    <div class="card-header custom-card-header">Standings</div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-light table-hover table-striped custom-table">
                                <thead>
                                    <tr>
                                        <th>Player</th>
                                        <th>Games Played</th>
                                        <th>Games Won</th>
                                        <th>Games Lost</th>
                                        <th>Points For</th>
                                        <th>Points Against</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${sortedStandings.length > 0 ? `
                                    ${sortedStandings.map(player => `
                                        <tr>
                                            <td>${player.username}</td>
                                            <td>${player.games_played}</td>
                                            <td>${player.games_won}</td>
                                            <td>${player.games_lost}</td>
                                            <td>${player.points_for}</td>
                                            <td>${player.points_against}</td>
                                        </tr>
                                    `).join('')}
                                ` : '<tr><td colspan="6">No standings available</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
    document.getElementById('main-content').innerHTML = tournamentDetailsHTML;
    attachEventListenersForTournamentDetails();
}

function attachEventListenersForTournamentDetails() {
    
    document.querySelector('.leave-tournament-btn2').addEventListener('click', function(e) {
        const tournamentId = e.target.getAttribute('data-id');
        leaveTournament(tournamentId);
    });
    
    if (tournament.status !== 'In Progress' && tournament.status !== 'Ended')
    {
        document.querySelector('.join-tournament-btn2').addEventListener('click', function(e) {
            const tournamentId = e.target.getAttribute('data-id');
            joinTournament(tournamentId);
        });
    }
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
                showNotification(data.msg, true);
                loadTournamentDetails(tournamentId);
            } else if (response.status === 400) {
                const errorData = await response.json();
                showNotification(`Error: ${errorData.error_msg}`, false);
            } else {
                showNotification('Unexpected error occurred. Please try again later.', false);
            }
        } catch (error) {
            showNotification('Error joining tournament. Please try again later.', false);
        }
    } else {
        showNotification('Please log in to join a tournament.', false);
    }
}

async function leaveTournament(tournamentId) {
    const username = localStorage.getItem('userToken');
    if (username) {
        const apiUrl = `/api/tournaments/${tournamentId}/leave`;
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
                showNotification(data.msg, true);
                loadTournamentDetails(tournamentId);
            } else if (response.status === 400) {
                const errorData = await response.json();
                showNotification(`Error: ${errorData.error_msg}`, false);
            } else {
                showNotification('Unexpected error occurred. Please try again later.', false);
            }
        } catch (error) {
            showNotification('Error leaving tournament. Please try again later.', false);
        }
    } else {
        showNotification('Please log in to leave a tournament.', false);
    }
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

export default loadTournamentDetails;