# Transcendence
NAME			=	transcendence
PORT 			= 	443

# Ruta de los archivos docker-compose
DOCKER_COMPOSE_FILE   = src/docker/docker-compose.yml

# Colours
RED				=	\033[0;31m
GREEN			=	\033[0;32m
YELLOW			=	\033[0;33m
BLUE			=	\033[0;34m
PURPLE			=	\033[0;35m
CYAN			=	\033[0;36m
WHITE			=	\033[0;37m
RESET			=	\033[0m

# Rules
all:		$(NAME)

$(NAME):	
			@printf "\n$(BLUE)==> $(CYAN)Building Transcendence 🏗️\n\n$(RESET)"
			@echo "Using compose files: $(DOCKER_COMPOSE_FILE)"
			@docker-compose -p $(NAME) -f $(DOCKER_COMPOSE_FILE) up -d --remove-orphans
			@printf "\n$(BLUE)==> $(CYAN)Transcendence is running ✅\n$(RESET)"
			@printf "$(BLUE)==> $(BLUE)Accessible on: \n\t$(YELLOW)https://localhost:8080\n$(RESET)"

stop:
			@docker-compose -p $(NAME) -f $(DOCKER_COMPOSE_FILE) stop
			@printf "\n$(BLUE)==> $(RED)Transcendence stopped 🛑\n$(RESET)"

logs-django:
			docker logs -f	django

logs-nginx:
			docker logs -f	nginx

logs-postgres:
			docker logs -f	postgres

clean:		stop
			@docker-compose -p $(NAME) -f $(DOCKER_COMPOSE_FILE) down
			@printf "\n$(BLUE)==> $(RED)Removed Transcendence 🗑️\n$(RESET)"

fclean:		
			@docker rmi -f $(shell docker images -q)
			@docker rm -f $(shell docker ps -aq)
			@docker network rm $(shell docker network ls -q)
			@printf "\n$(BLUE)==> $(RED)Fully cleaned Transcendence 🗑️\n$(RESET)"

re:			clean
			@docker-compose -p $(NAME) -f $(DOCKER_COMPOSE_FILE) up -d --build
			@printf "$(BLUE)==> $(CYAN)Transcendence rebuilt 🔄\n$(RESET)"
			@printf "\n$(BLUE)==> $(CYAN)Transcendence is running ✅\n$(RESET)"
			@printf "$(BLUE)==> $(BLUE)Accessible on: \n\t$(YELLOW)https://localhost:8080\n$(RESET)"

re-postgres:
			@docker-compose -p $(NAME) -f $(DOCKER_COMPOSE_FILE) up -d --no-deps --build postgres

re-django:
			@docker-compose -p $(NAME) -f $(DOCKER_COMPOSE_FILE) up -d --no-deps --build django

re-nginx:
			@docker-compose -p $(NAME) -f $(DOCKER_COMPOSE_FILE) up -d --no-deps --build nginx

.PHONY:		all stop clean fclean re re-postgres re-django re-nginx
