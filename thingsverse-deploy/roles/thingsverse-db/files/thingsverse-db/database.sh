#!/usr/bin/env bash
sudo apt-get install postgresql
sudo passwd postgres
su - postgres
psql postgres
CREATE ROLE thingsverse WITH LOGIN PASSWORD 'thingsverse';
CREATE DATABASE thingsverse;
GRANT ALL PRIVILEGES ON DATABASE thingsverse TO thingsverse;