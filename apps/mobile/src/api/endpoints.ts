import { request } from "./client";
import type {
  Assignment,
  AssignmentSet,
  AuthResponse,
  Dashboard,
  ExerciseInput,
  User,
  Workout,
} from "./types";

const withSignal = (signal?: AbortSignal) => (signal ? { signal } : {});

export const api = {
  register: (input: {
    firstName: string;
    surname: string;
    email: string;
    password: string;
  }) =>
    request<AuthResponse>("/auth/register", { method: "POST", body: input }),
  login: (input: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: input }),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  me: () => request<User>("/me"),
  workouts: (signal?: AbortSignal) =>
    request<Workout[]>("/workouts", withSignal(signal)),
  workout: (id: string, signal?: AbortSignal) =>
    request<Workout>(`/workouts/${id}`, withSignal(signal)),
  createWorkout: (input: { name: string; exercises: ExerciseInput[] }) =>
    request<Workout>("/workouts", { method: "POST", body: input }),
  updateWorkout: (
    id: string,
    input: { name: string; exercises: ExerciseInput[] },
  ) => request<Workout>(`/workouts/${id}`, { method: "PUT", body: input }),
  deleteWorkout: (id: string) =>
    request<void>(`/workouts/${id}`, { method: "DELETE" }),
  assignments: (from: string, to: string, signal?: AbortSignal) =>
    request<Assignment[]>(
      `/assignments?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      withSignal(signal),
    ),
  assignment: (date: string, signal?: AbortSignal) =>
    request<Assignment>(`/assignments/${date}`, withSignal(signal)),
  assign: (date: string, workoutId: string) =>
    request<Assignment>(`/assignments/${date}`, {
      method: "PUT",
      body: { workoutId },
    }),
  unassign: (date: string) =>
    request<void>(`/assignments/${date}`, { method: "DELETE" }),
  updateSet: (
    date: string,
    setId: string,
    input: {
      status: "completed" | "skipped";
      actualReps?: number;
      actualWeightKg?: number;
    },
  ) =>
    request<AssignmentSet>(`/assignments/${date}/sets/${setId}`, {
      method: "PATCH",
      body: input,
    }),
  finalize: (date: string) =>
    request<Assignment>(`/assignments/${date}/finalize`, { method: "POST" }),
  dashboard: (date: string, signal?: AbortSignal) =>
    request<Dashboard>(`/dashboard/${date}`, withSignal(signal)),
};
