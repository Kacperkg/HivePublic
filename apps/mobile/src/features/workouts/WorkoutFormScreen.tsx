import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import type { ExerciseInput, FieldErrors } from "@/api/types";
import { api } from "@/api/endpoints";
import { ApiError } from "@/api/client";
import { Screen } from "@/components/Screen";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/Button";
import { StateView } from "@/components/StateView";
import { colors, radii, spacing } from "@/theme/tokens";

const blankExercise = (): ExerciseInput => ({
  name: "",
  setCount: 3,
  targetReps: 8,
  targetWeightKg: 0,
});

export function WorkoutFormScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, "WorkoutForm">) {
  const workoutId = route.params?.workoutId;
  const query = useQuery({
    queryKey: ["workout", workoutId],
    queryFn: ({ signal }) => api.workout(workoutId!, signal),
    enabled: Boolean(workoutId),
  });
  if (workoutId && query.isPending)
    return (
      <Screen>
        <StateView kind="loading" />
      </Screen>
    );
  if (workoutId && query.isError)
    return (
      <Screen>
        <StateView
          kind="error"
          message="This workout could not be loaded."
          onRetry={() => void query.refetch()}
        />
      </Screen>
    );
  const initialExercises =
    query.data?.exercises.map(
      ({ name, setCount, targetReps, targetWeightKg }) => ({
        name,
        setCount,
        targetReps,
        targetWeightKg,
      }),
    ) ?? [];
  return (
    <WorkoutFormContent
      key={workoutId ?? "new"}
      workoutId={workoutId}
      initialName={query.data?.name ?? ""}
      initialExercises={initialExercises}
      navigation={navigation}
    />
  );
}

function WorkoutFormContent({
  workoutId,
  initialName,
  initialExercises,
  navigation,
}: {
  workoutId: string | undefined;
  initialName: string;
  initialExercises: ExerciseInput[];
  navigation: NativeStackScreenProps<
    RootStackParamList,
    "WorkoutForm"
  >["navigation"];
}) {
  const client = useQueryClient();
  const [name, setName] = useState(initialName);
  const [exercises, setExercises] = useState<ExerciseInput[]>(initialExercises);
  const [fields, setFields] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: () =>
      workoutId
        ? api.updateWorkout(workoutId, { name: name.trim(), exercises })
        : api.createWorkout({ name: name.trim(), exercises }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["workouts"] });
      navigation.goBack();
    },
    onError: (caught) => {
      if (caught instanceof ApiError) {
        setFields(caught.fields ?? {});
        setMessage(caught.message);
      } else setMessage("Workout could not be saved.");
    },
  });
  const updateExercise = (
    index: number,
    key: keyof ExerciseInput,
    value: string,
  ) =>
    setExercises((current) =>
      current.map((exercise, itemIndex) =>
        itemIndex === index
          ? {
              ...exercise,
              [key]:
                key === "name"
                  ? value
                  : Number(value.replace(/[^0-9.]/g, "")) || 0,
            }
          : exercise,
      ),
    );
  const submit = () => {
    setFields({});
    setMessage(null);
    mutation.mutate();
  };
  return (
    <Screen scroll keyboard contentStyle={styles.content}>
      <View style={styles.header}>
        <BackButton label="Back" />
        <Text style={styles.title}>
          {workoutId ? "EDIT WORKOUT" : "ADD WORKOUT"}
        </Text>
      </View>
      <TextInput
        accessibilityLabel="Workout name"
        placeholder="Workout Name"
        placeholderTextColor="#AAA"
        value={name}
        onChangeText={setName}
        style={[styles.nameInput, fields.name && styles.invalid]}
      />
      {fields.name ? (
        <Text style={styles.fieldError}>{fields.name}</Text>
      ) : null}
      {exercises.length === 0 ? (
        <Text style={styles.empty}>No exercises added yet.</Text>
      ) : (
        exercises.map((exercise, index) => (
          <View key={index} style={styles.exercise}>
            <View style={styles.exerciseHeader}>
              <TextInput
                accessibilityLabel={`Exercise ${index + 1} name`}
                placeholder="Exercise Name"
                placeholderTextColor="#AAA"
                value={exercise.name}
                onChangeText={(value) => updateExercise(index, "name", value)}
                style={styles.exerciseName}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Delete exercise ${index + 1}`}
                onPress={() =>
                  setExercises((current) =>
                    current.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
                style={styles.remove}
              >
                <Text style={styles.removeText}>Delete</Text>
              </Pressable>
            </View>
            <View style={styles.numbers}>
              <NumberField
                label="Sets"
                value={exercise.setCount}
                onChange={(value) => updateExercise(index, "setCount", value)}
              />
              <NumberField
                label="Reps"
                value={exercise.targetReps}
                onChange={(value) => updateExercise(index, "targetReps", value)}
              />
              <NumberField
                label="Weight"
                value={exercise.targetWeightKg}
                onChange={(value) =>
                  updateExercise(index, "targetWeightKg", value)
                }
              />
            </View>
            {Object.entries(fields)
              .filter(([key]) => key.startsWith(`exercises[${index}]`))
              .map(([key, value]) => (
                <Text key={key} style={styles.fieldError}>
                  {value}
                </Text>
              ))}
          </View>
        ))
      )}
      <Button
        label="+ ADD EXERCISE"
        variant="quiet"
        onPress={() => setExercises((current) => [...current, blankExercise()])}
      />
      {message ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {message}
        </Text>
      ) : null}
      <View style={styles.actions}>
        <Button
          label="CANCEL"
          variant="quiet"
          onPress={() => navigation.goBack()}
          style={styles.action}
        />
        <Button
          label={workoutId ? "SAVE" : "CREATE"}
          onPress={submit}
          loading={mutation.isPending}
          disabled={!name.trim() || exercises.length === 0}
          style={styles.action}
        />
      </View>
    </Screen>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange(value: string): void;
}) {
  return (
    <View style={styles.numberGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={String(value)}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        selectTextOnFocus
        style={styles.numberInput}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  header: { marginBottom: spacing.lg },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
    marginTop: spacing.md,
  },
  nameInput: {
    minHeight: 56,
    backgroundColor: colors.elevated,
    color: colors.text,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    fontSize: 16,
    marginBottom: spacing.md,
  },
  invalid: { borderColor: colors.primary, borderWidth: 1 },
  empty: {
    color: colors.textSubtle,
    textAlign: "center",
    marginVertical: spacing.xl,
  },
  exercise: {
    backgroundColor: colors.elevated,
    padding: spacing.md,
    borderRadius: radii.sm,
    marginBottom: spacing.md,
  },
  exerciseHeader: { flexDirection: "row", gap: spacing.xs },
  exerciseName: {
    minHeight: 50,
    flex: 1,
    backgroundColor: colors.input,
    color: colors.text,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
  },
  remove: {
    minWidth: 64,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
  },
  removeText: { color: colors.text, fontWeight: "700" },
  numbers: { flexDirection: "row", gap: spacing.xs, marginTop: spacing.md },
  numberGroup: { flex: 1 },
  label: { color: colors.textSubtle, fontSize: 13, marginBottom: spacing.xxs },
  numberInput: {
    minHeight: 48,
    backgroundColor: colors.input,
    color: colors.text,
    borderRadius: radii.sm,
    textAlign: "center",
    fontSize: 16,
  },
  fieldError: { color: colors.primary, fontSize: 12, marginTop: spacing.xxs },
  error: {
    color: colors.primary,
    textAlign: "center",
    marginVertical: spacing.md,
  },
  actions: { flexDirection: "row", gap: spacing.xs, marginTop: spacing.md },
  action: { flex: 1 },
});
