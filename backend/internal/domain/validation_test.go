package domain

import "testing"

func TestValidateRegistration(t *testing.T) {
	t.Parallel()
	valid := ValidateRegistration("Kacper", "Tester", "user@example.com", "correct-horse-battery")
	if len(valid) != 0 {
		t.Fatalf("expected valid registration, got %#v", valid)
	}
	invalid := ValidateRegistration("", "", "not-an-email", "short")
	for _, field := range []string{"firstName", "surname", "email", "password"} {
		if _, ok := invalid[field]; !ok {
			t.Errorf("expected %s validation error", field)
		}
	}
}

func TestValidateWorkoutEdgeCases(t *testing.T) {
	t.Parallel()
	errors := ValidateWorkout("Legs", []ExerciseInput{{Name: "Squat", SetCount: 21, TargetReps: 0, TargetWeightKg: -1}})
	for _, field := range []string{"exercises[0].setCount", "exercises[0].targetReps", "exercises[0].targetWeightKg"} {
		if _, ok := errors[field]; !ok {
			t.Errorf("expected %s validation error", field)
		}
	}
}
