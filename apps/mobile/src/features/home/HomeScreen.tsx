import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import { api } from "@/api/endpoints";
import { Screen } from "@/components/Screen";
import { Header } from "@/components/Header";
import { StateView } from "@/components/StateView";
import { ArrowUpRightIcon, ChevronIcon } from "@/components/Icons";
import { colors, radii, spacing, tabBarHeight } from "@/theme/tokens";
import { getWeekDays, toDateKey } from "@/utils/date";

export function HomeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [weekOffset, setWeekOffset] = useState(0);
  const today = toDateKey(new Date());
  const query = useQuery({
    queryKey: ["dashboard", today],
    queryFn: ({ signal }) => api.dashboard(today, signal),
  });
  const days = useMemo(() => getWeekDays(weekOffset), [weekOffset]);
  const openWorkout = () => {
    if (query.data?.status === "planned")
      navigation.navigate("WorkoutPreview", { date: today });
  };
  return (
    <Screen scroll contentStyle={{ paddingBottom: tabBarHeight + spacing.xl }}>
      <Header />
      <View style={styles.main}>
        <View style={styles.weekCard}>
          <View style={styles.weekHeader}>
            <Text style={styles.weekTitle}>This Week</Text>
            <View style={styles.controls}>
              <Pressable
                accessibilityLabel="Previous week"
                onPress={() => setWeekOffset((value) => value - 1)}
                style={styles.control}
              >
                <ChevronIcon direction="left" />
              </Pressable>
              <Pressable
                accessibilityLabel="Next week"
                onPress={() => setWeekOffset((value) => value + 1)}
                style={styles.control}
              >
                <ChevronIcon />
              </Pressable>
            </View>
          </View>
          <View style={styles.days}>
            {days.map((item) => {
              const selected =
                weekOffset === 0 && toDateKey(item.fullDate) === today;
              return (
                <View
                  key={toDateKey(item.fullDate)}
                  style={[styles.day, selected && styles.selectedDay]}
                >
                  <Text
                    style={[styles.dayText, selected && styles.selectedDayText]}
                  >
                    {item.day}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
        {query.isPending ? (
          <StateView kind="loading" />
        ) : query.isError || !query.data ? (
          <StateView
            kind="error"
            message="Today’s activity could not be loaded."
            onRetry={() => void query.refetch()}
          />
        ) : (
          <View>
            <View style={styles.row}>
              <StatCard
                label={"Today's\nActivity"}
                onPress={openWorkout}
                disabled={query.data.status !== "planned"}
              >
                <View style={styles.inline}>
                  <Text
                    adjustsFontSizeToFit
                    numberOfLines={1}
                    style={[
                      styles.big,
                      query.data.activityName === "Completed" &&
                        styles.completed,
                    ]}
                  >
                    {query.data.activityName}
                  </Text>
                  {query.data.status === "planned" ? (
                    <ArrowUpRightIcon />
                  ) : null}
                </View>
              </StatCard>
              <StatCard
                label={"Exercises\nCompleted"}
                onPress={openWorkout}
                disabled={query.data.status !== "planned"}
              >
                <Count
                  current={query.data.exercisesCompleted}
                  total={query.data.totalExercises}
                />
              </StatCard>
            </View>
            <View style={styles.row}>
              <StatCard
                label={"Repetitions\nCompleted"}
                onPress={openWorkout}
                disabled={query.data.status !== "planned"}
              >
                <Count
                  current={query.data.repetitionsCompleted}
                  total={query.data.totalRepetitions}
                />
              </StatCard>
              <StatCard
                label={"Weights\nPushed"}
                onPress={openWorkout}
                disabled={query.data.status !== "planned"}
              >
                <View style={styles.inlineEnd}>
                  <Text style={styles.big}>
                    {Math.round(query.data.weightPushedKg)}
                  </Text>
                  <Text style={styles.unit}>KG</Text>
                </View>
              </StatCard>
            </View>
          </View>
        )}
      </View>
    </Screen>
  );
}

function StatCard({
  label,
  children,
  onPress,
  disabled,
}: React.PropsWithChildren<{
  label: string;
  onPress(): void;
  disabled: boolean;
}>) {
  return (
    <Pressable
      accessibilityRole={disabled ? undefined : "button"}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Text style={styles.prompt}>{label}</Text>
      {children}
    </Pressable>
  );
}
function Count({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.inlineEnd}>
      <Text style={styles.big}>{current}</Text>
      <Text style={styles.unit}>/ {total}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  main: { paddingHorizontal: spacing.md },
  weekCard: {
    padding: spacing.md,
    borderColor: colors.border,
    borderWidth: 2,
    borderRadius: radii.sm,
  },
  weekHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  weekTitle: { color: colors.text, fontSize: 16 },
  controls: { flexDirection: "row", gap: spacing.xxs },
  control: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.01)",
    borderRadius: radii.sm,
  },
  days: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  day: {
    width: 40,
    height: 59,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedDay: { backgroundColor: colors.primary },
  dayText: { color: colors.text, fontSize: 16 },
  selectedDayText: { fontWeight: "700" },
  row: { flexDirection: "row", gap: spacing.xs, marginTop: spacing.xs },
  card: {
    flex: 1,
    minWidth: 0,
    aspectRatio: 1,
    borderColor: colors.border,
    borderWidth: 2,
    borderRadius: radii.sm,
    padding: spacing.md,
    justifyContent: "space-between",
  },
  pressed: { opacity: 0.8 },
  prompt: { color: colors.textMuted, fontSize: 14 },
  inline: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  inlineEnd: { flexDirection: "row", alignItems: "flex-end", gap: spacing.xs },
  big: { color: colors.text, fontSize: 40, lineHeight: 44 },
  completed: { fontSize: 29 },
  unit: { color: "rgba(255,255,255,0.10)", fontSize: 16, paddingBottom: 4 },
});
