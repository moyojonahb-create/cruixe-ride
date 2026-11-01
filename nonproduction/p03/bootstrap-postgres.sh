#!/bin/sh
(
set -eu
# Executed only by a fresh, task-owned postgres image entrypoint, not a remote DSN.
psql --no-psqlrc --username postgres --dbname postgres --set ON_ERROR_STOP=1 \
  --set test_password="$(cat /run/secrets/test_password)" \
  --set run_token="$(cat /run/secrets/run_token)" <<'SQL'
CREATE ROLE cruize_p03_test LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS PASSWORD :'test_password';
CREATE DATABASE cruize_p03_test;
REVOKE ALL ON DATABASE cruize_p03_test FROM PUBLIC;
GRANT CONNECT, CREATE ON DATABASE cruize_p03_test TO cruize_p03_test;
\connect cruize_p03_test
REVOKE ALL ON SCHEMA public FROM PUBLIC;
CREATE SCHEMA cruize_test_guard AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA cruize_test_guard FROM PUBLIC;
CREATE TABLE cruize_test_guard.metadata(key text PRIMARY KEY,value text NOT NULL);
INSERT INTO cruize_test_guard.metadata VALUES('environment','p03-disposable-v1'),('run_token',:'run_token');
GRANT USAGE ON SCHEMA cruize_test_guard TO cruize_p03_test;
GRANT SELECT ON cruize_test_guard.metadata TO cruize_p03_test;
SQL
)
