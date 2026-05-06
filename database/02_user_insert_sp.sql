/*
SP de creacion de usuarios
*/

CREATE OR REPLACE PROCEDURE sp_create_user(
    IN p_full_name varchar(120),
    IN p_nickname varchar(80),
    IN p_email varchar(160),
    IN p_age integer,
    IN p_password_hash text
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO users (
        full_name,
        nickname,
        email,
        age,
        password_hash,
        status,
        audit
    )
    VALUES (
        TRIM(p_full_name),
        TRIM(p_nickname),
        LOWER(TRIM(p_email)),
        p_age,
        p_password_hash,
        1,
        jsonb_build_object(
            'creacion',
            jsonb_build_object(
                'fecha', NOW(),
                'accion', 'CREACION'
            )
        )
    );
END;
$$;
