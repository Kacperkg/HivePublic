CREATE TABLE users (
    id uuid PRIMARY KEY,
    first_name text NOT NULL CHECK (char_length(first_name) BETWEEN 1 AND 80),
    surname text NOT NULL CHECK (char_length(surname) BETWEEN 1 AND 80),
    email text NOT NULL CHECK (char_length(email) <= 254),
    password_hash text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX users_email_lower_uidx ON users (lower(email));

CREATE TABLE sessions (
    id uuid PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash bytea NOT NULL UNIQUE,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    last_used_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sessions_user_id_idx ON sessions (user_id);
CREATE INDEX sessions_expires_at_idx ON sessions (expires_at);

CREATE TABLE workouts (
    id uuid PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
    position integer NOT NULL CHECK (position > 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, position)
);

CREATE UNIQUE INDEX workouts_user_name_lower_uidx ON workouts (user_id, lower(name));
CREATE INDEX workouts_user_position_idx ON workouts (user_id, position);

CREATE TABLE exercises (
    id uuid PRIMARY KEY,
    workout_id uuid NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    position integer NOT NULL CHECK (position > 0),
    name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
    set_count integer NOT NULL CHECK (set_count BETWEEN 1 AND 20),
    target_reps integer NOT NULL CHECK (target_reps BETWEEN 1 AND 100),
    target_weight_kg numeric(7,2) NOT NULL CHECK (target_weight_kg >= 0),
    UNIQUE (workout_id, position)
);

CREATE INDEX exercises_workout_position_idx ON exercises (workout_id, position);

CREATE TABLE assignments (
    id uuid PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_workout_id uuid REFERENCES workouts(id) ON DELETE SET NULL,
    workout_name text NOT NULL CHECK (char_length(workout_name) BETWEEN 1 AND 100),
    scheduled_date date NOT NULL,
    status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'completed', 'incomplete')),
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, scheduled_date)
);

CREATE INDEX assignments_user_date_idx ON assignments (user_id, scheduled_date);

CREATE TABLE assignment_sets (
    id uuid PRIMARY KEY,
    assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    exercise_position integer NOT NULL CHECK (exercise_position > 0),
    exercise_name text NOT NULL CHECK (char_length(exercise_name) BETWEEN 1 AND 100),
    set_number integer NOT NULL CHECK (set_number > 0),
    target_reps integer NOT NULL CHECK (target_reps BETWEEN 1 AND 100),
    target_weight_kg numeric(7,2) NOT NULL CHECK (target_weight_kg >= 0),
    actual_reps integer CHECK (actual_reps BETWEEN 0 AND 100),
    actual_weight_kg numeric(7,2) CHECK (actual_weight_kg >= 0),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
    completed_at timestamptz,
    UNIQUE (assignment_id, exercise_position, set_number)
);

CREATE INDEX assignment_sets_assignment_order_idx
    ON assignment_sets (assignment_id, exercise_position, set_number);
