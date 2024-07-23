/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   friendProfile.js                                   :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jutrera- <jutrera-@student.42madrid.com    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/05/14 10:20:30 by adpachec          #+#    #+#             */
/*   Updated: 2024/07/11 11:44:31 by jutrera-         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { isLoggedIn } from './auth.js';
import router from './main.js';

async function loadFriendProfile(id) {
    if (!isLoggedIn()) {
        localStorage.setItem('loginRedirect', 'true');
        router.route('/login');
        return ;
    }

	const apiUrl = `/api/users?user_id=${id}`;
    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
			headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const user = await response.json();
        updateProfileUI(user);
    } catch (error) {
        console.error('Error loading profile:', error);
		router.route("/error");
    }
}

function updateProfileUI(user) {
    const profileHTML = `
        <div class="profile-container">
            <div class="profile-header">
                <img src="${user.profilePicture}" class="profile-avatar" alt="Avatar del usuario">
                <h2 class="profile-username">${user.username}</h2>
            </div>
            <div class="profile-stats">
                <button class="stats-toggler">Stats</button>
                <div class="stats-content">
                    <p>Matches Played: ${user.matchesTotal}</p>
                    <p>Matches Won: ${user.matchesWon}</p>
                    <p>Matches Lost: ${user.matchesLost}</p>
                    <p>Points Scored: ${user.totalPoints}</p>
                    <p>Tournaments Played: ${user.tournamentsPlayed || 0}</p>
                    <p>Tournaments Won: ${user.tournamentsWon || 0}</p>
                </div>
            </div>
            <div class="profile-history">
                <button class="history-toggler">Match history</button>
                <div class="history-content" style="display: none;">
                    ${renderMatchHistory(user.matches)}
                </div>
            </div>
            <button class="friends-button" id="friends-button">Friends</button>
            <div class="friends-section" id="friends-section" style="display: none;">
                <div id="friends-list" class="friends-list">
                    ${renderFriendsList(user.friends)}
                </div>
            </div>
        </div>
    `;

    document.getElementById('main-content').innerHTML = profileHTML;
    addEventListeners();
    addFriendLinkListeners();
}

function renderMatchHistory(matches) {
    return `
        <table class="table table-dark table-striped">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Opponent</th>
                    <th>Result</th>
                    <th>Score</th>
                </tr>
            </thead>
            <tbody>
                ${matches.map(match => `
                    <tr>
                        <td>${match.date}</td>
                        <td>${match.opponent}</td>
                        <td class="${match.result ? 'win' : 'loss'}">${match.result ? 'Win' : 'Loss'}</td>
                        <td>${match.score}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderFriendsList(friends) {
    return friends.map(friend => `
        <div class="friend-entry">
            <a data-id="${friend.id}">
                <img src="${friend.profilePicture}" alt="${friend.name}'s Avatar" class="friend-avatar ${friend.online ? 'online' : 'offline'}">
                <span class="friend-username">${friend.name}</span>
            </a>
        </div>
    `).join('');
}

function addFriendLinkListeners() {
    const links = document.querySelectorAll('.friend-entry a');
    links.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const id = this.getAttribute('data-id');
            router.route(`/friend-profile/${id}`, id);
        });
    });
}

function addEventListeners() {
	document.querySelector('.stats-toggler').addEventListener('click', toggleStats);
	document.querySelector('.history-toggler').addEventListener('click', toggleHistory);
	document.getElementById('friends-button').addEventListener('click', toggleFriendSection);
}

function toggleStats() {
	const statsContent = document.querySelector('.stats-content');
	statsContent.style.display = statsContent.style.display === 'none' ? 'block' : 'none';
}

function toggleHistory() {
	const historyContent = document.querySelector('.history-content');
	historyContent.style.display = historyContent.style.display === 'none' ? 'block' : 'none';
}

function toggleFriendSection() {
	const section = document.getElementById('friends-section');
	section.style.display = section.style.display === 'none' ? 'block' : 'none';
}

export default loadFriendProfile;