# Fase única, simplemente sirviendo archivos estáticos con NGINX
FROM nginx:alpine

RUN apk update && apk add --no-cache openssl

RUN openssl req -newkey rsa:4096 -x509 -sha256 -days 365 -nodes \
        -out /etc/ssl/adpachec.42.fr.pem  \
        -keyout /etc/ssl/adpachec.42.fr.key \
        -subj "/C=FR/ST=Paris/L=Paris/O=42 School/OU=adpachec/CN=adpachec.42.fr"

		RUN adduser -D -g '' myuser && \
    mkdir -p /var/run/nginx /var/cache/nginx /var/log/nginx /usr/share/nginx/html && \
    chown -R myuser:myuser /var/run/nginx /var/cache/nginx /var/log/nginx /usr/share/nginx /etc/nginx /etc/ssl
# Copiar el directorio src y node_modules al contenedor
COPY ./src/frontend /usr/share/nginx/html
COPY ./src/docker/nginx/nginx.conf /etc/nginx/nginx.conf

# Instalar Node.js y npm
RUN apk add --update nodejs npm

# Establecer directorio de trabajo y copiar archivos de Node.js
WORKDIR /usr/share/nginx/html

# Limpiar la caché de npm y usar npm ci para instalación limpia
RUN npm install

RUN mkdir -p /var/run/nginx 

CMD ["nginx", "-g", "daemon off;"]
