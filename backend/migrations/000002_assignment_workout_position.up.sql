ALTER TABLE assignments ADD COLUMN workout_position integer;

UPDATE assignments AS assignment
SET workout_position = workout.position
FROM workouts AS workout
WHERE assignment.source_workout_id = workout.id;

UPDATE assignments SET workout_position = 1 WHERE workout_position IS NULL;

ALTER TABLE assignments
    ALTER COLUMN workout_position SET NOT NULL,
    ADD CONSTRAINT assignments_workout_position_positive CHECK (workout_position > 0);
