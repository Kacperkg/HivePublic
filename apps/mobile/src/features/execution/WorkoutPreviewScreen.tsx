import { StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import { api } from "@/api/endpoints";
import { Screen } from "@/components/Screen";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/Button";
import { WorkoutNumber } from "@/components/WorkoutNumber";
import { StateView } from "@/components/StateView";
import { colors, radii, spacing } from "@/theme/tokens";

export function WorkoutPreviewScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, "WorkoutPreview">) {
  const { date } = route.params;
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
          message="Today’s workout could not be loaded."
          onRetry={() => void query.refetch()}
        />
      </Screen>
    );
  const exercises = Array.from(
    new Map(
      query.data.sets.map((set) => [set.exercisePosition, set.exerciseName]),
    ).entries(),
  );
  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.top}>
        <BackButton />
        <Text style={styles.name}>{query.data.workoutName}</Text>
        <Text style={styles.count}>{exercises.length} Exercises</Text>
      </View>
      <View style={styles.list}>
        {exercises.map(([position, name]) => (
          <View key={position} style={styles.exercise}>
            <WorkoutNumber number={position} />
            <Text style={styles.exerciseName}>{name}</Text>
          </View>
        ))}
      </View>
      <Button
        label="NEXT"
        onPress={() => navigation.navigate("TimerSetup", { date })}
      />
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  top: { marginBottom: spacing.md },
  name: {
    color: colors.text,
    fontSize: 44,
    lineHeight: 50,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  count: { color: colors.textMuted, fontSize: 20 },
  list: { flex: 1 },
  exercise: {
    minHeight: 76,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: spacing.xs,
  },
  exerciseName: { color: colors.text, fontSize: 16 },
});
