import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import { api } from "@/api/endpoints";
import { Screen } from "@/components/Screen";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/Button";
import { StateView } from "@/components/StateView";
import { colors, spacing } from "@/theme/tokens";

export function TimerSetupScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, "TimerSetup">) {
  const { date } = route.params;
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
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
        <Text style={styles.name}>{query.data.workoutName}</Text>
        <Text style={styles.title}>Set Rest Timer</Text>
      </View>
      <View style={styles.pickers}>
        <Picker
          accessibilityLabel="Rest minutes"
          selectedValue={minutes}
          onValueChange={(value) => setMinutes(Number(value))}
          style={styles.picker}
          itemStyle={styles.pickerItem}
        >
          {Array.from({ length: 6 }, (_, value) => (
            <Picker.Item key={value} label={String(value)} value={value} />
          ))}
        </Picker>
        <Text style={styles.label}>Min</Text>
        <Picker
          accessibilityLabel="Rest seconds"
          selectedValue={seconds}
          onValueChange={(value) => setSeconds(Number(value))}
          style={styles.picker}
          itemStyle={styles.pickerItem}
        >
          {Array.from({ length: 60 }, (_, value) => (
            <Picker.Item key={value} label={String(value)} value={value} />
          ))}
        </Picker>
        <Text style={styles.label}>Sec</Text>
      </View>
      <Button
        label="START"
        onPress={() =>
          navigation.replace("ActiveWorkout", {
            date,
            restSeconds: minutes * 60 + seconds,
          })
        }
      />
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: {
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  name: {
    color: colors.text,
    fontSize: 44,
    lineHeight: 50,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  title: { color: colors.textMuted, fontSize: 20 },
  pickers: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  picker: { width: 96, height: 200, color: colors.text },
  pickerItem: { color: colors.text, fontSize: 36 },
  label: { color: colors.text, fontSize: 28, marginRight: spacing.xs },
});
