export type User = {
  id: string;
  firstName: string;
  surname: string;
  email: string;
  createdAt: string;
};

export type ExerciseInput = {
  name: string;
  setCount: number;
  targetReps: number;
  targetWeightKg: number;
};

export type Exercise = ExerciseInput & { id: string; position: number };

export type Workout = {
  id: string;
  name: string;
  position: number;
  exercises: Exercise[];
  createdAt: string;
  updatedAt: string;
};

export type AssignmentSet = {
  id: string;
  exercisePosition: number;
  exerciseName: string;
  setNumber: number;
  targetReps: number;
  targetWeightKg: number;
  actualReps: number | null;
  actualWeightKg: number | null;
  status: "pending" | "completed" | "skipped";
};

export type Assignment = {
  id: string;
  sourceWorkoutId: string | null;
  workoutPosition: number;
  workoutName: string;
  scheduledDate: string;
  status: "planned" | "completed" | "incomplete";
  sets: AssignmentSet[];
};

export type Dashboard = {
  date: string;
  activityName: string;
  assignmentId: string | null;
  status: "rest" | "planned" | "completed" | "incomplete";
  exercisesCompleted: number;
  totalExercises: number;
  repetitionsCompleted: number;
  totalRepetitions: number;
  weightPushedKg: number;
};

export type AuthResponse = { token: string; expiresAt: string; user: User };

export type FieldErrors = Record<string, string>;
