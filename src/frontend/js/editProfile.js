/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   editProfile.js                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: alaparic <alaparic@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/04/27 13:04:35 by adpachec          #+#    #+#             */
/*   Updated: 2024/07/13 14:09:32 by alaparic         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { isLoggedIn } from './auth.js';
import router from './main.js';
import updateNavbar from './navbar.js';
import { stopAnimation, stopCountDown } from "./pongLocal.js";
import { closeSocket } from "./pongRemote.js";

async function loadEditProfile() {
    if (!isLoggedIn()) {
        localStorage.setItem('loginRedirect', 'true');
        router.route('/login');
        return;
    }
	stopAnimation();
	stopCountDown();
	closeSocket();
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
        loadHtmlEditProfile(user);
    } catch (error) {
        console.error('Error loading profile:', error);
        router.route("/error");
    }
}
function loadHtmlEditProfile(currentUser) {
	const editProfileHTML = `
	  <div class="container mt-5">
		<div class="row">
		  <div class="col-md-6 offset-md-3">
			<div class="card">
			  <div class="card-header">
				Edit Profile
			  </div>
			  <div class="card-body">
				<form id="edit-profile-form">
				  <div class="form-group">
					<label for="profile-name">Name</label>
					<input type="text" class="form-control" id="profile-name" value="${currentUser.username}" required>
					<label for="profile-name">Password</label>
					<input type="password" class="form-control" id="profile-password" value="" required>
				  </div>
				  <div class="form-group" id="picture-group">
					<label for="profile-picture">Profile Picture URL</label>
					<input type="file" class="form-control-file" id="profile-picture-upload" accept="image/*">
					<img id="profile-picture-preview" src="${currentUser.profilePicture}" alt="Profile Picture Preview" class="img-thumbnail" style="margin-top: 10px; max-width: 200px;">
				  </div>
				  <div class="button-container">
					<button type="button" class="btn btn-secondary" id="upload-picture"><span>Upload<br>Picture</span></button>
					<button type="button" class="btn btn-primary" id="save-profile">Save</button>
				  </div>
				</form>
			  </div>
			</div>
		  </div>
		</div>
	  </div>
	`;
  
	// Se inserta el HTML en el contenedor principal de la SPA.
	document.getElementById('main-content').innerHTML = editProfileHTML;
	addEditProfileEventListeners();
  }
  
  function addEditProfileEventListeners() {
	document.getElementById('save-profile').addEventListener('click', function() {
	  let password = document.getElementById('profile-password').value;
	  if (!password)
			password = "pass123";
	  const username = document.getElementById('profile-name').value;
	  updateUserProfile(username, password);
	});

	document.getElementById('profile-picture-upload').addEventListener('change', function() {
		const file = this.files[0];
		if (file) {
		  const reader = new FileReader();
		  reader.onload = function(e) {
			const preview = document.getElementById('profile-picture-preview');
			preview.src = e.target.result;
			preview.alt = 'Selected Profile Picture';
		  };
		  reader.readAsDataURL(file);
		}
	  });
	  
	  document.getElementById('upload-picture').addEventListener('click', function() {
		const fileInput = document.getElementById('profile-picture-upload');
		const file = fileInput.files[0];
	
		if (!file) {
			showNotification("Please select a photo first!!", "error");
			return;
		}
	
		const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
		const maxSize = 5 * 1024 * 1024;
	
		if (!validTypes.includes(file.type)) {
			showNotification("Invalid file type. Please upload an image (JPEG, PNG, GIF).", "error");
			return;
		}
	
		if (file.size > maxSize) {
			showNotification("File is too large. Please upload an image smaller than 5MB.", "error");
			return;
		}
	
		updateUserAvatar(file);
	});
  }
  
  function updateUserAvatar(file) {
    const apiUrl = '/api/users/avatar';
    const formData = new FormData();
    formData.append('file', file);

    const requestOptions = {
        method: 'POST',  
        body: formData,
		    credentials: 'include'
    };

    fetch(apiUrl, requestOptions)
        .then(response => {
            if (!response.ok) {
				showNotification('Network response was not ok.', "error");
                return;
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            console.log('Success:', data);
            showNotification("Photo uploaded successfully.", "success");
            updateNavbar();
        })
        .catch((error) => {
            console.error('Error:', error);
            showNotification("Error uploading photo: " + error.message, "error");
        });
}

async function updateUserProfile(newUsername, newPassword) {
  const apiUrl = '/api/users/update';
  const requestBody = {
      username: newUsername,
      password: newPassword,
  };

  const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      credentials: 'include'
  };

  try {
      const response = await fetch(apiUrl, requestOptions);

      if (response.ok) {
          const data = await response.json();
          showNotification('Profile updated successfully.', "success");
          updateNavbar();
      } else if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(`Error: ${errorData.error_msg}`);
      } else {
          throw new Error('Unexpected error occurred. Please try again later.');
      }
  } catch (error) {
      showNotification(error.message, "error");
  }
}

function showNotification(message, type) {
    let notification = document.getElementById('notification');
    if (notification) {
        notification.remove();
    }
    notification = document.createElement('div');
    notification.id = 'notification';
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    notification.classList.remove('success-msg', 'error-msg');
    if (type === 'success') {
        notification.classList.add('success-msg');
    } else if (type === 'error') {
        notification.classList.add('error-msg');
    }

    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 4000);
}  

export default loadEditProfile;