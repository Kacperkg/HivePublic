import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import { api } from "@/api/endpoints";
import { Screen } from "@/components/Screen";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/Button";
import { StateView } from "@/components/StateView";
import { colors, radii, spacing } from "@/theme/tokens";

const presets = [45, 60, 90, 120, 180];
const format = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

export function TimerSetupScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, "TimerSetup">) {
  const { date } = route.params;
  const [restSeconds, setRestSeconds] = useState(90);
  const query = useQuery({
    queryKey: ["assignment", date],
    queryFn: ({ signal }) => api.assignment(date, signal),
  });
  if (query.isPending)
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
          message="The workout could not be loaded."
          onRetry={() => void query.refetch()}
        />
      </Screen>
    );
  return (
    <Screen contentStyle={styles.content}>
      <View>
        <BackButton />
        <Text style={styles.eyebrow}>
          {query.data.workoutName.toUpperCase()}
        </Text>
        <Text style={styles.title}>Set rest timer</Text>
        <View style={styles.presets}>
          {presets.map((value) => (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityLabel={`${format(value)} rest`}
              accessibilityState={{ selected: restSeconds === value }}
              onPress={() => setRestSeconds(value)}
              style={[styles.preset, restSeconds === value && styles.selected]}
            >
              <Text
                style={[
                  styles.presetText,
                  restSeconds === value && styles.selectedText,
                ]}
              >
                {format(value)}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.clock}>{format(restSeconds)}</Text>
        <Text style={styles.clockLabel}>MINUTES : SECONDS</Text>
        <View style={styles.adjustments}>
          {[-30, -5, 5, 30].map((delta) => (
            <Pressable
              key={delta}
              accessibilityRole="button"
              accessibilityLabel={`${delta > 0 ? "Add" : "Remove"} ${Math.abs(delta)} seconds`}
              onPress={() =>
                setRestSeconds((value) =>
                  Math.min(600, Math.max(0, value + delta)),
                )
              }
              style={styles.adjust}
            >
              <Text style={styles.adjustText}>
                {delta > 0 ? "+" : ""}
                {delta}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Train without rest"
          onPress={() => setRestSeconds(0)}
          style={styles.noRest}
        >
          <Text style={styles.noRestText}>TRAIN WITHOUT REST</Text>
        </Pressable>
      </View>
      <View>
        <Text style={styles.hint}>
          Rest starts after each completed set. You can skip, pause, or extend
          it during your workout.
        </Text>
        <View style={styles.footer}>
          <Button
            label="BACK"
            variant="secondary"
            onPress={() => navigation.goBack()}
            style={styles.footerButton}
          />
          <Button
            label="START"
            onPress={() =>
              navigation.replace("ActiveWorkout", { date, restSeconds })
            }
            style={styles.footerButton}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  eyebrow: {
    color: colors.textSubtle,
    letterSpacing: 2,
    marginTop: spacing.lg,
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    color: colors.text,
    fontSize: 29,
    fontWeight: "800",
    marginTop: spacing.xs,
  },
  presets: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  preset: {
    minWidth: "30%",
    flexGrow: 1,
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.borderVisible,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  selected: { borderColor: colors.primary, borderWidth: 2 },
  presetText: { color: colors.textSubtle, fontSize: 18, fontWeight: "700" },
  selectedText: { color: colors.text },
  clock: {
    color: colors.text,
    fontSize: 88,
    fontWeight: "800",
    textAlign: "center",
    marginTop: spacing.xl,
  },
  clockLabel: {
    color: colors.textSubtle,
    letterSpacing: 2,
    textAlign: "center",
    fontSize: 11,
  },
  adjustments: { flexDirection: "row", gap: spacing.xs, marginTop: spacing.xl },
  adjust: {
    flex: 1,
    minHeight: 50,
    backgroundColor: colors.elevated,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  adjustText: { color: colors.text, fontWeight: "700", fontSize: 17 },
  noRest: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  noRestText: { color: colors.textSubtle, fontWeight: "700", letterSpacing: 1 },
  hint: {
    color: colors.textSubtle,
    textAlign: "center",
    fontSize: 13,
    marginBottom: spacing.md,
  },
  footer: { flexDirection: "row", gap: spacing.xs },
  footerButton: { flex: 1, minHeight: 58 },
});
