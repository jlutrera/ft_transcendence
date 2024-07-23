#******************************************************************************#
#                                                                              #
#                                                         :::      ::::::::    #
#    routing.py                                         :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: alaparic <alaparic@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/05/27 12:38:06 by alaparic          #+#    #+#              #
#    Updated: 2024/05/27 12:38:07 by alaparic         ###   ########.fr        #
#                                                                              #
#******************************************************************************#

from django.urls import re_path
from .consumers import PongConsumerRemote

websocket_urlpatterns = [
    re_path(r'^wss/pong/(?P<game_id>\d+)/$', PongConsumerRemote.as_asgi()),
]
