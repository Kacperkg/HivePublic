import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Screen } from "@/components/Screen";
import { Header } from "@/components/Header";
import { ChevronIcon } from "@/components/Icons";
import { WorkoutNumber } from "@/components/WorkoutNumber";
import { StateView } from "@/components/StateView";
import { api } from "@/api/endpoints";
import { colors, radii, spacing, tabBarHeight } from "@/theme/tokens";
import { monthBounds, toDateKey } from "@/utils/date";
import { toRoman } from "@/utils/roman";

export function CalendarScreen() {
  const client = useQueryClient();
  const [month, setMonth] = useState(() => new Date());
  const [selected, setSelected] = useState(() => new Date());
  const bounds = monthBounds(month);
  const assignments = useQuery({
    queryKey: ["assignments", bounds.from, bounds.to],
    queryFn: ({ signal }) => api.assignments(bounds.from, bounds.to, signal),
  });
  const workouts = useQuery({
    queryKey: ["workouts"],
    queryFn: ({ signal }) => api.workouts(signal),
  });
  const assignmentMap = useMemo(
    () => new Map(assignments.data?.map((item) => [item.scheduledDate, item])),
    [assignments.data],
  );
  const selectedKey = toDateKey(selected);
  const selectedAssignment = assignmentMap.get(selectedKey);
  const mutation = useMutation({
    mutationFn: async ({ workoutId }: { workoutId?: string }) => {
      if (workoutId) await api.assign(selectedKey, workoutId);
      else await api.unassign(selectedKey);
    },
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["assignments"] }),
        client.invalidateQueries({ queryKey: ["dashboard", selectedKey] }),
      ]);
    },
  });
  const days = useMemo(() => calendarCells(month), [month]);
  const today = toDateKey(new Date());
  const past = selectedKey < today;
  return (
    <Screen scroll contentStyle={{ paddingBottom: tabBarHeight + spacing.xl }}>
      <Header />
      <View style={styles.content}>
        <View style={styles.calendar}>
          <View style={styles.monthHeader}>
            <Text style={styles.monthTitle}>
              {month.toLocaleString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </Text>
            <View style={styles.controls}>
              <Pressable
                accessibilityLabel="Previous month"
                style={styles.control}
                onPress={() => {
                  setMonth(
                    (value) =>
                      new Date(value.getFullYear(), value.getMonth() - 1, 1),
                  );
                }}
              >
                <ChevronIcon direction="left" />
              </Pressable>
              <Pressable
                accessibilityLabel="Next month"
                style={styles.control}
                onPress={() => {
                  setMonth(
                    (value) =>
                      new Date(value.getFullYear(), value.getMonth() + 1, 1),
                  );
                }}
              >
                <ChevronIcon />
              </Pressable>
            </View>
          </View>
          <View style={styles.grid}>
            {["M", "T", "W", "T", "F", "S", "S"].map((label, index) => (
              <Text key={`${label}${index}`} style={styles.weekday}>
                {label}
              </Text>
            ))}
            {days.map((date, index) =>
              date ? (
                <Day
                  key={toDateKey(date)}
                  date={date}
                  selected={selectedKey === toDateKey(date)}
                  assignment={assignmentMap.get(toDateKey(date))}
                  onPress={() => setSelected(date)}
                />
              ) : (
                <View
                  key={`blank-${index}`}
                  style={[styles.day, styles.placeholderDay]}
                />
              ),
            )}
          </View>
        </View>
        {assignments.isError ? (
          <Text style={styles.inlineError}>
            Calendar assignments could not be loaded.
          </Text>
        ) : null}
        <View style={styles.workouts}>
          {past ? (
            <StateView
              kind="empty"
              title="Past date"
              message="Past activity can be reviewed but not changed."
            />
          ) : workouts.isPending ? (
            <StateView kind="loading" />
          ) : workouts.isError ? (
            <StateView
              kind="error"
              message="Your workouts could not be loaded."
              onRetry={() => void workouts.refetch()}
            />
          ) : workouts.data?.length === 0 ? (
            <StateView
              kind="empty"
              title="No workouts yet"
              message="Add a workout from Gym Report before scheduling it."
            />
          ) : (
            workouts.data?.map((workout) => {
              const active = selectedAssignment?.sourceWorkoutId === workout.id;
              return (
                <Pressable
                  key={workout.id}
                  accessibilityRole="radio"
                  accessibilityState={{
                    checked: active,
                    disabled: mutation.isPending,
                  }}
                  disabled={mutation.isPending}
                  onPress={() =>
                    mutation.mutate(active ? {} : { workoutId: workout.id })
                  }
                  style={styles.workout}
                >
                  <View style={styles.workoutName}>
                    <WorkoutNumber number={workout.position} />
                    <Text style={styles.workoutText}>{workout.name}</Text>
                  </View>
                  <View style={styles.radioArea}>
                    <View
                      style={[styles.radio, active && styles.radioSelected]}
                    >
                      {active ? <View style={styles.radioDot} /> : null}
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
        {mutation.isError ? (
          <Text accessibilityRole="alert" style={styles.inlineError}>
            The assignment could not be saved. Please try again.
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

function Day({
  date,
  selected,
  assignment,
  onPress,
}: {
  date: Date;
  selected: boolean;
  assignment:
    | {
        sourceWorkoutId: string | null;
        workoutPosition: number;
        status: string;
      }
    | undefined;
  onPress(): void;
}) {
  const key = toDateKey(date);
  const today = key === toDateKey(new Date());
  const missed =
    key < toDateKey(new Date()) && assignment?.status !== "completed";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={date.toDateString()}
      onPress={onPress}
      style={[
        styles.day,
        today && !selected && styles.today,
        selected && styles.selected,
      ]}
    >
      <Text style={styles.dayText}>{date.getDate()}</Text>
      {assignment ? (
        <Text
          numberOfLines={1}
          style={[
            styles.assignment,
            assignment.status === "completed" && styles.done,
            missed && styles.missed,
          ]}
        >
          {toRoman(assignment.workoutPosition)}
        </Text>
      ) : (
        <Text style={styles.assignment}> </Text>
      )}
    </Pressable>
  );
}
function calendarCells(month: Date): (Date | null)[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1, 12);
  const leading = first.getDay() === 0 ? 6 : first.getDay() - 1;
  const lastDay = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const values: (Date | null)[] = Array.from({ length: leading }, () => null);
  for (let day = 1; day <= lastDay; day++)
    values.push(new Date(month.getFullYear(), month.getMonth(), day, 12));
  while (values.length % 7) values.push(null);
  return values;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.md },
  calendar: {
    borderColor: colors.border,
    borderWidth: 2,
    borderRadius: radii.sm,
    padding: spacing.md,
  },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  monthTitle: { color: colors.text, fontSize: 18, fontWeight: "700" },
  controls: { flexDirection: "row", gap: spacing.xs },
  control: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 0,
  },
  weekday: {
    width: "13%",
    color: "rgba(255,255,255,0.10)",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  day: {
    width: "13%",
    height: 57,
    marginBottom: spacing.sm,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.border,
  },
  placeholderDay: {
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  today: { backgroundColor: "rgba(220,20,60,0.30)" },
  selected: { backgroundColor: colors.primary },
  dayText: { color: colors.text, fontSize: 14 },
  assignment: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
    height: 14,
  },
  done: { color: colors.success },
  missed: { color: colors.primary },
  workouts: { marginTop: spacing.xs },
  workout: {
    height: 84,
    marginBottom: spacing.xs,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
  },
  workoutName: {
    marginLeft: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  workoutText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    flexShrink: 1,
  },
  radioArea: {
    height: "100%",
    aspectRatio: 1,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.text,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: { backgroundColor: colors.text },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.surface,
  },
  inlineError: {
    color: colors.primary,
    textAlign: "center",
    marginVertical: spacing.sm,
  },
});
