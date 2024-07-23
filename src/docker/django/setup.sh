#!/bin/sh

# python manage.py makemigrations
# python manage.py migrate
# exec python manage.py runserver 0.0.0.0:8000

# Espera a que la base de datos esté lista
echo "Waiting for postgres..."
while ! nc -z $POSTGRES_HOST 5432; do
  sleep 0.1
done
echo "PostgreSQL started"

# Ejecuta `makemigrations` para crear los archivos de migración
python manage.py makemigrations --no-input || { echo 'Makemigrations failed' ; exit 1; }

# Ejecuta `migrate` para aplicar las migraciones a la base de datos
python manage.py migrate --no-input || { echo 'Migration failed' ; exit 1; }

# Ejecuta el servidor de desarrollo de Django
exec python manage.py runserver 0.0.0.0:8000
