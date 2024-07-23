/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   register.js                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jutrera- <jutrera-@student.42madrid.com    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/04/08 12:22:20 by adpachec          #+#    #+#             */
/*   Updated: 2024/07/11 11:33:09 by jutrera-         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import router from './main.js';

function setupRegisterForm()
{
    document.getElementById('main-content').innerHTML = `
        <div class="register-container">
            <h2>Create Your Account</h2>
            <form id="register-form" class="register-form">
                <input type="text" id="register-username" placeholder="Username" required>
                <input type="password" id="register-password" placeholder="Password" required>
                <button type="submit" class="btn btn-primary">Register</button>
            </form>
            <div id="error-message" display: none;"></div>
            <div class="text" id="register-msg"> </div>
        </div>
    `;
    
    const registerForm = document.getElementById('register-form');
    registerForm.addEventListener('submit', handleRegisterSubmit);
}

async function handleRegisterSubmit(event) {
    event.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    
    const errorMessage = validateInputs(username, password);
    if (errorMessage) {
        displayError(errorMessage);
        return;
    }

    const userData = {
        username: username,
        password: password,
        profilePicture: "/api/static/avatars/default.jpg",
    };

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        if (response.ok) {
            const data = await response.json();
            console.log('Registration successful for', username);
            const registerMsg = document.getElementById('register-msg');
            if (registerMsg) {
                registerMsg.innerText = username + ' has been succesfully register!!';
            }
            setTimeout(() => {
                router.route('/home');
            }, 2500);
        } else {
            const errorData = await response.json();
            displayError(errorData.message || 'Failed to register. Please try again.');
        }
    } catch (error) {
        console.error('An error occurred during registration:', error);
        displayError('An error occurred during registration. Please try again.');
    }
}

function validateInputs(username, password)
{
    if (username.length < 2)
	{
        return 'Your username must be at least 2 characters long.';
    }

    if (password.length < 4)
	{
        return 'Your password must be at least 4 characters long.';
    }
	
    return null;
}

function displayError(message)
{
    document.getElementById('error-message').innerHTML = ` 
		${message}
	`;
    document.getElementById('error-message').style.display = 'block';
}

export default setupRegisterForm;