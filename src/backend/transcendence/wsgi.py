# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    wsgi.py                                            :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: jutrera- <jutrera-@student.42madrid.com    +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/05/27 12:38:06 by alaparic          #+#    #+#              #
#    Updated: 2024/07/02 09:06:47 by jutrera-         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

"""
WSGI config for transcendence project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'transcendence.settings')

application = get_wsgi_application()
