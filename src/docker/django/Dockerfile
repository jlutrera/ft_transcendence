FROM python:3.11.7

# Instala netcat
RUN 	apt-get update \
	&& 	apt-get install -y ncat

COPY ./backend ./app

COPY ./docker/django/setup.sh /app/setup.sh
RUN chmod +x /app/setup.sh

WORKDIR /app

RUN pip install --upgrade pip
RUN pip install -r requirements.txt --no-cache-dir

CMD ["/app/setup.sh"]
