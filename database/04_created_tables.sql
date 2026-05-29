/*
Creacion de tablas para flujos de ingresos, gastos y metas.
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto;


CREATE TABLE IF NOT EXISTS roles (
  id smallint PRIMARY KEY,
  name varchar(50) NOT NULL UNIQUE
);

INSERT INTO roles (id, name) VALUES
  (1, 'general'),
  (2, 'admin')
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
  SELECT 1 FROM pg_constraint WHERE conname = 'users_id_rol_check'
  ) THEN
  ALTER TABLE users ADD CONSTRAINT users_id_rol_check CHECK (id_rol IN (1,2));
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles') AND NOT EXISTS (
  SELECT 1 FROM pg_constraint WHERE conname = 'users_id_rol_fk'
  ) THEN
  ALTER TABLE users
    ADD CONSTRAINT users_id_rol_fk FOREIGN KEY (id_rol) REFERENCES roles(id);
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL,
  category_type varchar(20) NOT NULL
    CHECK (category_type IN ('income', 'expense', 'goal')),
  is_active boolean NOT NULL DEFAULT true,
  is_system boolean NOT NULL DEFAULT true,
  audit jsonb NOT NULL DEFAULT jsonb_build_object(
    'creacion',
    jsonb_build_object(
      'fecha', NOW(),
      'accion', 'CREACION'
    )
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS categories_name_type_unique_idx
  ON categories (name, category_type);

CREATE TABLE IF NOT EXISTS incomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category_id uuid NOT NULL,
  amount numeric(14, 2) NOT NULL CHECK (amount > 0),
  income_date date NOT NULL,
  periodicity varchar(20) NOT NULL
    CHECK (periodicity IN ('monthly', 'biweekly', 'one_time')),
  description varchar(255) NULL,
  status smallint NOT NULL DEFAULT 1
    CHECK (status IN (0, 1)),
  audit jsonb NOT NULL DEFAULT jsonb_build_object(
    'creacion',
    jsonb_build_object(
      'fecha', NOW(),
      'accion', 'CREACION'
    )
  ),
  CONSTRAINT incomes_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT incomes_category_id_fk FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE INDEX IF NOT EXISTS incomes_user_id_idx
  ON incomes (user_id);

CREATE INDEX IF NOT EXISTS incomes_category_id_idx
  ON incomes (category_id);

CREATE INDEX IF NOT EXISTS incomes_income_date_idx
  ON incomes (income_date);

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category_id uuid NOT NULL,
  amount numeric(14, 2) NOT NULL CHECK (amount > 0),
  expense_date date NOT NULL,
  expense_type varchar(20) NOT NULL
    CHECK (expense_type IN ('fixed', 'variable', 'one_time')),
  frequency_months smallint NULL
    CHECK (frequency_months IS NULL OR frequency_months > 0),
  description varchar(255) NULL,
  status smallint NOT NULL DEFAULT 1
    CHECK (status IN (0, 1)),
  audit jsonb NOT NULL DEFAULT jsonb_build_object(
    'creacion',
    jsonb_build_object(
      'fecha', NOW(),
      'accion', 'CREACION'
    )
  ),
  CONSTRAINT expenses_frequency_required_chk CHECK (
    (expense_type = 'variable' AND frequency_months IS NOT NULL)
    OR
    (expense_type IN ('fixed', 'one_time') AND frequency_months IS NULL)
  ),
  CONSTRAINT expenses_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT expenses_category_id_fk FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE INDEX IF NOT EXISTS expenses_user_id_idx
  ON expenses (user_id);

CREATE INDEX IF NOT EXISTS expenses_category_id_idx
  ON expenses (category_id);

CREATE INDEX IF NOT EXISTS expenses_expense_date_idx
  ON expenses (expense_date);

CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category_id uuid NOT NULL,
  name varchar(120) NOT NULL,
  description varchar(255) NULL,
  target_amount numeric(14, 2) NOT NULL CHECK (target_amount > 0),
  deadline date NULL,
  status varchar(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'cancelled')),
  audit jsonb NOT NULL DEFAULT jsonb_build_object(
    'creacion',
    jsonb_build_object(
      'fecha', NOW(),
      'accion', 'CREACION'
    )
  ),
  CONSTRAINT goals_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT goals_category_id_fk FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE INDEX IF NOT EXISTS goals_user_id_idx
  ON goals (user_id);

CREATE INDEX IF NOT EXISTS goals_category_id_idx
  ON goals (category_id);

CREATE INDEX IF NOT EXISTS goals_deadline_idx
  ON goals (deadline);

CREATE TABLE IF NOT EXISTS goal_deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL,
  user_id uuid NOT NULL,
  amount numeric(14, 2) NOT NULL CHECK (amount > 0),
  contribution_date date NOT NULL,
  note varchar(255) NULL,
  audit jsonb NOT NULL DEFAULT jsonb_build_object(
    'creacion',
    jsonb_build_object(
      'fecha', NOW(),
      'accion', 'CREACION'
    )
  ),
  CONSTRAINT goal_deposits_goal_id_fk FOREIGN KEY (goal_id) REFERENCES goals(id),
  CONSTRAINT goal_deposits_user_id_fk FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS goal_deposits_goal_id_idx
  ON goal_deposits (goal_id);

CREATE INDEX IF NOT EXISTS goal_deposits_user_id_idx
  ON goal_deposits (user_id);

CREATE INDEX IF NOT EXISTS goal_deposits_date_idx
  ON goal_deposits (contribution_date);

INSERT INTO categories (name, category_type)
VALUES
  ('Salario', 'income'),
  ('Trabajo independiente', 'income'),
  ('Ingreso extra', 'income'),
  ('Alimentacion', 'expense'),
  ('Transporte', 'expense'),
  ('Entretenimiento', 'expense'),
  ('Servicios', 'expense'),
  ('Salud', 'expense'),
  ('Viajes', 'goal'),
  ('Tecnologia', 'goal'),
  ('Educacion', 'goal'),
  ('Salud', 'goal'),
  ('Emergencia', 'goal'),
  ('Otros', 'goal')
ON CONFLICT (name, category_type) DO NOTHING;

INSERT INTO users (
  full_name,
  nickname,
  email,
  age,
  password_hash,
  id_rol,
  status,
  audit
)
VALUES (
  'Administrador Gasto Facil',
  'admin',
  'admin@gastofacil.com',
  30,
  '$2a$10$FNrNJIYoIEEUyoLFuPZt9.2Vhray1hniJJdRn9MDnNnUw83qG0mei',
  2,
  1,
  jsonb_build_object(
    'creacion',
    jsonb_build_object(
      'fecha', NOW(),
      'accion', 'CREACION'
    )
  )
)
ON CONFLICT ((LOWER(email))) DO NOTHING;
