/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   pageNotFound.js                                    :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: adpachec <adpachec@student.42madrid.com>   +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/04/08 11:56:12 by adpachec          #+#    #+#             */
/*   Updated: 2024/05/20 12:04:39 by adpachec         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

function loadPageNotFound() {
	document.getElementById('main-content').innerHTML = `
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Error 404 - Page Not Found</title>
		</head>
		<body>
			<div class="container">
				<h1>Error 404 - Page Not Found</h1>
				<p>Sorry, the page you are looking for might be in another castle.</p>
				<p><a href="/">Go back to the home page</a></p>
			</div>
		</body>
		</html>
		
	`;
}

export default loadPageNotFound;