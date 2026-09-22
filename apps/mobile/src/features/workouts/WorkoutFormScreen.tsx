import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import type { ExerciseInput } from "@/api/types";
import { api } from "@/api/endpoints";
import { ApiError } from "@/api/client";
import { Screen } from "@/components/Screen";
import { BackIcon } from "@/components/Icons";
import { Button } from "@/components/Button";
import { StateView } from "@/components/StateView";
import { colors, radii, spacing } from "@/theme/tokens";
import {
  classicSplits,
  draftTotals,
  exerciseCatalog,
  newExercise,
  validateDraft,
} from "./workoutDraft";

type Props = NativeStackScreenProps<RootStackParamList, "WorkoutForm">;
type Step = 1 | 2 | 3 | "picker";

export function WorkoutFormScreen({ route, navigation }: Props) {
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
  return (
    <WorkoutBuilder
      key={workoutId ?? "new"}
      workoutId={workoutId}
      initialName={query.data?.name ?? ""}
      initialExercises={
        query.data?.exercises.map(
          ({ name, setCount, targetReps, targetWeightKg }) => ({
            name,
            setCount,
            targetReps,
            targetWeightKg,
          }),
        ) ?? []
      }
      navigation={navigation}
    />
  );
}

function WorkoutBuilder({
  workoutId,
  initialName,
  initialExercises,
  navigation,
}: {
  workoutId: string | undefined;
  initialName: string;
  initialExercises: ExerciseInput[];
  navigation: Props["navigation"];
}) {
  const client = useQueryClient();
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState(initialName);
  const [exercises, setExercises] = useState(initialExercises);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const totals = useMemo(() => draftTotals(exercises), [exercises]);
  const mutation = useMutation({
    mutationFn: () => {
      const input = {
        name: name.trim(),
        exercises: exercises.map((item) => ({
          ...item,
          name: item.name.trim(),
        })),
      };
      return workoutId
        ? api.updateWorkout(workoutId, input)
        : api.createWorkout(input);
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["workouts"] });
      navigation.goBack();
    },
    onError: (error) =>
      setMessage(
        error instanceof ApiError
          ? error.message
          : "The workout could not be saved. Please try again.",
      ),
  });
  const goBack = () => {
    setMessage(null);
    if (step === "picker" || step === 3) setStep(2);
    else if (step === 2) setStep(1);
    else navigation.goBack();
  };
  const goForward = () => {
    setMessage(null);
    if (step === 1) {
      if (!name.trim())
        return setMessage("Give your workout a name to continue.");
      if (name.trim().length > 100)
        return setMessage("Keep the workout name under 100 characters.");
      setStep(2);
    } else if (step === 2 || step === 3) {
      const problem = validateDraft(name, exercises);
      if (problem) return setMessage(problem);
      if (step === 2) setStep(3);
      else mutation.mutate();
    }
  };
  const addExercise = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (exercises.length >= 50)
      return setMessage("A workout can contain at most 50 exercises.");
    setExercises((items) => [...items, newExercise(trimmed)]);
    setSearch("");
    setMessage(null);
    setStep(2);
  };
  const changeExercise = (index: number, patch: Partial<ExerciseInput>) =>
    setExercises((items) =>
      items.map((item, position) =>
        position === index ? { ...item, ...patch } : item,
      ),
    );
  const moveExercise = (index: number, offset: number) => {
    const next = index + offset;
    if (next < 0 || next >= exercises.length) return;
    setExercises((items) => {
      const copy = [...items];
      [copy[index], copy[next]] = [copy[next]!, copy[index]!];
      return copy;
    });
  };
  const currentStep = step === "picker" ? 2 : step;
  const title =
    step === 1
      ? "Name your workout"
      : step === 2
        ? "Build the session"
        : step === "picker"
          ? "Choose an exercise"
          : "Review & save";
  const matching = exerciseCatalog
    .map((group) => ({
      group: group.group,
      names: group.names.filter((item) =>
        item.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    }))
    .filter((group) => group.names.length > 0);
  const exactMatch = exerciseCatalog.some((group) =>
    group.names.some(
      (item) => item.toLowerCase() === search.trim().toLowerCase(),
    ),
  );

  return (
    <Screen keyboard contentStyle={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>STEP {currentStep} OF 3</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={goBack}
          style={styles.headerBack}
        >
          <BackIcon />
        </Pressable>
      </View>
      <View style={styles.progressTrack}>
        {[1, 2, 3].map((value) => (
          <View
            key={value}
            style={[
              styles.progressSegment,
              value <= currentStep && styles.progressFilled,
            ]}
          />
        ))}
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
      >
        {step === 1 ? (
          <>
            <TextInput
              accessibilityLabel="Workout name"
              autoFocus={!workoutId}
              maxLength={100}
              placeholder="Workout name"
              placeholderTextColor={colors.textSubtle}
              value={name}
              onChangeText={setName}
              returnKeyType="done"
              onSubmitEditing={goForward}
              style={styles.nameInput}
            />
            <Text style={styles.sectionLabel}>
              OR START FROM A CLASSIC SPLIT
            </Text>
            <View style={styles.chips}>
              {classicSplits.map((split) => (
                <Pressable
                  key={split}
                  accessibilityRole="button"
                  accessibilityLabel={`Use ${split}`}
                  onPress={() => setName(split)}
                  style={[styles.chip, name === split && styles.chipSelected]}
                >
                  <Text style={styles.chipText}>{split}</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : step === "picker" ? (
          <>
            <TextInput
              accessibilityLabel="Search or enter exercise name"
              autoFocus
              maxLength={100}
              placeholder="Search or type a custom name"
              placeholderTextColor={colors.textSubtle}
              value={search}
              onChangeText={setSearch}
              returnKeyType="done"
              onSubmitEditing={() => addExercise(search)}
              style={styles.searchInput}
            />
            {search.trim() && !exactMatch ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => addExercise(search)}
                style={styles.catalogItem}
              >
                <Text style={styles.catalogText}>Add “{search.trim()}”</Text>
                <Text style={styles.plus}>＋</Text>
              </Pressable>
            ) : null}
            {matching.map((group) => (
              <View key={group.group}>
                <Text style={styles.sectionLabel}>
                  {group.group.toUpperCase()}
                </Text>
                {group.names.map((item) => (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${item}`}
                    onPress={() => addExercise(item)}
                    style={styles.catalogItem}
                  >
                    <Text style={styles.catalogText}>{item}</Text>
                    <Text style={styles.plus}>＋</Text>
                  </Pressable>
                ))}
              </View>
            ))}
          </>
        ) : step === 2 ? (
          <>
            {exercises.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No exercises yet</Text>
                <Text style={styles.hint}>
                  Pick your lifts, then set targets for each.
                </Text>
              </View>
            ) : null}
            {exercises.map((exercise, index) => (
              <View key={index} style={styles.exerciseCard}>
                <View style={styles.exerciseHeading}>
                  <View style={styles.orderBadge}>
                    <Text style={styles.orderText}>{index + 1}</Text>
                  </View>
                  <View style={styles.exerciseHeadingText}>
                    <Text numberOfLines={1} style={styles.exerciseTitle}>
                      {exercise.name || `Exercise ${index + 1}`}
                    </Text>
                    <Text style={styles.exerciseSummary}>
                      {exercise.setCount} × {exercise.targetReps} @{" "}
                      {exercise.targetWeightKg} kg
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Move ${exercise.name} up`}
                    disabled={index === 0}
                    onPress={() => moveExercise(index, -1)}
                    style={styles.orderControl}
                  >
                    <Text style={styles.orderGlyph}>↑</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Move ${exercise.name} down`}
                    disabled={index === exercises.length - 1}
                    onPress={() => moveExercise(index, 1)}
                    style={styles.orderControl}
                  >
                    <Text style={styles.orderGlyph}>↓</Text>
                  </Pressable>
                </View>
                <TextInput
                  accessibilityLabel={`Exercise ${index + 1} name`}
                  value={exercise.name}
                  onChangeText={(value) =>
                    changeExercise(index, { name: value })
                  }
                  maxLength={100}
                  style={styles.exerciseNameInput}
                />
                <View style={styles.targets}>
                  <TargetControl
                    label="SETS"
                    value={exercise.setCount}
                    min={1}
                    max={20}
                    step={1}
                    onChange={(value) =>
                      changeExercise(index, { setCount: value })
                    }
                  />
                  <TargetControl
                    label="REPS"
                    value={exercise.targetReps}
                    min={1}
                    max={100}
                    step={1}
                    onChange={(value) =>
                      changeExercise(index, { targetReps: value })
                    }
                  />
                  <TargetControl
                    label="WEIGHT"
                    value={exercise.targetWeightKg}
                    min={0}
                    max={99999.99}
                    step={2.5}
                    onChange={(value) =>
                      changeExercise(index, { targetWeightKg: value })
                    }
                    unit="KG"
                  />
                </View>
                <View style={styles.cardActions}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      setExercises((items) => [
                        ...items.slice(0, index + 1),
                        { ...exercise },
                        ...items.slice(index + 1),
                      ])
                    }
                    style={styles.cardAction}
                  >
                    <Text style={styles.cardActionText}>DUPLICATE</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      setExercises((items) =>
                        items.filter((_, position) => position !== index),
                      )
                    }
                    style={styles.cardAction}
                  >
                    <Text style={styles.removeText}>REMOVE</Text>
                  </Pressable>
                </View>
              </View>
            ))}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add exercise"
              onPress={() => setStep("picker")}
              style={styles.addExercise}
            >
              <Text style={styles.addExerciseText}>＋ ADD EXERCISE</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Rename workout"
              onPress={() => setStep(1)}
              style={styles.reviewName}
            >
              <Text style={styles.sectionLabel}>WORKOUT</Text>
              <Text style={styles.reviewTitle}>{name.trim()}</Text>
              <Text style={styles.hint}>RENAME</Text>
            </Pressable>
            <View style={styles.summaryStats}>
              <SummaryStat label="EXERCISES" value={totals.exercises} />
              <SummaryStat label="SETS" value={totals.sets} />
              <SummaryStat
                label="VOLUME"
                value={`${totals.volumeKg.toLocaleString()} kg`}
              />
            </View>
            {exercises.map((exercise, index) => (
              <Pressable
                key={index}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${exercise.name}`}
                onPress={() => setStep(2)}
                style={styles.reviewRow}
              >
                <View style={styles.orderBadge}>
                  <Text style={styles.orderText}>{index + 1}</Text>
                </View>
                <Text numberOfLines={1} style={styles.reviewExercise}>
                  {exercise.name}
                </Text>
                <Text style={styles.reviewTargets}>
                  {exercise.setCount} × {exercise.targetReps} @{" "}
                  {exercise.targetWeightKg} kg
                </Text>
              </Pressable>
            ))}
            <Text style={styles.reviewFooter}>
              Target reps this session: {totals.reps}
            </Text>
          </>
        )}
        {message ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {message}
          </Text>
        ) : null}
      </ScrollView>
      <View style={styles.footer}>
        {step !== 1 ? (
          <Button
            label="BACK"
            variant="secondary"
            onPress={goBack}
            style={styles.footerButton}
          />
        ) : null}
        {step !== "picker" ? (
          <Button
            label={
              step === 1
                ? "CONTINUE"
                : step === 2
                  ? "REVIEW"
                  : workoutId
                    ? "SAVE"
                    : "CREATE"
            }
            onPress={goForward}
            loading={mutation.isPending}
            disabled={
              (step === 1 && !name.trim()) ||
              (step === 2 && exercises.length === 0)
            }
            style={styles.footerButton}
          />
        ) : null}
      </View>
    </Screen>
  );
}

function TargetControl({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange(value: number): void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const set = (next: number) => {
    setDraft(null);
    const clamped = Math.min(max, Math.max(min, next));
    onChange(
      label === "WEIGHT"
        ? Math.round(clamped * 100) / 100
        : Math.round(clamped),
    );
  };
  return (
    <View style={styles.targetGroup}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.targetRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label.toLowerCase()}`}
          onPress={() => set(value - step)}
          style={styles.targetButton}
        >
          <Text style={styles.targetButtonText}>−</Text>
        </Pressable>
        <TextInput
          accessibilityLabel={
            label === "WEIGHT"
              ? "Target weight in kilograms"
              : `Target ${label.toLowerCase()}`
          }
          keyboardType="decimal-pad"
          selectTextOnFocus
          value={draft ?? String(value)}
          onFocus={() => setDraft(String(value))}
          onChangeText={(text) => setDraft(text.replace(/[^0-9.]/g, ""))}
          onEndEditing={() =>
            set(draft === null || draft === "" ? value : Number(draft))
          }
          style={styles.targetValue}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label.toLowerCase()}`}
          onPress={() => set(value + step)}
          style={styles.targetButton}
        >
          <Text style={styles.targetButtonText}>＋</Text>
        </Pressable>
      </View>
      {unit ? <Text style={styles.unit}>{unit}</Text> : null}
    </View>
  );
}

function SummaryStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <View style={styles.summaryStat}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    alignItems: "flex-start",
  },
  headerText: { flex: 1 },
  eyebrow: {
    color: colors.textSubtle,
    letterSpacing: 2,
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    color: colors.text,
    fontSize: 27,
    fontWeight: "800",
    marginTop: spacing.xs,
  },
  headerBack: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderVisible,
    borderRadius: radii.sm,
  },
  progressTrack: {
    flexDirection: "row",
    gap: spacing.xs,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 3,
    backgroundColor: colors.input,
  },
  progressFilled: { backgroundColor: colors.primary },
  scroll: { flex: 1 },
  body: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  nameInput: {
    minHeight: 66,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: 23,
    fontWeight: "700",
    backgroundColor: colors.elevated,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radii.sm,
  },
  sectionLabel: {
    color: colors.textSubtle,
    letterSpacing: 1.5,
    fontSize: 11,
    fontWeight: "700",
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  chip: {
    borderWidth: 1,
    borderColor: colors.borderVisible,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.elevated,
  },
  chipText: { color: colors.text, fontSize: 14 },
  searchInput: {
    minHeight: 56,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: 16,
    backgroundColor: colors.elevated,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radii.sm,
  },
  catalogItem: {
    minHeight: 55,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    backgroundColor: colors.elevated,
    borderRadius: radii.sm,
    marginBottom: spacing.xs,
  },
  catalogText: { color: colors.text, fontSize: 16, flex: 1 },
  plus: { color: colors.textSubtle, fontSize: 23 },
  empty: {
    minHeight: 115,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.borderVisible,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: "700" },
  hint: { color: colors.textSubtle, fontSize: 13, marginTop: spacing.xs },
  exerciseCard: {
    backgroundColor: colors.elevated,
    borderRadius: radii.sm,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  exerciseHeading: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    gap: spacing.xs,
  },
  orderBadge: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    backgroundColor: colors.input,
    alignItems: "center",
    justifyContent: "center",
  },
  orderText: { color: colors.text, fontWeight: "700" },
  exerciseHeadingText: { flex: 1 },
  exerciseTitle: { color: colors.text, fontWeight: "700", fontSize: 16 },
  exerciseSummary: { color: colors.textSubtle, fontSize: 12 },
  orderControl: {
    width: 32,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  orderGlyph: { color: colors.textSubtle, fontSize: 24 },
  exerciseNameInput: {
    height: 50,
    marginHorizontal: spacing.sm,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    color: colors.text,
    backgroundColor: colors.input,
    borderRadius: radii.sm,
  },
  targets: { flexDirection: "row", gap: spacing.xs, margin: spacing.sm },
  targetGroup: { flex: 1, minWidth: 0, alignItems: "center" },
  targetRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: 42,
    backgroundColor: colors.input,
    borderRadius: radii.sm,
  },
  targetButton: {
    width: 24,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  targetButtonText: { color: colors.textSubtle, fontSize: 19 },
  targetValue: {
    flex: 1,
    minWidth: 32,
    padding: 0,
    textAlign: "center",
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  unit: { color: colors.textSubtle, fontSize: 11, marginTop: spacing.xxs },
  cardActions: { flexDirection: "row", gap: spacing.xs, padding: spacing.sm },
  cardAction: {
    flex: 1,
    minHeight: 42,
    borderWidth: 1,
    borderColor: colors.borderVisible,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  cardActionText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  removeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  addExercise: {
    minHeight: 64,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.borderVisible,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  addExerciseText: { color: colors.text, fontWeight: "800", letterSpacing: 1 },
  reviewName: {
    borderWidth: 1,
    borderColor: colors.borderVisible,
    borderRadius: radii.sm,
    padding: spacing.md,
  },
  reviewTitle: { color: colors.text, fontSize: 27, fontWeight: "800" },
  summaryStats: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: colors.borderVisible,
    borderRadius: radii.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  summaryStat: { flex: 1, alignItems: "center" },
  summaryValue: { color: colors.text, fontSize: 20, fontWeight: "800" },
  reviewRow: {
    minHeight: 68,
    backgroundColor: colors.elevated,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  reviewExercise: { flex: 1, color: colors.text, fontWeight: "700" },
  reviewTargets: { color: colors.textSubtle, fontSize: 11 },
  reviewFooter: {
    color: colors.textSubtle,
    textAlign: "center",
    marginTop: spacing.md,
  },
  error: { color: colors.primary, textAlign: "center", marginTop: spacing.md },
  footer: {
    flexDirection: "row",
    gap: spacing.xs,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  footerButton: { flex: 1, minHeight: 58 },
});
