# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    api.py                                             :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: jutrera- <jutrera-@student.42madrid.com    +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/05/27 12:37:59 by alaparic          #+#    #+#              #
#    Updated: 2024/07/20 14:45:09 by jutrera-         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

import os
import random
from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate, login, logout
from ninja import NinjaAPI, File
from ninja.files import UploadedFile
from typing import Optional
from .models import *
from .middleware import login_required, require_auth
from .populate_data import *
from .schema import *


MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB

app = NinjaAPI(
    title="ft_transcendence API",
    version="1.0",
    description="API for the ft_transcendence project made with the django-ninja library.",
)

""" Auth """


@app.post("auth/register", response={200: SuccessSchema, 400: ErrorSchema}, tags=['Auth'])
def create_user(request, user_in: UserRegisterSchema):
    if User.objects.filter(username=user_in.username).exists():
        return 400, {"error_msg": "User already exists"}

    if (len(user_in.username.strip()) < 3 or len(user_in.username.strip()) > 20):
        return 400, {"error_msg": "Invalid username length"}

    user_in.username = user_in.username.strip()

    if (len(user_in.password) <= 0 or len(user_in.password) > 128):
        return 400, {"error_msg": "Invalid password"}

    user_data = user_in.model_dump()
    User.objects.create_user(**user_data)
    return {"msg": "User created"}


@app.post("auth/login/local_match", response={200: SuccessSchema, 400: ErrorSchema}, tags=['Auth'])
@login_required
def local_match(request, formData: localMatchSchema):
    user1 = request.user
    # check user2 exists and can play a match
    user2 = User.objects.filter(username=formData.player2_username).first()
    if user2 is None:
        return 400, {"error_msg": "User does not exit"}
    if not user2.check_password(formData.player2_password):
        return 400, {"error_msg": "Wrong password"}
    if user1 == user2:
        return 400, {"error_msg": "Can't play against yourself"}
    # if match is tournament check if match between user1 and user2 exists and has not been played
    if formData.matchID != -1:
        match = Match.objects.filter(matchID=formData.matchID).first()
        if match is None:
            return 400, {"error_msg": "Match not found"}
        if (match.user1 != user1 or match.user2 != user2) and (match.user1 != user2 or match.user2 != user1):
            return 400, {"error_msg": user2.username + " is not an opponent in this match"}
        if match.winner is not None:
            return 400, {"error_msg": "Match already played"}
    else:
        match = Match(user1=user1, user2=user2)
        match.save()
    return {"msg": "ok"}


@app.post("auth/login", tags=['Auth'])
def login_user(request, login_in: LoginSchema):
    user = authenticate(request, username=login_in.username,
                        password=login_in.password)
    if user is not None:
        login(request, user)
        user.online = True
        user.save()
        return {"msg": "Login successful"}
    else:
        return {"error_msg": "Login failed"}


@app.get("auth/logout", tags=['Auth'])
@login_required
def logout_user(request):
    user = request.user
    user.online = False
    user.save()
    logout(request)
    return {"msg": "Logout successful"}


""" Users """


@app.get("users", response=UserSchema, tags=['Users'])
def get_users(request, user_id: Optional[int] = None):
    if user_id:
        user = get_object_or_404(User, id=user_id)
        if user is None:
            return 400, {"error_msg": "User not found"}
    else:
        auth_response = require_auth(request)
        if auth_response is not None:
            return auth_response
        user = request.user

    resp = {
        "id": user.id,
        "username": user.username,
        "profilePicture": str(user.profilePicture),
        "totalPoints": user.totalPoints,
        "online": user.online,
        "matchesTotal": user.matchesTotal,
        "matchesWon": user.matchesWon,
        "matchesLost": user.matchesLost,
        "tournamentsPlayed": userTournamentsPlayed(user),
        "tournamentsWon": userTournamentsWon(user),
        "friends": populate_friends(user),
        "matches": populate_matches(user)
    }
    return resp


@app.post("users/update", response={200: UserNameSchema, 400: ErrorSchema}, tags=['Users'])
@login_required
def update_user(request, user_in: UserUpdateSchema):
    user = request.user
    user_data = user_in.dict()

    if (user_data["username"] != user.username):
        if User.objects.filter(username=user_data["username"]).exists():
            return 400, {"error_msg": "Username already exists"}
        if (len(user_data["username"].strip()) < 3 or len(user_data["username"].strip()) > 20):
            return 400, {"error_msg": "Invalid username length"}
        user.username = user_data["username"].strip()

    if user_in.password is not None:
        if len(user_in.password) >= 0 and len(user_in.password) < 128:
            user.set_password(user_in.password)
        else:
            return 400, {"error_msg": "Invalid password"}
    user.save()
    # Reauthenticate user
    login(request, user)
    return {"username": user.username}


@app.post("users/avatar", response={200: SuccessSchema, 400: ErrorSchema}, tags=['Users'])
@login_required
def update_avatar(request, file: UploadedFile = File(...)):
    avatar_data = file.read()
    user_id = request.user.id

    # Check image size
    if len(avatar_data) > MAX_IMAGE_SIZE:
        return 400, {"error_msg": "Image size too large"}
    if len(avatar_data) == 0:
        return 400, {"error_msg": "Empty image"}

    # Check image format
    if file.content_type not in ["image/jpeg", "image/png", "image/gif"]:
        return 400, {"error_msg": "Image format not supported"}

    # Delete previous avatar unless default
    if request.user.profilePicture != "/api/static/avatars/default.jpg":
        os.remove(request.user.profilePicture)

    # Save the uploaded image
    relative_file_route = os.path.join("api", "static", "avatars",
                                       str(user_id) + "." + file.content_type.split('/')[-1])
    file_route = os.path.join(os.getcwd(), relative_file_route)
    file = open(file_route, "wb")
    file.write(avatar_data)
    file.close()

    # Update the user avatar route
    user = get_object_or_404(User, id=user_id)
    user.profilePicture = "/"+relative_file_route
    user.save()
    return {"msg": "Avatar updated"}


@app.post("users/friends/add", response={200: SuccessSchema, 400: ErrorSchema}, tags=['Users'])
@login_required
def add_friend(request, friend_username: AddFriendSchema):
    # if friend does not exist
    if not User.objects.filter(username=friend_username.friend_username).exists():
        return 400, {"error_msg": "User does not exist"}

    user = request.user
    friend = get_object_or_404(User, username=friend_username.friend_username)

    if user == friend:
        return 400, {"error_msg": "Cannot add yourself as friend"}

    if Friend.objects.filter(user1=user, user2=friend).exists() or Friend.objects.filter(user1=friend, user2=user).exists():
        return 400, {"error_msg": "Friend request already sent"}

    friend_data = {
        "user1": user,
        "user2": friend
    }

    Friend.objects.create(**friend_data)
    return 200, {"msg": "Friend request sent"}


@app.post("users/friends/accept", response={200: SuccessSchema, 400: ErrorSchema}, tags=['Users'])
@login_required
def accept_friend(request, friend_username: AddFriendSchema):
    user = request.user
    friend = get_object_or_404(User, username=friend_username.friend_username)

    # can't accept a friend request if user is the sender
    friend_request = Friend.objects.filter(user1=user, user2=friend).first()
    if friend_request is not None and user == friend_request.user1:
        return 400, {"error_msg": "Can't accept your own friend request"}

    if not Friend.objects.filter(user1=friend, user2=user, status=False).exists():
        return 400, {"error_msg": "Friend request not found"}

    friendship = get_object_or_404(Friend, user1=friend, user2=user)
    friendship.status = True
    friendship.save()
    return 200, {"msg": "Friend request accepted"}


@app.post("users/friends/remove", response={200: SuccessSchema, 400: ErrorSchema}, tags=['Users'])
@login_required
def remove_friend(request, friend_username: AddFriendSchema):
    user = request.user
    friend = get_object_or_404(User, username=friend_username.friend_username)

    if not Friend.objects.filter(user1=user, user2=friend).exists() and not Friend.objects.filter(user1=friend, user2=user).exists():
        return 400, {"error_msg": "Friend not found"}

    if Friend.objects.filter(user1=user, user2=friend).exists():
        friendship = get_object_or_404(Friend, user1=user, user2=friend)
    else:
        friendship = get_object_or_404(Friend, user1=friend, user2=user)
    friendship.delete()
    return 200, {"msg": "Friend removed"}


""" Tournaments """


@app.post("tournaments/create", response={200: SuccessSchema, 400: ErrorSchema}, tags=['Tournaments'])
@login_required
def create_tournament(request, tournament_in: TournamentCreateSchema):
    tournament_data = tournament_in.dict()
    if (tournament_data["number_participants"] < 2 or
            tournament_data["number_participants"] > 20):
        return 400, {"error_msg": "Invalid number of participants"}
    if (tournament_data["name"].strip() == "" or len(tournament_data["name"].strip()) < 3):
        return 400, {"error_msg": "Invalid name"}
    if (len(tournament_data["name"]) < 3 or len(tournament_data["name"]) > 30):
        return 400, {"error_msg": "Invalid name length"}
    Tournament.objects.create(**tournament_data)
    return {"msg": "Tournament created"}


@app.get("tournaments", response=list[TournamentSchema], tags=['Tournaments'])
def get_tournaments(request):
    all_tournaments = Tournament.objects.all()
    resp = []
    for tournament in all_tournaments:
        resp.append({
            "id": tournament.tournamentID,
            "name": tournament.name,
            "date": tournament.date.isoformat(),
            "status": tournament.status,
            "current_participants": UserTournament.objects.filter(tournament=tournament).count(),
            "number_participants": tournament.number_participants,
            "participants": populate_tournament_participants(tournament)
        })
    return resp


@app.get("tournaments/{tournament_id}", response=SingleTournamentSchema, tags=['Tournaments'])
def get_tournament(request, tournament_id: int):
    tournament = get_object_or_404(Tournament, tournamentID=tournament_id)
    resp = {
        "id": tournament.tournamentID,
        "name": tournament.name,
        "date": tournament.date.isoformat(),
        "status": tournament.status,
        "current_participants": UserTournament.objects.filter(tournament=tournament).count(),
        "number_participants": tournament.number_participants,
        "participants": populate_tournament_participants(tournament),
        "standings": populate_standings(tournament),
        "matches": populate_tournament_matches(tournament_id)
    }
    return resp


@app.post("tournaments/{tournament_id}/join", response={200: SuccessSchema, 400: ErrorSchema}, tags=['Tournaments'])
@login_required
def join_tournament(request, tournament_id: int):
    user = get_object_or_404(User, id=request.user.id)
    tournament = get_object_or_404(Tournament, tournamentID=tournament_id)

    if UserTournament.objects.filter(user=user, tournament=tournament).exists():
        return 400, {"error_msg": "User already in tournament"}

    if tournament.status != "Upcoming":
        return 400, {"error_msg": "Tournament is " + tournament.status}

    user_tournament_data = {
        "user": user,
        "tournament": tournament
    }

    UserTournament.objects.create(**user_tournament_data)

    if UserTournament.objects.filter(tournament=tournament).count() >= tournament.number_participants:
        tournament.status = "In Progress"
        tournament.save()
        doTournamentMatchmaking(tournament)

    return 200, {"msg": "User joined tournament"}


@app.post("tournaments/{tournament_id}/leave", response={200: SuccessSchema, 400: ErrorSchema}, tags=['Tournaments'])
@login_required
def leave_tournament(request, tournament_id: int):
    user = get_object_or_404(User, id=request.user.id)
    tournament = get_object_or_404(Tournament, tournamentID=tournament_id)

    if not UserTournament.objects.filter(user=user, tournament=tournament).exists():
        return 400, {"error_msg": "User not in tournament"}

    if tournament.status == "Ended":
        return 400, {"error_msg": "Tournament has ended"}

    # If tournament is in progress, user looses unplayed matches
    if tournament.status == "In Progress":
        matches = Match.objects.filter(
            tournament=tournament, user1=user) | Match.objects.filter(tournament=tournament, user2=user)
        for match in matches:
            if match.pointsUser1 == 0 and match.pointsUser2 == 0:
                if match.user1 == user:
                    match.winner = match.user2
                else:
                    match.winner = match.user1
                match.pointsUser1 = 0
                match.pointsUser2 = 0
                match.save()

    user_tournament = get_object_or_404(
        UserTournament, user=user, tournament=tournament)
    user_tournament.delete()

    checkTournamentFinished(tournament)
    return 200, {"msg": "User left tournament"}


@app.get("tournaments/user/matches", response=list[UserTournamentMatchesSchema], tags=['Tournaments'])
@login_required
def get_user_matches(request):
    user = request.user
    matches = Match.objects.filter(user1=user, matchID__isnull=False) | Match.objects.filter(
        user2=user, matchID__isnull=False)
    resp = []
    for match in matches:
        if match.user1 == user:
            opponent = match.user2
        else:
            opponent = match.user1
        if match.tournament is not None:
            resp.append({
                "matchID": match.matchID,
                "tournamentID": match.tournament.tournamentID,
                "tournamentName": match.tournament.name,
                "player1_username": user.username,
                "player2_username": opponent.username
            })
    return resp


""" Game """


@app.get('game/paddles', response={200: MovePaddlesSchema, 400: ErrorSchema}, tags=['Game'])
def move_paddles(request, id_match: int, key: str):
    try:
        match = get_object_or_404(RemoteGame, id=id_match)
        border = 0.02
        if key == 'ArrowUp':
            match.paddles.y1 = max(border, match.paddles.y1 - match.game.v)
        elif key == 'ArrowDown':
            match.paddles.y1 = min(
                1 - match.game.playerHeight - border, match.paddles.y1 + match.game.v)
        elif key == 'w' or key == 'W' or key == 'A':
            match.paddles.y2 = max(border, match.paddles.y2 - match.game.v)
        elif key == 's' or key == 'S' or key == 'D':
            match.paddles.y2 = min(
                1 - match.game.playerHeight - border, match.paddles.y2 + match.game.v)
        elif key == 'VelocityUp':
            match.game.v += 0.01
        elif key == 'VelocityDown' and match.game.v > 0:
            match.game.v -= 0.01
        return 200, {"msg": key, "paddles": match.paddles}
    except Exception as e:
        return 400, {"error_msg": "Error moving paddle" + str(e)}


@app.get('game/ball', response={200: MoveBallSchema, 400: ErrorSchema}, tags=['Game'])
def move_ball(request, id_match: int):
    try:
        match = get_object_or_404(RemoteGame, id=id_match)
        if (match.ball.x + match.game.ballWidth < match.paddles.x1) or (match.ball.x > match.paddles.x2 + match.game.playerWidth):
            return 200, {"msg": "donotplay", "ball": match.ball, "score1": match.paddles.score1, "score2": match.paddles.score2}
 
        # Update ball position
        if match.ball.y + match.ball.vy <= 0 or match.ball.y + match.ball.vy + match.game.ballWidth >= 1:
            match.ball.vy = -match.ball.vy
        match.ball.x += match.ball.vx
        match.ball.y += match.ball.vy

        # Check for collisions with walls

        # Left wall (Paddle 1)
        if match.ball.x + match.game.ballWidth < match.paddles.x1:
            match.paddles.score2 += 1
            if match.paddles.score2 >= match.game.finalScore:
                return 200, {"msg": "gameover", "ball": match.ball, "score1": match.paddles.score1, "score2": match.paddles.score2}
            else:
                return 200, {"msg": "scored", "ball": match.ball, "score1": match.paddles.score1, "score2": match.paddles.score2}

        # Right wall (Paddle 2)
        elif match.ball.x > match.paddles.x2 + match.game.playerWidth:
            match.paddles.score1 += 1
            if match.paddles.score1 >= match.game.finalScore:
                return 200, {"msg": "gameover", "ball": match.ball, "score1": match.paddles.score1, "score2": match.paddles.score2}
            else:
                return 200, {"msg": "scored", "ball": match.ball, "score1": match.paddles.score1, "score2": match.paddles.score2}

        # Paddle collisions
        elif (match.ball.y <= match.game.playerHeight + match.paddles.y2 and match.ball.y + match.game.ballHeight >= match.paddles.y2 and \
              match.ball.x + match.game.ballWidth >= match.paddles.x2 and match.ball.x + match.game.ballWidth <= match.paddles.x2 + match.game.playerWidth) or \
             (match.ball.y <= match.game.playerHeight + match.paddles.y1 and match.ball.y  + match.game.ballHeight >= match.paddles.y1 and \
              match.ball.x <= match.paddles.x1 + match.game.playerWidth and match.ball.x >= match.paddles.x1):
            match.ball.vx = -match.ball.vx
            if match.ball.x < match.paddles.x1 + match.game.playerWidth:
                match.ball.x = match.paddles.x1 + match.game.playerWidth
            if match.ball.x > match.paddles.x2:
                match.ball.x = match.paddles.x2 - match.game.ballWidth

            if (match.ball.y > match.paddles.y1 + match.game.playerHeight * 0.75 or match.ball.y > match.paddles.y2 + match.game.playerHeight * 0.75) and match.ball.vy < 3:
                match.ball.vy += 0.005

            if (match.ball.y < match.paddles.y1 + match.game.playerHeight * 0.25 or match.ball.y < match.paddles.y2 + match.game.playerHeight * 0.25) and match.ball.vy > -3:
                match.ball.vy -= 0.005
        return 200, {"msg": "playing", "ball": match.ball, "score1": match.paddles.score1, "score2": match.paddles.score2}
    except Exception as e:
        return 400, {"error_msg": "Error moving ball" + str(e)}


@app.get('game/reset', response={200: MoveBallSchema, 400: ErrorSchema}, tags=['Game'])
def reset_ball(request, id_match: int):
    try:
        match = get_object_or_404(RemoteGame, id=id_match)
        match.ball.x = (1 - match.game.ballWidth) / 2
        match.ball.y = (1 - match.game.ballHeight) / 2
        match.ball.vx = random.choice([-0.02, 0.02])
        match.ball.vy = random.choice([-0.004, -0.003, 0.003, 0.004])
        return 200, {"msg": "playing", "ball": match.ball, "score1": match.paddles.score1, "score2": match.paddles.score2}

    except Exception as e:
        return 400, {"error_msg": "Error resetting ball" + str(e)}


""" Match """


@app.get("match/new", response={200: SuccessInitSchema}, tags=['Match'])
def new_match(request, id_match: int, name1: str, name2: str):
    try:
        match = get_object_or_404(RemoteGame, id=id_match)
        match.delete()
    except:
        pass
    match = RemoteGame.objects.create(id=id_match)
    match.paddles.score1 = 0
    match.paddles.score2 = 0
    match.game.name1 = name1
    match.game.name2 = name2
    match.game.finalScore = 3

    # Los valores de las variables son porcentajes del tamaño de la pantalla
    match.game.v = 0.03
    match.game.ballWidth = 0.02
    match.game.ballHeight = 0.02
    match.game.playerWidth = 0.02
    match.game.playerHeight = 0.20
    match.paddles.x1 = 0.02
    match.paddles.y1 = (1 - match.game.playerHeight) / 2
    match.paddles.x2 = 0.96
    match.paddles.y2 = (1 - match.game.playerHeight) / 2
    match.ball.x = (1 - match.game.ballWidth) / 2
    match.ball.y = (1 - match.game.ballWidth) / 2
    match.ball.vx = random.choice([-0.02, 0.02])
    match.ball.vy = random.choice([-0.004, -0.003, 0.003, 0.004])
    match.save()
    return 200, {"id": match.id, "game": match.game, "paddles": match.paddles, "ball": match.ball}


@app.get("match/updatescores", response={200: SuccessSchema, 400: ErrorSchema}, tags=['Match'])
def update_score(request, id_match: int, score1: int, score2: int):
    try:
        match = get_object_or_404(RemoteGame, id=id_match)
        match.paddles.score1 = score1
        match.paddles.score2 = score2
        match.save()
        return 200, {"msg": "Scores updated"}
    except Exception as e:
        return 400, {"error_msg": "Error updating score" + str(e)}


@app.get("match/join", response={200: SuccessInitSchema, 400: ErrorSchema}, tags=['Match'])
def join_match(request, id_match: int, name1: str):
    match = get_object_or_404(RemoteGame, id=id_match)
    if match.game.name2 != '':
        return 400, {"error_msg": "Game already has two players"}
    match.game.name2 = name1
    match.save()
    return 200, {"id": match.id, "game": match.game, "paddles": match.paddles, "ball": match.ball}


@app.get("match/save", response={200: SuccessSchema}, tags=['Match'])
def save_match(request, id_match: int, id_tournament: int):
    try:
        match = RemoteGame.objects.get(id=id_match)

        # user1
        user1 = get_object_or_404(User, username=match.game.name1)
        user1.totalPoints += match.paddles.score1
        user1.matchesTotal += 1
        if match.paddles.score1 > match.paddles.score2:
            user1.matchesWon += 1
            matchWinner = user1
        else:
            user1.matchesLost += 1
        user1.save()

        # user2
        user2 = get_object_or_404(User, username=match.game.name2)
        user2.totalPoints += match.paddles.score2
        user2.matchesTotal += 1
        if match.paddles.score2 > match.paddles.score1:
            user2.matchesWon += 1
            matchWinner = user2
        else:
            user2.matchesLost += 1
        user2.save()

        # tournament data
        # TODO -> finish this!!
        if id_tournament != 0:
            tournament = get_object_or_404(
                Tournament, tournamentID=id_tournament)
            tournament.status = "ended"
            tournament.save()
        else:
            tournament = None

        # save match data
        if (id_tournament == 0):
            matchToSave = Match.objects.create(user1=user1, user2=user2)
        else:
            matchToSave = get_object_or_404(Match, matchID=match.id)
        matchToSave.pointsUser1 = match.paddles.score1
        matchToSave.pointsUser2 = match.paddles.score2
        matchToSave.winner = matchWinner
        matchToSave.tournament = tournament
        matchToSave.save()
        return 200, {"msg": "Match saved"}
    except RemoteGame.DoesNotExist:
        return 200, {"msg": "Match was saved before"}


@app.delete("match/delete", response={200: SuccessSchema}, tags=['Match'])
def delete_match(request, id_match: int):
    try:
        match = RemoteGame.objects.get(id=id_match)
        match.delete()
        return 200, {"msg": "Match deleted"}
    except RemoteGame.DoesNotExist:
        return 200, {"msg": "Match was deleted before"}


@app.get("match/state", response={200: SuccessInitSchema, 400: ErrorSchema}, tags=['Match'])
def get_state(request, id_match: int):
    try:
        match = get_object_or_404(RemoteGame, id=id_match)
        return 200, {"id": match.id, "game": match.game, "paddles": match.paddles, "ball": match.ball}
    except Exception as e:
        return 400, {"error_msg": "Error getting game state" + str(e)}
