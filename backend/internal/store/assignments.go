package store

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/kacperkg/the-hive/backend/internal/domain"
	"github.com/kacperkg/the-hive/backend/internal/identity"
)

func (s *Store) ListAssignments(ctx context.Context, userID string, from, to time.Time) ([]domain.Assignment, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, source_workout_id, workout_position, workout_name, scheduled_date::text, status
		FROM assignments
		WHERE user_id = $1 AND scheduled_date BETWEEN $2 AND $3
		ORDER BY scheduled_date`, userID, from, to)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	assignments := make([]domain.Assignment, 0)
	for rows.Next() {
		var assignment domain.Assignment
		if err := rows.Scan(&assignment.ID, &assignment.SourceWorkoutID, &assignment.WorkoutPosition, &assignment.WorkoutName,
			&assignment.ScheduledDate, &assignment.Status); err != nil {
			return nil, err
		}
		assignment.Sets = []domain.AssignmentSet{}
		assignments = append(assignments, assignment)
	}
	return assignments, rows.Err()
}

func (s *Store) GetAssignment(ctx context.Context, userID string, date time.Time) (domain.Assignment, error) {
	var assignment domain.Assignment
	err := s.db.QueryRowContext(ctx, `
		SELECT id, source_workout_id, workout_position, workout_name, scheduled_date::text, status
		FROM assignments WHERE user_id = $1 AND scheduled_date = $2`, userID, date).Scan(
		&assignment.ID, &assignment.SourceWorkoutID, &assignment.WorkoutPosition, &assignment.WorkoutName, &assignment.ScheduledDate, &assignment.Status)
	if errors.Is(err, sql.ErrNoRows) {
		return domain.Assignment{}, ErrNotFound
	}
	if err != nil {
		return domain.Assignment{}, err
	}
	assignment.Sets, err = listAssignmentSets(ctx, s.db, assignment.ID)
	return assignment, err
}

func (s *Store) AssignWorkout(ctx context.Context, userID, workoutID string, date time.Time) (domain.Assignment, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return domain.Assignment{}, err
	}
	defer tx.Rollback()
	var lockedUser string
	if err := tx.QueryRowContext(ctx, `SELECT id FROM users WHERE id = $1 FOR UPDATE`, userID).Scan(&lockedUser); err != nil {
		return domain.Assignment{}, err
	}
	var workoutName string
	var workoutPosition int
	err = tx.QueryRowContext(ctx, `SELECT name, position FROM workouts WHERE id = $1 AND user_id = $2`, workoutID, userID).Scan(&workoutName, &workoutPosition)
	if errors.Is(err, sql.ErrNoRows) {
		return domain.Assignment{}, ErrNotFound
	}
	if err != nil {
		return domain.Assignment{}, err
	}
	if _, err := tx.ExecContext(ctx, `DELETE FROM assignments WHERE user_id = $1 AND scheduled_date = $2`, userID, date); err != nil {
		return domain.Assignment{}, err
	}
	assignmentID, err := identity.UUID()
	if err != nil {
		return domain.Assignment{}, err
	}
	var assignment domain.Assignment
	err = tx.QueryRowContext(ctx, `
		INSERT INTO assignments (id, user_id, source_workout_id, workout_position, workout_name, scheduled_date)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, source_workout_id, workout_position, workout_name, scheduled_date::text, status`,
		assignmentID, userID, workoutID, workoutPosition, workoutName, date).Scan(
		&assignment.ID, &assignment.SourceWorkoutID, &assignment.WorkoutPosition, &assignment.WorkoutName, &assignment.ScheduledDate, &assignment.Status)
	if err != nil {
		return domain.Assignment{}, err
	}
	exerciseRows, err := tx.QueryContext(ctx, `
		SELECT position, name, set_count, target_reps, target_weight_kg
		FROM exercises WHERE workout_id = $1 ORDER BY position`, workoutID)
	if err != nil {
		return domain.Assignment{}, err
	}
	type snapshot struct {
		position, setCount, reps int
		name                     string
		weight                   float64
	}
	snapshots := make([]snapshot, 0)
	for exerciseRows.Next() {
		var item snapshot
		if err := exerciseRows.Scan(&item.position, &item.name, &item.setCount, &item.reps, &item.weight); err != nil {
			exerciseRows.Close()
			return domain.Assignment{}, err
		}
		snapshots = append(snapshots, item)
	}
	if err := exerciseRows.Close(); err != nil {
		return domain.Assignment{}, err
	}
	assignment.Sets = make([]domain.AssignmentSet, 0)
	for _, item := range snapshots {
		for setNumber := 1; setNumber <= item.setCount; setNumber++ {
			setID, err := identity.UUID()
			if err != nil {
				return domain.Assignment{}, err
			}
			_, err = tx.ExecContext(ctx, `
				INSERT INTO assignment_sets
					(id, assignment_id, exercise_position, exercise_name, set_number, target_reps, target_weight_kg)
				VALUES ($1, $2, $3, $4, $5, $6, $7)`, setID, assignment.ID, item.position,
				item.name, setNumber, item.reps, item.weight)
			if err != nil {
				return domain.Assignment{}, err
			}
			assignment.Sets = append(assignment.Sets, domain.AssignmentSet{
				ID: setID, ExercisePosition: item.position, ExerciseName: item.name,
				SetNumber: setNumber, TargetReps: item.reps, TargetWeightKg: item.weight, Status: "pending",
			})
		}
	}
	if err := tx.Commit(); err != nil {
		return domain.Assignment{}, err
	}
	return assignment, nil
}

func (s *Store) DeleteAssignment(ctx context.Context, userID string, date time.Time) error {
	result, err := s.db.ExecContext(ctx, `DELETE FROM assignments WHERE user_id = $1 AND scheduled_date = $2`, userID, date)
	if err != nil {
		return err
	}
	count, _ := result.RowsAffected()
	if count == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Store) UpdateAssignmentSet(ctx context.Context, userID string, date time.Time, setID, status string, reps *int, weight *float64) (domain.AssignmentSet, error) {
	var set domain.AssignmentSet
	err := s.db.QueryRowContext(ctx, `
		UPDATE assignment_sets s SET
			status = $1,
			actual_reps = CASE WHEN $1 = 'completed' THEN $2::integer ELSE NULL END,
			actual_weight_kg = CASE WHEN $1 = 'completed' THEN $3::numeric ELSE NULL END,
			completed_at = CASE WHEN $1 = 'pending' THEN NULL ELSE now() END
		FROM assignments a
		WHERE s.id = $4 AND s.assignment_id = a.id AND a.user_id = $5 AND a.scheduled_date = $6
		RETURNING s.id, s.exercise_position, s.exercise_name, s.set_number, s.target_reps,
			s.target_weight_kg, s.actual_reps, s.actual_weight_kg, s.status`,
		status, reps, weight, setID, userID, date).Scan(&set.ID, &set.ExercisePosition, &set.ExerciseName,
		&set.SetNumber, &set.TargetReps, &set.TargetWeightKg, &set.ActualReps, &set.ActualWeightKg, &set.Status)
	if errors.Is(err, sql.ErrNoRows) {
		return domain.AssignmentSet{}, ErrNotFound
	}
	return set, err
}

func (s *Store) FinalizeAssignment(ctx context.Context, userID string, date time.Time) (domain.Assignment, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return domain.Assignment{}, err
	}
	defer tx.Rollback()
	var assignmentID string
	err = tx.QueryRowContext(ctx, `
		SELECT id FROM assignments WHERE user_id = $1 AND scheduled_date = $2 FOR UPDATE`, userID, date).Scan(&assignmentID)
	if errors.Is(err, sql.ErrNoRows) {
		return domain.Assignment{}, ErrNotFound
	}
	if err != nil {
		return domain.Assignment{}, err
	}
	var pending int
	if err := tx.QueryRowContext(ctx, `SELECT count(*) FROM assignment_sets WHERE assignment_id = $1 AND status = 'pending'`, assignmentID).Scan(&pending); err != nil {
		return domain.Assignment{}, err
	}
	status := "incomplete"
	if pending == 0 {
		status = "completed"
	}
	_, err = tx.ExecContext(ctx, `
		UPDATE assignments SET status = $1, completed_at = now(), updated_at = now() WHERE id = $2`, status, assignmentID)
	if err != nil {
		return domain.Assignment{}, err
	}
	if err := tx.Commit(); err != nil {
		return domain.Assignment{}, err
	}
	return s.GetAssignment(ctx, userID, date)
}

func (s *Store) Dashboard(ctx context.Context, userID string, date time.Time) (domain.Dashboard, error) {
	dashboard := domain.Dashboard{Date: date.Format("2006-01-02"), ActivityName: "Rest", Status: "rest"}
	var assignmentID string
	var name, status string
	err := s.db.QueryRowContext(ctx, `
		SELECT id, workout_name, status FROM assignments WHERE user_id = $1 AND scheduled_date = $2`, userID, date).Scan(
		&assignmentID, &name, &status)
	if errors.Is(err, sql.ErrNoRows) {
		return dashboard, nil
	}
	if err != nil {
		return domain.Dashboard{}, err
	}
	dashboard.AssignmentID = &assignmentID
	dashboard.ActivityName = name
	dashboard.Status = status
	if status == "completed" {
		dashboard.ActivityName = "Completed"
	}
	err = s.db.QueryRowContext(ctx, `
		WITH per_exercise AS (
			SELECT exercise_position,
				bool_and(status = 'completed') AS completed,
				sum(target_reps)::integer AS target_reps,
				sum(CASE WHEN status = 'completed' THEN actual_reps ELSE 0 END)::integer AS actual_reps,
				sum(CASE WHEN status = 'completed' THEN actual_reps * actual_weight_kg ELSE 0 END)::double precision AS volume
			FROM assignment_sets WHERE assignment_id = $1 GROUP BY exercise_position
		)
		SELECT count(*)::integer,
			count(*) FILTER (WHERE completed)::integer,
			COALESCE(sum(target_reps), 0)::integer,
			COALESCE(sum(actual_reps), 0)::integer,
			COALESCE(sum(volume), 0)::double precision
		FROM per_exercise`, assignmentID).Scan(&dashboard.TotalExercises, &dashboard.ExercisesCompleted,
		&dashboard.TotalRepetitions, &dashboard.RepetitionsCompleted, &dashboard.WeightPushedKg)
	return dashboard, err
}

func listAssignmentSets(ctx context.Context, db DBTX, assignmentID string) ([]domain.AssignmentSet, error) {
	rows, err := db.QueryContext(ctx, `
		SELECT id, exercise_position, exercise_name, set_number, target_reps, target_weight_kg,
			actual_reps, actual_weight_kg, status
		FROM assignment_sets WHERE assignment_id = $1 ORDER BY exercise_position, set_number`, assignmentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	sets := make([]domain.AssignmentSet, 0)
	for rows.Next() {
		var set domain.AssignmentSet
		if err := rows.Scan(&set.ID, &set.ExercisePosition, &set.ExerciseName, &set.SetNumber,
			&set.TargetReps, &set.TargetWeightKg, &set.ActualReps, &set.ActualWeightKg, &set.Status); err != nil {
			return nil, err
		}
		sets = append(sets, set)
	}
	return sets, rows.Err()
}
