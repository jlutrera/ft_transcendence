# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    urls.py                                            :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: jutrera- <jutrera-@student.42madrid.com    +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/05/27 12:38:54 by alaparic          #+#    #+#              #
#    Updated: 2024/07/11 23:05:13 by jutrera-         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

from django.urls import path
from api.api import app as api_app
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("api/", api_app.urls),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
