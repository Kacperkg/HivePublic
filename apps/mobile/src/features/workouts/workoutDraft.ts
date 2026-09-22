import type { ExerciseInput } from "@/api/types";

export const classicSplits = [
  "Push Day",
  "Pull Day",
  "Leg Day",
  "Upper Body",
  "Full Body",
  "Core",
] as const;

export const exerciseCatalog = [
  {
    group: "Chest",
    names: ["Bench Press", "Incline Dumbbell Press", "Cable Fly", "Push Up"],
  },
  {
    group: "Back",
    names: ["Deadlift", "Barbell Row", "Lat Pulldown", "Pull Up"],
  },
  {
    group: "Legs",
    names: ["Squat", "Leg Press", "Romanian Deadlift", "Lunge"],
  },
  {
    group: "Shoulders",
    names: ["Overhead Press", "Lateral Raise", "Face Pull"],
  },
  { group: "Arms", names: ["Bicep Curl", "Tricep Pushdown", "Hammer Curl"] },
  { group: "Core", names: ["Plank", "Crunch", "Hanging Leg Raise"] },
] as const;

export const newExercise = (name: string): ExerciseInput => ({
  name: name.trim(),
  setCount: 3,
  targetReps: 8,
  targetWeightKg: 20,
});

export const draftTotals = (exercises: ExerciseInput[]) => ({
  exercises: exercises.length,
  sets: exercises.reduce((total, exercise) => total + exercise.setCount, 0),
  reps: exercises.reduce(
    (total, exercise) => total + exercise.setCount * exercise.targetReps,
    0,
  ),
  volumeKg: exercises.reduce(
    (total, exercise) =>
      total + exercise.setCount * exercise.targetReps * exercise.targetWeightKg,
    0,
  ),
});

export const validateDraft = (name: string, exercises: ExerciseInput[]) => {
  if (!name.trim()) return "Give your workout a name.";
  if (name.trim().length > 100)
    return "Keep the workout name under 100 characters.";
  if (exercises.length === 0) return "Add at least one exercise.";
  if (exercises.length > 50)
    return "A workout can contain at most 50 exercises.";
  for (const exercise of exercises) {
    if (!exercise.name.trim()) return "Each exercise needs a name.";
    if (exercise.name.trim().length > 100)
      return "Keep exercise names under 100 characters.";
    if (
      !Number.isInteger(exercise.setCount) ||
      exercise.setCount < 1 ||
      exercise.setCount > 20
    )
      return "Sets must be between 1 and 20.";
    if (
      !Number.isInteger(exercise.targetReps) ||
      exercise.targetReps < 1 ||
      exercise.targetReps > 100
    )
      return "Reps must be between 1 and 100.";
    if (
      !Number.isFinite(exercise.targetWeightKg) ||
      exercise.targetWeightKg < 0 ||
      exercise.targetWeightKg > 99999.99
    )
      return "Weight must be between 0 and 99,999.99 kg.";
  }
  return null;
};
