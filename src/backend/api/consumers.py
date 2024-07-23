#******************************************************************************#
#                                                                              #
#                                                         :::      ::::::::    #
#    consumers.py                                       :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: alaparic <alaparic@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/05/27 12:38:06 by alaparic          #+#    #+#              #
#    Updated: 2024/05/27 12:38:07 by alaparic         ###   ########.fr        #
#                                                                              #
#******************************************************************************#

import contextlib
from channels.generic.websocket import AsyncJsonWebsocketConsumer


class PongConsumerRemote(AsyncJsonWebsocketConsumer):

    async def connect(self):
        print("Connected")
        self.game_id = self.scope['url_route']['kwargs']['game_id']
        self.group_name = f'pong_{self.game_id}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)

        # Check if the group already has two players
        with contextlib.suppress(KeyError):
            if len(self.channel_layer.groups[self.group_name]) > 2:
                await self.accept()
                await self.send_json({
                    "event": "show_error",
                    "error": "Match is full"
                })
                return await self.close()

        await self.accept()

        # Check if the group has two players
        if len(self.channel_layer.groups[self.group_name]) == 2:
            matchGroup = list(self.channel_layer.groups[self.group_name])
            for i, channel_name in enumerate(matchGroup):
                player_number = "1" if i == 0 else "2"
                await self.channel_layer.send(channel_name, {
                    "type": "gameData.send",
                    "data": {
                        "event": "ready",
                        "player": player_number,
                    }
                })

    async def receive_json(self, content, **kwargs):
        event = content['event']

        if event == "game_over":
            for channel_name in self.channel_layer.groups[self.group_name]:
                await self.channel_layer.send(channel_name, {
                    "type": "gameData.send",
                    "data": {
                        "event": "game_over",
                        "score1": content['score1'],
                        "score2": content['score2'],
                    }
                })
        elif event == "write_names":
            for channel_name in self.channel_layer.groups[self.group_name]:
                await self.channel_layer.send(channel_name, {
                    "type": "gameData.send",
                    "data": {
                        "event": "write_names",
                        "name1": content['name1'],
                        "name2": content['name2'],
                    }
                })
        elif event == "write_scores":
            for channel_name in self.channel_layer.groups[self.group_name]:
                await self.channel_layer.send(channel_name, {
                    "type": "gameData.send",
                    "data": {
                        "event": "write_scores",
                        "score1": content['score1'],
                        "score2": content['score2'],
                    }
                })
        elif event == "change_state":
            for channel_name in self.channel_layer.groups[self.group_name]:
                await self.channel_layer.send(channel_name, {
                    "type": "gameData.send",
                    "data": {
                        "event": "change_state",
                        "state": content['state'],
                    }
                })

        elif event == "move_paddles":
            for channel_name in self.channel_layer.groups[self.group_name]:
                await self.channel_layer.send(channel_name, {
                    "type": "gameData.send",
                    "data": {
                        "event": "move_paddles",
                        "paddles": content['paddles'],
                    }
                })
        elif event == "move_ball":
            for channel_name in self.channel_layer.groups[self.group_name]:
                await self.channel_layer.send(channel_name, {
                    "type": "gameData.send",
                    "data": {
                        "event": "move_ball",
                        "ball": content['ball'],
                    }
                })

    async def disconnect(self, code):
        print("Disconnected")
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        # code = 4000 if the match finished as game over
        if (code != 4000):
            await self.channel_layer.group_send(self.group_name, {
                "type": "gameData.send",
                "data": {
                    "event": "opponent_left",
                }
            })

    async def gameData_send(self, context):
        await self.send_json(context['data'])
