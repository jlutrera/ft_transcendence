/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   navbar.js                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jutrera- <jutrera-@student.42madrid.com    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/04/10 17:23:01 by adpachec          #+#    #+#             */
/*   Updated: 2024/07/11 11:45:13 by jutrera-         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { isLoggedIn }from './auth.js';
import router from './main.js';

async function loadUser() {
    const apiUrl = '/api/users';
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
		return user;
    } catch (error) {
        console.error('Error loading profile:', error);
		router.route("/error");
		return null;
    }
}

async function updateNavbar()
{
	const navBarDiv = document.getElementById('login-navbar');

	if (isLoggedIn())
	{
		const user = await loadUser();
		navBarDiv.innerHTML = `
			<div class="user-info" id="user-info">
				<a class="nav-link dropdown-toggle" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
					<img src="${user.profilePicture}" id="user-avatar" class="rounded-circle" alt="User Avatar">
					<span id="username">${user.username}</span>
				</a>
				<ul class="dropdown-menu" aria-labelledby="navbarDropdown">
					<li><a class="dropdown-item" data-route="/edit-profile">Edit Profile</a></li>
					<li><hr class="dropdown-divider"></li>
					<li><a class="dropdown-item" id="link-logout">Log out</a></li>
				</ul>
			</div>
			<div id="tournament-nav-items" style="display: none;">
				
			</div>
		`;
	}
	else
	{
		navBarDiv.innerHTML = `
			<a class="btn btn-outline-success me-2" data-route="/login">Log in</a>
			<a class="btn btn-outline-danger" data-route="/register">Register</a>
			<div id="tournament-nav-items" style="display: none;">
				
			</div>
		`;
	}
}

export default updateNavbar;