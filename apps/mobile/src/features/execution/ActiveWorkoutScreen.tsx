import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Animated,
  ScrollView,
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
import { BackButton } from "@/components/BackButton";
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
  const record = async (status: "completed" | "skipped") => {
    if (!current || !effectiveSets) return;
    const weight =
      input?.setId === current.id ? input.weight : current.targetWeightKg;
    const reps = input?.setId === current.id ? input.reps : current.targetReps;
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
      if (!updated.some((set) => set.status === "pending")) {
        await api.finalize(date);
        await Promise.all([
          client.invalidateQueries({ queryKey: ["dashboard", date] }),
          client.invalidateQueries({ queryKey: ["assignments"] }),
          client.invalidateQueries({ queryKey: ["assignment", date] }),
        ]);
        navigation.navigate("Tabs", { screen: "Home" });
      } else if (status === "completed" && restSeconds > 0) setResting(true);
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
          title="Workout recorded"
          message="All sets have a result."
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
  return (
    <Screen keyboard contentStyle={styles.content}>
      <View style={styles.header}>
        <BackButton />
        <Text numberOfLines={1} style={styles.progress}>
          {query.data.workoutName} ({exerciseIndex}/{exercisePositions.length})
        </Text>
        <View style={styles.spacer} />
      </View>
      {resting ? (
        <View style={styles.rest}>
          <RestCountdown seconds={restSeconds} onComplete={endRest} />
          <Button label="SKIP" onPress={endRest} style={styles.restButton} />
        </View>
      ) : (
        <>
          <View style={styles.center}>
            <Animated.Text style={[styles.setTitle, { opacity: fade }]}>
              {current.exerciseName} Set {current.setNumber} /{" "}
              {exerciseSets.length}
            </Animated.Text>
            <TextInput
              accessibilityLabel="Weight in kilograms"
              value={String(weight)}
              onChangeText={(value) =>
                setInput({
                  setId: current.id,
                  weight: Number(value.replace(/[^0-9.]/g, "")) || 0,
                  reps,
                })
              }
              keyboardType="decimal-pad"
              selectTextOnFocus
              maxLength={7}
              style={styles.weight}
            />
            <Text style={styles.weightLabel}>Weight (KG)</Text>
          </View>
          <View>
            {error ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {error}
              </Text>
            ) : null}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.reps}
            >
              {Array.from({ length: 20 }, (_, index) => index + 1).map(
                (value) => (
                  <Text
                    accessibilityRole="button"
                    onPress={() =>
                      setInput({ setId: current.id, weight, reps: value })
                    }
                    key={value}
                    style={[styles.rep, reps === value && styles.repSelected]}
                  >
                    {reps === value ? `${value} Reps` : value}
                  </Text>
                ),
              )}
            </ScrollView>
            <View style={styles.actions}>
              <Button
                label="SKIP"
                variant="quiet"
                disabled={saving}
                onPress={() => void record("skipped")}
                style={styles.action}
              />
              <Button
                label={
                  effectiveSets.filter((set) => set.status === "pending")
                    .length === 1
                    ? "COMPLETE"
                    : "NEXT"
                }
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progress: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 18,
    textAlign: "center",
  },
  spacer: { width: 44 },
  center: { alignItems: "center" },
  setTitle: { color: colors.text, fontSize: 20, fontWeight: "700" },
  weight: {
    width: "100%",
    height: 135,
    color: colors.text,
    fontSize: 110,
    lineHeight: 125,
    fontWeight: "700",
    textAlign: "center",
    padding: 0,
  },
  weightLabel: { color: colors.textMuted, fontSize: 20 },
  reps: { alignItems: "center", paddingVertical: spacing.md },
  rep: {
    color: colors.textMuted,
    fontSize: 22,
    marginHorizontal: spacing.xs,
    padding: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: colors.border,
    overflow: "hidden",
  },
  repSelected: { color: colors.text, borderColor: colors.primary },
  actions: { flexDirection: "row", gap: spacing.xs },
  action: { flex: 1 },
  error: {
    color: colors.primary,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  rest: { flex: 1, alignItems: "center", justifyContent: "center" },
  restButton: { position: "absolute", bottom: 0, left: 0, right: 0 },
});
