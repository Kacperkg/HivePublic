import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import type { AssignmentSet } from "@/api/types";
import { api } from "@/api/endpoints";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";
import { StateView } from "@/components/StateView";
import { RestCountdown } from "./RestCountdown";
import { colors, radii, spacing } from "@/theme/tokens";

export function ActiveWorkoutScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, "ActiveWorkout">) {
  const { date, restSeconds } = route.params;
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["assignment", date],
    queryFn: ({ signal }) => api.assignment(date, signal),
  });
  const [sets, setSets] = useState<AssignmentSet[] | null>(null);
  const [input, setInput] = useState<{
    setId: string;
    weight: number;
    reps: number;
  } | null>(null);
  const [weightDraft, setWeightDraft] = useState<{
    setId: string;
    text: string;
  } | null>(null);
  const [repsDraft, setRepsDraft] = useState<{
    setId: string;
    text: string;
  } | null>(null);
  const [resting, setResting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fade] = useState(() => new Animated.Value(1));
  const effectiveSets = sets ?? query.data?.sets ?? null;
  const current = effectiveSets?.find((set) => set.status === "pending");
  const exercisePositions = useMemo(
    () =>
      Array.from(
        new Set(effectiveSets?.map((set) => set.exercisePosition) ?? []),
      ),
    [effectiveSets],
  );
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [current?.id, fade]);
  const endRest = useCallback(() => setResting(false), []);
  const finalize = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.finalize(date);
      await Promise.all([
        client.invalidateQueries({ queryKey: ["dashboard", date] }),
        client.invalidateQueries({ queryKey: ["assignments"] }),
        client.invalidateQueries({ queryKey: ["assignment", date] }),
      ]);
      navigation.navigate("Tabs", { screen: "Home" });
    } catch {
      setError(
        "Your sets were saved, but the workout could not be finalized. Try again.",
      );
    } finally {
      setSaving(false);
    }
  };
  const record = async (status: "completed" | "skipped") => {
    if (!current || !effectiveSets) return;
    const baseWeight =
      input?.setId === current.id ? input.weight : current.targetWeightKg;
    const baseReps =
      input?.setId === current.id ? input.reps : current.targetReps;
    const draftWeight =
      weightDraft?.setId === current.id ? Number(weightDraft.text) : baseWeight;
    const draftReps =
      repsDraft?.setId === current.id ? Number(repsDraft.text) : baseReps;
    const weight = Number.isFinite(draftWeight)
      ? Math.min(99999.99, Math.max(0, Math.round(draftWeight * 100) / 100))
      : baseWeight;
    const reps = Number.isFinite(draftReps)
      ? Math.min(100, Math.max(0, Math.round(draftReps)))
      : baseReps;
    setSaving(true);
    setError(null);
    try {
      const result = await api.updateSet(
        date,
        current.id,
        status === "completed"
          ? { status, actualReps: reps, actualWeightKg: weight }
          : { status },
      );
      const updated = effectiveSets.map((set) =>
        set.id === result.id ? result : set,
      );
      setSets(updated);
      setInput(null);
      setWeightDraft(null);
      setRepsDraft(null);
      if (!updated.some((set) => set.status === "pending")) await finalize();
      else if (status === "completed" && restSeconds > 0) setResting(true);
    } catch {
      setError(
        "This set could not be saved. Check your connection and try again.",
      );
    } finally {
      setSaving(false);
    }
  };
  if (query.isPending || effectiveSets === null)
    return (
      <Screen>
        <StateView kind="loading" />
      </Screen>
    );
  if (query.isError || !query.data)
    return (
      <Screen>
        <StateView
          kind="error"
          message="The active workout could not be loaded."
          onRetry={() => void query.refetch()}
        />
      </Screen>
    );
  if (!current)
    return (
      <Screen>
        <StateView
          kind="empty"
          title="All sets recorded"
          message={error ?? "Finish to save your workout summary."}
          onRetry={() => void finalize()}
        />
      </Screen>
    );
  const exerciseIndex = exercisePositions.indexOf(current.exercisePosition) + 1;
  const exerciseSets = effectiveSets.filter(
    (set) => set.exercisePosition === current.exercisePosition,
  );
  const weight =
    input?.setId === current.id ? input.weight : current.targetWeightKg;
  const reps = input?.setId === current.id ? input.reps : current.targetReps;
  const repOptions = Array.from(
    { length: 7 },
    (_, index) => current.targetReps - 3 + index,
  ).filter((value) => value >= 1 && value <= 100);
  const pendingCount = effectiveSets.filter(
    (set) => set.status === "pending",
  ).length;
  return (
    <Screen keyboard contentStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <Text style={styles.progress}>
            EXERCISE {exerciseIndex} OF {exercisePositions.length}
          </Text>
          <Text numberOfLines={1} style={styles.exerciseName}>
            {current.exerciseName}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Leave workout"
          onPress={() =>
            Alert.alert(
              "Leave workout?",
              "Completed sets are saved. You can resume this workout later.",
              [
                { text: "Keep training", style: "cancel" },
                {
                  text: "Leave",
                  onPress: () =>
                    navigation.navigate("Tabs", { screen: "Home" }),
                },
              ],
            )
          }
          style={styles.leave}
        >
          <Text style={styles.leaveText}>↖</Text>
        </Pressable>
      </View>
      {!resting ? (
        <View style={styles.setIndicators}>
          {exerciseSets.map((set) => (
            <View
              key={set.id}
              style={[
                styles.setIndicator,
                set.id === current.id && styles.currentIndicator,
                set.status === "completed" && styles.completedIndicator,
                set.status === "skipped" && styles.skippedIndicator,
              ]}
            >
              <Text style={styles.indicatorText}>{set.setNumber}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {resting ? (
        <View style={styles.rest}>
          <RestCountdown
            seconds={restSeconds}
            next={`${current.exerciseName} · set ${current.setNumber}`}
            onComplete={endRest}
          />
        </View>
      ) : (
        <>
          <View style={styles.center}>
            <Animated.Text style={[styles.setTitle, { opacity: fade }]}>
              Set {current.setNumber} of {exerciseSets.length}
            </Animated.Text>
            <View style={styles.weightRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Decrease weight"
                onPress={() => {
                  setWeightDraft(null);
                  setInput({
                    setId: current.id,
                    weight: Math.max(0, weight - 2.5),
                    reps,
                  });
                }}
                style={styles.weightControl}
              >
                <Text style={styles.weightControlText}>−</Text>
              </Pressable>
              <TextInput
                accessibilityLabel="Weight in kilograms"
                value={
                  weightDraft?.setId === current.id
                    ? weightDraft.text
                    : String(weight)
                }
                onFocus={() =>
                  setWeightDraft({ setId: current.id, text: String(weight) })
                }
                onChangeText={(text) =>
                  setWeightDraft({
                    setId: current.id,
                    text: text.replace(/[^0-9.]/g, ""),
                  })
                }
                onEndEditing={() => {
                  const next =
                    weightDraft?.setId === current.id
                      ? Number(weightDraft.text)
                      : weight;
                  setInput({
                    setId: current.id,
                    weight: Number.isFinite(next)
                      ? Math.min(
                          99999.99,
                          Math.max(0, Math.round(next * 100) / 100),
                        )
                      : weight,
                    reps,
                  });
                  setWeightDraft(null);
                }}
                keyboardType="decimal-pad"
                selectTextOnFocus
                maxLength={8}
                style={styles.weight}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Increase weight"
                onPress={() => {
                  setWeightDraft(null);
                  setInput({
                    setId: current.id,
                    weight: Math.min(99999.99, weight + 2.5),
                    reps,
                  });
                }}
                style={styles.weightControl}
              >
                <Text style={styles.weightControlText}>＋</Text>
              </Pressable>
            </View>
            <Text style={styles.weightLabel}>WEIGHT (KG)</Text>
          </View>
          <View style={styles.bottom}>
            {error ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {error}
              </Text>
            ) : null}
            <Text style={styles.repLabel}>REPETITIONS</Text>
            <View style={styles.reps}>
              {repOptions.map((value) => (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  accessibilityLabel={`${value} repetitions`}
                  accessibilityState={{ selected: reps === value }}
                  onPress={() =>
                    setInput({ setId: current.id, weight, reps: value })
                  }
                  style={[styles.rep, reps === value && styles.repSelected]}
                >
                  <Text
                    style={[
                      styles.repText,
                      reps === value && styles.repTextSelected,
                    ]}
                  >
                    {value}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.customReps}>
              <Text style={styles.customRepsLabel}>OTHER REPS</Text>
              <TextInput
                accessibilityLabel="Enter actual repetitions"
                keyboardType="number-pad"
                selectTextOnFocus
                value={
                  repsDraft?.setId === current.id
                    ? repsDraft.text
                    : String(reps)
                }
                onFocus={() =>
                  setRepsDraft({ setId: current.id, text: String(reps) })
                }
                onChangeText={(text) =>
                  setRepsDraft({
                    setId: current.id,
                    text: text.replace(/[^0-9]/g, ""),
                  })
                }
                onEndEditing={() => {
                  const next =
                    repsDraft?.setId === current.id
                      ? Number(repsDraft.text)
                      : reps;
                  setInput({
                    setId: current.id,
                    weight,
                    reps: Number.isFinite(next)
                      ? Math.min(100, Math.max(0, Math.round(next)))
                      : reps,
                  });
                  setRepsDraft(null);
                }}
                style={styles.customRepsInput}
              />
            </View>
            <View style={styles.actions}>
              <Button
                label="SKIP"
                variant="quiet"
                disabled={saving}
                onPress={() => void record("skipped")}
                style={styles.action}
              />
              <Button
                label={pendingCount === 1 ? "COMPLETE" : "NEXT SET"}
                loading={saving}
                onPress={() => void record("completed")}
                style={styles.action}
              />
            </View>
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerTitle: { flex: 1 },
  progress: {
    color: colors.textSubtle,
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: "700",
  },
  exerciseName: {
    color: colors.text,
    fontSize: 27,
    fontWeight: "800",
    marginTop: spacing.xs,
  },
  leave: {
    minWidth: 44,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.borderVisible,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  leaveText: { color: colors.text, fontSize: 24 },
  setIndicators: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  setIndicator: {
    width: 34,
    height: 34,
    borderWidth: 1,
    borderColor: colors.borderVisible,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  currentIndicator: { borderColor: colors.primary, borderWidth: 2 },
  completedIndicator: { borderColor: colors.success },
  skippedIndicator: { opacity: 0.4 },
  indicatorText: { color: colors.text, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  setTitle: { color: colors.text, fontSize: 19, fontWeight: "700" },
  weightRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginTop: spacing.lg,
  },
  weightControl: {
    width: 48,
    height: 48,
    flexShrink: 0,
    borderRadius: radii.sm,
    backgroundColor: colors.elevated,
    alignItems: "center",
    justifyContent: "center",
  },
  weightControlText: { color: colors.text, fontSize: 24 },
  weight: {
    width: 205,
    maxWidth: "65%",
    height: 110,
    color: colors.text,
    fontSize: 76,
    fontWeight: "800",
    textAlign: "center",
    padding: 0,
  },
  weightLabel: { color: colors.textSubtle, fontSize: 12, letterSpacing: 2 },
  bottom: { paddingBottom: spacing.xs },
  repLabel: {
    color: colors.textSubtle,
    fontSize: 12,
    letterSpacing: 2,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  reps: { flexDirection: "row", gap: spacing.xxs, marginBottom: spacing.lg },
  rep: {
    flex: 1,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderVisible,
  },
  repSelected: { borderColor: colors.primary, borderWidth: 2 },
  repText: { color: colors.textSubtle, fontSize: 16 },
  repTextSelected: { color: colors.text, fontWeight: "800" },
  customReps: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  customRepsLabel: { color: colors.textSubtle, fontSize: 11, letterSpacing: 1 },
  customRepsInput: {
    minWidth: 54,
    minHeight: 36,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderVisible,
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  actions: { flexDirection: "row", gap: spacing.xs },
  action: { flex: 1, minHeight: 58 },
  error: {
    color: colors.primary,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  rest: { flex: 1 },
});
