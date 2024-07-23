# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    models.py                                          :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: alaparic <alaparic@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/05/27 12:38:10 by alaparic          #+#    #+#              #
#    Updated: 2024/07/13 13:40:07 by alaparic         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
import datetime

# Create your models here.


class Paddles(models.Model):
    x1 = models.FloatField(default=0)
    y1 = models.FloatField(default=0)
    score1 = models.IntegerField(default=0)
    x2 = models.FloatField(default=0)
    y2 = models.FloatField(default=0)
    score2 = models.IntegerField(default=0)


class Ball(models.Model):
    x = models.FloatField(default=0)
    y = models.FloatField(default=0)
    vx = models.FloatField(default=0)
    vy = models.FloatField(default=0)


class Game(models.Model):
    v = models.FloatField(default=0)
    ballWidth = models.FloatField(default=10)
    ballHeight = models.FloatField(default=10)
    playerWidth = models.FloatField(default=15)
    playerHeight = models.FloatField(default=80)
    finalScore = models.IntegerField(default=3)
    name1 = models.CharField(max_length=40, default='Player1')
    name2 = models.CharField(max_length=40, default='Player2')


class RemoteGame(models.Model):
    id = models.IntegerField(primary_key=True)
    paddles = Paddles()
    ball = Ball()
    game = Game()


class Match(models.Model):
    matchID = models.AutoField(primary_key=True)
    user1 = models.ForeignKey(
        'User', related_name='user1_match', on_delete=models.CASCADE)
    user2 = models.ForeignKey(
        'User', related_name='user2_match', on_delete=models.CASCADE)
    pointsUser1 = models.IntegerField(default=0)
    pointsUser2 = models.IntegerField(default=0)
    date = models.DateField(default=datetime.date.today)
    winner = models.ForeignKey('User', related_name='winner',
                               on_delete=models.CASCADE, null=True, blank=True, default=None)
    tournament = models.ForeignKey(
        'Tournament', on_delete=models.CASCADE, null=True, blank=True, default=None)


# User inherits from AbstractUser, which is a built-in Django model
# this allows us to use the built-in Django authentication system
class User(AbstractUser):
    profilePicture = models.CharField(
        default='/api/static/avatars/default.jpg')
    online = models.BooleanField(default=False)
    totalPoints = models.IntegerField(default=0)
    matchesTotal = models.IntegerField(default=0)
    matchesWon = models.IntegerField(default=0)
    matchesLost = models.IntegerField(default=0)


class Friend(models.Model):
    friendID = models.AutoField(primary_key=True)
    user1 = models.ForeignKey(
        'User', related_name='user1', on_delete=models.CASCADE)
    user2 = models.ForeignKey(
        'User', related_name='user2', on_delete=models.CASCADE)
    # False for pending, True for accepted
    status = models.BooleanField(default=False)


class Tournament(models.Model):
    TOURNAMENT_STATUS_CHOICES = [
        ('upcoming', 'Upcoming'),
        ('in_progress', 'In Progress'),
        ('ended', 'Ended'),
    ]
    tournamentID = models.AutoField(primary_key=True, unique=True)
    name = models.CharField(
        validators=[MinValueValidator(3), MaxValueValidator(30)])
    date = models.DateField(default=datetime.date.today)
    number_participants = models.IntegerField(
        validators=[MinValueValidator(2), MaxValueValidator(20)])
    status = models.CharField(
        max_length=11, choices=TOURNAMENT_STATUS_CHOICES, default='Upcoming')


class UserTournament(models.Model):
    userTournamentID = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        'User', related_name='user', on_delete=models.CASCADE)
    tournament = models.ForeignKey(
        'Tournament', related_name='tournament', on_delete=models.CASCADE)
