# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    populate_data.py                                   :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: jutrera- <jutrera-@student.42madrid.com    +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/05/27 12:38:12 by alaparic          #+#    #+#              #
#    Updated: 2024/07/11 23:03:13 by jutrera-         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

from .models import User, Friend, Match, UserTournament, Tournament
import datetime

# Aux functions to populate response fields with data
# They are imported and used in `api.py`


def populate_friends(user: User):
    all_friends = Friend.objects.all()
    friends = []
    for friend in all_friends:
        if friend.user1.id == user.id:
            friends.append({
                "id": friend.user2.id,
                "name": friend.user2.username,
                "profilePicture": str(friend.user2.profilePicture),
                "status": friend.status,
                "online": friend.user2.online
            })
        elif friend.user2.id == user.id:
            friends.append({
                "id": friend.user1.id,
                "name": friend.user1.username,
                "profilePicture": str(friend.user1.profilePicture),
                "status": friend.status,
                "online": friend.user1.online
            })
    return friends


def populate_matches(user: User):
    all_matches = Match.objects.all()
    matches = []
    for match in all_matches:
        if len(matches) >= 10:
            matches.pop(0)
        if (match.user1.id == user.id or match.user2.id == user.id) and match.winner != None:
            is_user1 = match.user1.id == user.id
            matches.append({
                "date": str(match.date),
                "opponent": match.user2.username if is_user1 else match.user1.username,
                "result": match.winner == user,
                "score": f"{match.pointsUser1} - {match.pointsUser2}" if is_user1 else f"{match.pointsUser2} - {match.pointsUser1}"
            })
    return matches


def populate_tournament_participants(tournament: Tournament):
    participants = UserTournament.objects.filter(tournament=tournament)
    resp = []
    for participant in participants:
        resp.append({
            "user_id": participant.user.id,
            "username": participant.user.username,
            "profilePicture": str(participant.user.profilePicture)
        })
    return resp


def matches_played(user: User, tournament: Tournament):
    matches = Match.objects.filter(
        user1=user, tournament=tournament) | Match.objects.filter(user2=user, tournament=tournament)
    count = 0
    for match in matches:
        if match.winner != None:
            count += 1
    return count


def matches_won(user: User, tournament: Tournament):
    matches = Match.objects.filter(
        user1=user, tournament=tournament) | Match.objects.filter(user2=user, tournament=tournament)
    count = 0
    for match in matches:
        if match.winner == user:
            count += 1
    return count


def matches_lost(user: User, tournament: Tournament):
    matches = Match.objects.filter(
        user1=user, tournament=tournament) | Match.objects.filter(user2=user, tournament=tournament)
    count = 0
    for match in matches:
        if match.winner != user and match.winner != None:
            count += 1
    return count


def populate_standings(tournament: Tournament):
    participants = UserTournament.objects.filter(tournament=tournament)
    tournament_matches = Match.objects.filter(tournament=tournament)
    resp = []
    for participant in participants:
        user_matches = tournament_matches.filter(
            user1=participant.user) | tournament_matches.filter(user2=participant.user)
        resp.append({
            "username": participant.user.username,
            "games_played": matches_played(participant.user, tournament),
            "games_won": matches_won(participant.user, tournament),
            "games_lost": matches_lost(participant.user, tournament),
            "points_for": sum([match.pointsUser1 if match.user1 == participant.user else match.pointsUser2 for match in user_matches]),
            "points_against": sum([match.pointsUser2 if match.user1 == participant.user else match.pointsUser1 for match in user_matches])
        })
    return resp


def populate_tournament_matches(tournament: Tournament):
    matches = Match.objects.filter(tournament=tournament)
    resp = []
    for match in matches:
        resp.append({
            "player1_username": match.user1.username,
            "player2_username": match.user2.username,
            "player1_points": match.pointsUser1,
            "player2_points": match.pointsUser2,
            "played": match.winner != None
        })
    return resp


def userTournamentsPlayed(user: User):
    tournaments = UserTournament.objects.filter(user=user)
    return len(tournaments)


# Count of the tournaments the user has won, most won games in the tournament is the overall winner
def userTournamentsWon(user: User):
    tournaments = UserTournament.objects.filter(user=user)
    count = 0
    for tournament in tournaments:
        if tournament.tournament.status != 'ended':
            continue
        tournament_users = UserTournament.objects.filter(
            tournament=tournament.tournament)
        # A dictionary that contains the name of the user and their wins
        players = {}
        # Initialize the dictionary with 0 wins
        for u in tournament_users:
            players[u.user.username] = 0
        matches = Match.objects.filter(tournament=tournament.tournament)
        # Count the wins of each player
        for match in matches:
            if match.winner == match.user1:
                players[match.user1.username] += 1
            else:
                players[match.user2.username] += 1
        if players[user.username] == max(players.values()):
            count += 1
    return count


def doTournamentMatchmaking(tournament: Tournament):
    # Round robin tournament matchmaking
    players = UserTournament.objects.filter(tournament=tournament)
    for i in range(len(players)):
        for j in range(i+1, len(players)):
            Match.objects.create(
                user1=players[i].user,
                user2=players[j].user,
                date=datetime.date.today(),
                tournament=tournament
            )


def checkTournamentFinished(tournament: Tournament):
    # Check if all matches in the tournament have been played
    matches = Match.objects.filter(tournament=tournament)
    for match in matches:
        if match.winner == None:
            return False
    tournament.status = 'ended'
    tournament.save()
    return True
