-- Script para crear las bases de datos de los microservicios
-- Este script se ejecuta cuando PostgreSQL inicia por primera vez

-- Create tournament database
CREATE DATABASE tournament_db;

-- Create player database
CREATE DATABASE player_db;

-- Create message database
CREATE DATABASE message_db;

-- security_db already exists as the default POSTGRES_DB
