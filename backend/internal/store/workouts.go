package store

import (
	"context"
	"database/sql"
	"errors"
	"strings"

	"github.com/kacperkg/the-hive/backend/internal/domain"
	"github.com/kacperkg/the-hive/backend/internal/identity"
)

func (s *Store) ListWorkouts(ctx context.Context, userID string) ([]domain.Workout, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, name, position, created_at, updated_at
		FROM workouts WHERE user_id = $1 ORDER BY position`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	workouts := make([]domain.Workout, 0)
	byID := make(map[string]int)
	for rows.Next() {
		var workout domain.Workout
		if err := rows.Scan(&workout.ID, &workout.Name, &workout.Position, &workout.CreatedAt, &workout.UpdatedAt); err != nil {
			return nil, err
		}
		workout.Exercises = []domain.Exercise{}
		byID[workout.ID] = len(workouts)
		workouts = append(workouts, workout)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if len(workouts) == 0 {
		return workouts, nil
	}
	exerciseRows, err := s.db.QueryContext(ctx, `
		SELECT e.workout_id, e.id, e.position, e.name, e.set_count, e.target_reps, e.target_weight_kg
		FROM exercises e
		JOIN workouts w ON w.id = e.workout_id
		WHERE w.user_id = $1
		ORDER BY w.position, e.position`, userID)
	if err != nil {
		return nil, err
	}
	defer exerciseRows.Close()
	for exerciseRows.Next() {
		var workoutID string
		var exercise domain.Exercise
		if err := exerciseRows.Scan(&workoutID, &exercise.ID, &exercise.Position, &exercise.Name,
			&exercise.SetCount, &exercise.TargetReps, &exercise.TargetWeightKg); err != nil {
			return nil, err
		}
		if index, ok := byID[workoutID]; ok {
			workouts[index].Exercises = append(workouts[index].Exercises, exercise)
		}
	}
	return workouts, exerciseRows.Err()
}

func (s *Store) GetWorkout(ctx context.Context, userID, workoutID string) (domain.Workout, error) {
	var workout domain.Workout
	err := s.db.QueryRowContext(ctx, `
		SELECT id, name, position, created_at, updated_at
		FROM workouts WHERE id = $1 AND user_id = $2`, workoutID, userID).Scan(
		&workout.ID, &workout.Name, &workout.Position, &workout.CreatedAt, &workout.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return domain.Workout{}, ErrNotFound
	}
	if err != nil {
		return domain.Workout{}, err
	}
	workout.Exercises, err = listExercises(ctx, s.db, workout.ID)
	return workout, err
}

func (s *Store) CreateWorkout(ctx context.Context, userID, name string, inputs []domain.ExerciseInput) (domain.Workout, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return domain.Workout{}, err
	}
	defer tx.Rollback()
	if _, err := tx.ExecContext(ctx, `SELECT 1 FROM users WHERE id = $1 FOR UPDATE`, userID); err != nil {
		return domain.Workout{}, err
	}
	workoutID, err := identity.UUID()
	if err != nil {
		return domain.Workout{}, err
	}
	var workout domain.Workout
	err = tx.QueryRowContext(ctx, `
		INSERT INTO workouts (id, user_id, name, position)
		SELECT $1, $2, $3, COALESCE(MAX(position), 0) + 1 FROM workouts WHERE user_id = $2
		RETURNING id, name, position, created_at, updated_at`, workoutID, userID, strings.TrimSpace(name)).Scan(
		&workout.ID, &workout.Name, &workout.Position, &workout.CreatedAt, &workout.UpdatedAt)
	if isUniqueViolation(err) {
		return domain.Workout{}, ErrConflict
	}
	if err != nil {
		return domain.Workout{}, err
	}
	workout.Exercises, err = insertExercises(ctx, tx, workout.ID, inputs)
	if err != nil {
		return domain.Workout{}, err
	}
	if err := tx.Commit(); err != nil {
		return domain.Workout{}, err
	}
	return workout, nil
}

func (s *Store) UpdateWorkout(ctx context.Context, userID, workoutID, name string, inputs []domain.ExerciseInput) (domain.Workout, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return domain.Workout{}, err
	}
	defer tx.Rollback()
	var workout domain.Workout
	err = tx.QueryRowContext(ctx, `
		UPDATE workouts SET name = $1, updated_at = now()
		WHERE id = $2 AND user_id = $3
		RETURNING id, name, position, created_at, updated_at`, strings.TrimSpace(name), workoutID, userID).Scan(
		&workout.ID, &workout.Name, &workout.Position, &workout.CreatedAt, &workout.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return domain.Workout{}, ErrNotFound
	}
	if isUniqueViolation(err) {
		return domain.Workout{}, ErrConflict
	}
	if err != nil {
		return domain.Workout{}, err
	}
	if _, err := tx.ExecContext(ctx, `DELETE FROM exercises WHERE workout_id = $1`, workoutID); err != nil {
		return domain.Workout{}, err
	}
	workout.Exercises, err = insertExercises(ctx, tx, workoutID, inputs)
	if err != nil {
		return domain.Workout{}, err
	}
	if err := tx.Commit(); err != nil {
		return domain.Workout{}, err
	}
	return workout, nil
}

func (s *Store) DeleteWorkout(ctx context.Context, userID, workoutID string) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if _, err := tx.ExecContext(ctx, `SELECT 1 FROM users WHERE id = $1 FOR UPDATE`, userID); err != nil {
		return err
	}
	result, err := tx.ExecContext(ctx, `DELETE FROM workouts WHERE id = $1 AND user_id = $2`, workoutID, userID)
	if err != nil {
		return err
	}
	count, _ := result.RowsAffected()
	if count == 0 {
		return ErrNotFound
	}
	if _, err := tx.ExecContext(ctx, `UPDATE workouts SET position = position + 100000 WHERE user_id = $1`, userID); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx, `
		WITH ordered AS (
			SELECT id, row_number() OVER (ORDER BY position)::integer AS new_position
			FROM workouts WHERE user_id = $1
		)
		UPDATE workouts SET position = ordered.new_position
		FROM ordered WHERE workouts.id = ordered.id`, userID); err != nil {
		return err
	}
	return tx.Commit()
}

func listExercises(ctx context.Context, db DBTX, workoutID string) ([]domain.Exercise, error) {
	rows, err := db.QueryContext(ctx, `
		SELECT id, position, name, set_count, target_reps, target_weight_kg
		FROM exercises WHERE workout_id = $1 ORDER BY position`, workoutID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	exercises := make([]domain.Exercise, 0)
	for rows.Next() {
		var exercise domain.Exercise
		if err := rows.Scan(&exercise.ID, &exercise.Position, &exercise.Name, &exercise.SetCount,
			&exercise.TargetReps, &exercise.TargetWeightKg); err != nil {
			return nil, err
		}
		exercises = append(exercises, exercise)
	}
	return exercises, rows.Err()
}

func insertExercises(ctx context.Context, tx *sql.Tx, workoutID string, inputs []domain.ExerciseInput) ([]domain.Exercise, error) {
	exercises := make([]domain.Exercise, 0, len(inputs))
	for index, input := range inputs {
		id, err := identity.UUID()
		if err != nil {
			return nil, err
		}
		exercise := domain.Exercise{ID: id, Position: index + 1, ExerciseInput: input}
		exercise.Name = strings.TrimSpace(exercise.Name)
		_, err = tx.ExecContext(ctx, `
			INSERT INTO exercises (id, workout_id, position, name, set_count, target_reps, target_weight_kg)
			VALUES ($1, $2, $3, $4, $5, $6, $7)`, id, workoutID, exercise.Position, exercise.Name,
			exercise.SetCount, exercise.TargetReps, exercise.TargetWeightKg)
		if err != nil {
			return nil, err
		}
		exercises = append(exercises, exercise)
	}
	return exercises, nil
}
