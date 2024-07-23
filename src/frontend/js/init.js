/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   init.js                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: jutrera- <jutrera-@student.42madrid.com    +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/04/08 13:02:06 by adpachec          #+#    #+#             */
/*   Updated: 2024/07/11 11:49:41 by jutrera-         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { stopAnimation, stopCountDown } from "./pongLocal.js";
import {closeSocket } from "./pongRemote.js";

function loadInitialContent()
{
	stopAnimation();
	stopCountDown();
	closeSocket();
    document.getElementById('main-content').innerHTML = `
	
	<div class="hero-section">
		<div class="hero-text-container">
			<h1>Welcome to Transcendence</h1>
			<p>The return of the iconic game that will end everything</p>
			<a data-route="/play" id="play-now" class="btn btn-primary btn-lg">PLAY NOW</a>
		</div>
	</div>

	
	<div class="partners-section container my-5">
		<hr> <!-- Línea divisoria -->
		<h2>Collaborators</h2>
		<div class="row">
			<div class="col-md-3 mb-3">
				<div class="card">
					<img src="./images/client_logo/client_logo_1.png" class="card-img-top" alt="Colaborador 1">
				</div>
			</div>
			<div class="col-md-3 mb-3">
				<div class="card">
					<img src="./images/client_logo/client_logo_2.png" class="card-img-top" alt="Colaborador 2">
				</div>
			</div>
			<div class="col-md-3 mb-3">
				<div class="card">
					<img src="./images/client_logo/client_logo_3.png" class="card-img-top" alt="Colaborador 2">
				</div>
			</div><div class="col-md-3 mb-3">
				<div class="card">
					<img src="./images/client_logo/client_logo_4.png" class="card-img-top" alt="Colaborador 2">
				</div>
			</div>
		</div>
	</div>	
    `;
}

export default loadInitialContent;