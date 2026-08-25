package domain

import (
	"net/mail"
	"strings"
)

type FieldErrors map[string]string

func ValidateRegistration(firstName, surname, email, password string) FieldErrors {
	errors := FieldErrors{}
	validateText(errors, "firstName", firstName, 1, 80)
	validateText(errors, "surname", surname, 1, 80)
	if len(email) > 254 {
		errors["email"] = "must be 254 characters or fewer"
	} else if parsed, err := mail.ParseAddress(email); err != nil || !strings.EqualFold(parsed.Address, strings.TrimSpace(email)) {
		errors["email"] = "must be a valid email address"
	}
	if len(password) < 10 {
		errors["password"] = "must be at least 10 characters"
	} else if len(password) > 128 {
		errors["password"] = "must be 128 characters or fewer"
	}
	return errors
}

func ValidateWorkout(name string, exercises []ExerciseInput) FieldErrors {
	errors := FieldErrors{}
	validateText(errors, "name", name, 1, 100)
	if len(exercises) == 0 {
		errors["exercises"] = "add at least one exercise"
	} else if len(exercises) > 50 {
		errors["exercises"] = "must contain 50 exercises or fewer"
	}
	for i, exercise := range exercises {
		prefix := "exercises[" + itoa(i) + "]"
		validateText(errors, prefix+".name", exercise.Name, 1, 100)
		if exercise.SetCount < 1 || exercise.SetCount > 20 {
			errors[prefix+".setCount"] = "must be between 1 and 20"
		}
		if exercise.TargetReps < 1 || exercise.TargetReps > 100 {
			errors[prefix+".targetReps"] = "must be between 1 and 100"
		}
		if exercise.TargetWeightKg < 0 || exercise.TargetWeightKg > 99999.99 {
			errors[prefix+".targetWeightKg"] = "must be between 0 and 99999.99"
		}
	}
	return errors
}

func validateText(errors FieldErrors, key, value string, min, max int) {
	length := len([]rune(strings.TrimSpace(value)))
	if length < min {
		errors[key] = "is required"
	} else if length > max {
		errors[key] = "is too long"
	}
}

func itoa(value int) string {
	if value == 0 {
		return "0"
	}
	buf := [20]byte{}
	i := len(buf)
	for value > 0 {
		i--
		buf[i] = byte('0' + value%10)
		value /= 10
	}
	return string(buf[i:])
}
