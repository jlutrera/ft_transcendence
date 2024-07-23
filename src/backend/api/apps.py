# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    apps.py                                            :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: jutrera- <jutrera-@student.42madrid.com    +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/05/27 12:38:04 by alaparic          #+#    #+#              #
#    Updated: 2024/07/11 23:01:33 by jutrera-         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

from django.apps import AppConfig

class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'
