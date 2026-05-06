/*
sp de consulta de email de usuario para login
*/

CREATE OR REPLACE PROCEDURE sp_get_user_by_email(
    IN p_email varchar(160),
    OUT id uuid,
    OUT full_name varchar,
    OUT nickname varchar,
    OUT email varchar,
    OUT password_hash text,
    OUT status smallint,
    OUT audit jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
    SELECT
        u.id,
        u.full_name,
        u.nickname,
        u.email,
        u.password_hash,
        u.status,
        u.audit
    INTO
        id,
        full_name,
        nickname,
        email,
        password_hash,
        status,
        audit
    FROM users u
    WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(p_email))
    LIMIT 1;
END;
$$;
