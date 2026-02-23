# Database

PostgreSQL service is defined in `docker/docker-compose.yml`.

If you add initialization scripts, place them in `database/init/` and mount to `/docker-entrypoint-initdb.d`.
