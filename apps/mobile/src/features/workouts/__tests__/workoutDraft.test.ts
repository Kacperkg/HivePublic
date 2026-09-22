import { draftTotals, newExercise, validateDraft } from "../workoutDraft";

test("calculates review totals from all exercise targets", () => {
  expect(draftTotals([newExercise("Bench Press")])).toEqual({
    exercises: 1,
    sets: 3,
    reps: 24,
    volumeKg: 480,
  });
});

test("prevents blank and out-of-range drafts before review", () => {
  expect(validateDraft("", [newExercise("Squat")])).toMatch(/name/);
  expect(validateDraft("Leg Day", [])).toMatch(/exercise/);
  expect(
    validateDraft("Leg Day", [{ ...newExercise("Squat"), setCount: 0 }]),
  ).toMatch(/Sets/);
  expect(validateDraft("Leg Day", [newExercise("Squat")])).toBeNull();
});
