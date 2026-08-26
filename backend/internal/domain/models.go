package domain

import "time"

type User struct {
	ID        string    `json:"id"`
	FirstName string    `json:"firstName"`
	Surname   string    `json:"surname"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"createdAt"`
}

type ExerciseInput struct {
	Name           string  `json:"name"`
	SetCount       int     `json:"setCount"`
	TargetReps     int     `json:"targetReps"`
	TargetWeightKg float64 `json:"targetWeightKg"`
}

type Exercise struct {
	ID       string `json:"id"`
	Position int    `json:"position"`
	ExerciseInput
}

type Workout struct {
	ID        string     `json:"id"`
	Name      string     `json:"name"`
	Position  int        `json:"position"`
	Exercises []Exercise `json:"exercises"`
	CreatedAt time.Time  `json:"createdAt"`
	UpdatedAt time.Time  `json:"updatedAt"`
}

type AssignmentSet struct {
	ID               string   `json:"id"`
	ExercisePosition int      `json:"exercisePosition"`
	ExerciseName     string   `json:"exerciseName"`
	SetNumber        int      `json:"setNumber"`
	TargetReps       int      `json:"targetReps"`
	TargetWeightKg   float64  `json:"targetWeightKg"`
	ActualReps       *int     `json:"actualReps"`
	ActualWeightKg   *float64 `json:"actualWeightKg"`
	Status           string   `json:"status"`
}

type Assignment struct {
	ID              string          `json:"id"`
	SourceWorkoutID *string         `json:"sourceWorkoutId"`
	WorkoutPosition int             `json:"workoutPosition"`
	WorkoutName     string          `json:"workoutName"`
	ScheduledDate   string          `json:"scheduledDate"`
	Status          string          `json:"status"`
	Sets            []AssignmentSet `json:"sets"`
}

type Dashboard struct {
	Date                 string  `json:"date"`
	ActivityName         string  `json:"activityName"`
	AssignmentID         *string `json:"assignmentId"`
	Status               string  `json:"status"`
	ExercisesCompleted   int     `json:"exercisesCompleted"`
	TotalExercises       int     `json:"totalExercises"`
	RepetitionsCompleted int     `json:"repetitionsCompleted"`
	TotalRepetitions     int     `json:"totalRepetitions"`
	WeightPushedKg       float64 `json:"weightPushedKg"`
}
