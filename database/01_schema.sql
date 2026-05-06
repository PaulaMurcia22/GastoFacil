/*
Creacion de tablas
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name varchar(120) NOT NULL,
    nickname varchar(80) NOT NULL,
    email varchar(160) NOT NULL,
    age integer NOT NULL,
    password_hash text NOT NULL,
    status smallint NOT NULL DEFAULT 1
        CHECK (status IN (0, 1)),
    audit jsonb NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx
    ON users (LOWER(email));
