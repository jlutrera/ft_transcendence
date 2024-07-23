# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    middleware.py                                      :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: alaparic <alaparic@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/05/27 12:38:06 by alaparic          #+#    #+#              #
#    Updated: 2024/07/13 14:09:03 by alaparic         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

from django.http import JsonResponse
from functools import wraps

def require_auth(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Not authenticated"}, status=401)


def login_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        auth_response = require_auth(request)
        if auth_response is not None:
            return auth_response
        return view_func(request, *args, **kwargs)
    return _wrapped_view
