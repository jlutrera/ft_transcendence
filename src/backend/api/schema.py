# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    schema.py                                          :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: alaparic <alaparic@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/05/27 12:38:15 by alaparic          #+#    #+#              #
#    Updated: 2024/07/13 14:09:25 by alaparic         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

import datetime
from typing import List
from ninja import Schema

""" Auth schemas """


class UserRegisterSchema(Schema):
    username: str
    password: str
    profilePicture: str = "/api/static/avatars/default.jpg"


class LoginSchema(Schema):
    username: str
    password: str


""" User schemas """


class FriendSchema(Schema):
    id: int
    name: str
    profilePicture: str
    status: bool
    online: bool


class MatchSchema(Schema):
    date: str
    opponent: str
    result: bool
    score: str


class UserSchema(Schema):
    id: int
    username: str
    profilePicture: str
    totalPoints: int
    online: bool
    matchesTotal: int
    matchesWon: int
    matchesLost: int
    tournamentsPlayed: int
    tournamentsWon: int
    friends: List[FriendSchema]
    matches: List[MatchSchema]


class UserUpdateSchema(Schema):
    username: str = None
    password: str = None


class UserNameSchema(Schema):
    username: str


class AddFriendSchema(Schema):
    friend_username: str


class localMatchSchema(Schema):
    player2_username: str
    player2_password: str
    matchID: int | None


""" Tournaments schemas """


class TournamentCreateSchema(Schema):
    name: str
    number_participants: int


class UserTournamentSchema(Schema):
    user_id: int
    username: str
    profilePicture: str


class TournamentSchema(Schema):
    id: int
    name: str
    date: str = datetime.date.today().isoformat()
    status: str
    current_participants: int
    number_participants: int
    participants: List[UserTournamentSchema]


class StandingsSchema(Schema):
    username: str
    games_played: int
    games_won: int
    games_lost: int
    points_for: int
    points_against: int


class MatchInfoSchema(Schema):
    player1_username: str
    player2_username: str
    player1_points: int
    player2_points: int
    played: bool


class SingleTournamentSchema(Schema):
    id: int
    name: str
    date: str
    status: str
    current_participants: int
    number_participants: int
    participants: List[UserTournamentSchema]
    standings: List[StandingsSchema]
    matches: List[MatchInfoSchema]


class TournamentNameSchema(Schema):
    id: int
    name: str


class UserTournamentMatchesSchema(Schema):
    matchID: int
    tournamentID: int
    tournamentName: str
    player1_username: str
    player2_username: str


""" General schemas """


class ErrorSchema(Schema):
    error_msg: str


class SuccessSchema(Schema):
    msg: str


""" Game update schemas """


class MatchUpdateSchema(Schema):
    matchID: int
    player1_points: int
    player2_points: int
    winner: int


class TournamentEndedSchema(Schema):
    tournamentID: int


class UserStatsUpdateSchema(Schema):
    userID: int
    points: int
    won: bool


""" Match schemas """


class PaddlesSchema(Schema):
    x1: float
    y1: float
    score1: int
    x2: float
    y2: float
    score2: int


class MovePaddlesSchema(Schema):
    msg: str
    paddles: PaddlesSchema


class BallSchema(Schema):
    x: float
    y: float
    vx: float
    vy: float


class MoveBallSchema(Schema):
    msg: str
    ball: BallSchema
    score1: int
    score2: int


class GameSchema(Schema):
    v: float
    finalScore: int
    playerWidth: float
    playerHeight: float
    ballWidth: float
    ballHeight: float
    name1: str
    name2: str


class SuccessInitSchema(Schema):
    id: int
    game: GameSchema
    paddles: PaddlesSchema
    ball: BallSchema
