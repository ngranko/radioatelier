# Radioatelier Backend

This package is a backend for the radioatelier project. It consists of a database connection, an API to serve data to frontends (currently there are no frontends available, but I have plans for them) and a syncing mechanism between the database and Notion.

### How to start

1. Create a `docker-compose.yml` file based on an example file
2. Create a `.env` file based on an example file
3. run `docker compose up -d` and wait for containers to be created
4. That's it! By default, the API is available at http://localhost:7070
