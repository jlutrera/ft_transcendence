/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   router.js                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: adpachec <adpachec@student.42madrid.com>   +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/04/08 11:51:47 by adpachec          #+#    #+#             */
/*   Updated: 2024/05/16 09:40:56 by adpachec         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import updateNavbar from "./navbar.js";

export default class Router {
    constructor() {
        this.routes = {};
        this.defaultRoute = () => console.error("No route found.");
        window.addEventListener('popstate', () => this.route(window.location.pathname, false));
    }

    addRoute(path, action) {
        this.routes[path] = action;
    }

    setDefaultRoute(action) {
        this.defaultRoute = action;
    }

    resolveCurrentPath() {
        const path = window.location.pathname || '/';
        this.route(path, false);
        updateNavbar();
    }

    route(path, updateHistory = true) {
        const matchedRoute = Object.keys(this.routes).find(route => 
            new RegExp(`^${route.replace(/:\w+/g, '(.+)')}$`).test(path)
        );
        if (matchedRoute) {
            const action = this.routes[matchedRoute];
            const matches = path.match(new RegExp(matchedRoute.replace(/:\w+/g, '(.+)')));
            action.apply(null, matches.slice(1));
        } else {
            this.defaultRoute();
        }

        if (updateHistory && window.location.pathname !== path) {
            window.history.pushState({}, '', path);
        }
    }
}
