import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors, radii, spacing } from "@/theme/tokens";

const format = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

export function RestCountdown({
  seconds,
  next,
  onComplete,
}: {
  seconds: number;
  next: string;
  onComplete(): void;
}) {
  const [remaining, setRemaining] = useState(seconds);
  const [total, setTotal] = useState(seconds);
  const [paused, setPaused] = useState(false);
  const lastTick = useRef(0);
  const completed = useRef(false);
  useEffect(() => {
    lastTick.current = Date.now();
    const interval = setInterval(() => {
      if (paused || completed.current) {
        lastTick.current = Date.now();
        return;
      }
      const now = Date.now();
      const elapsed = (now - lastTick.current) / 1000;
      lastTick.current = now;
      setRemaining((value) => Math.max(0, value - elapsed));
    }, 250);
    return () => clearInterval(interval);
  }, [paused]);
  useEffect(() => {
    if (remaining <= 0 && !completed.current) {
      completed.current = true;
      onComplete();
    }
  }, [remaining, onComplete]);
  const radius = 112;
  const circumference = 2 * Math.PI * radius;
  const progress = total ? remaining / total : 0;
  return (
    <View
      style={styles.container}
      accessibilityLabel={`${Math.ceil(remaining)} seconds rest remaining`}
    >
      <Text style={styles.eyebrow}>REST</Text>
      <View style={styles.circle}>
        <Svg width={250} height={250} viewBox="0 0 250 250">
          <Circle
            cx="125"
            cy="125"
            r={radius}
            stroke={colors.surface}
            strokeWidth="10"
            fill="none"
          />
          <Circle
            cx="125"
            cy="125"
            r={radius}
            stroke={colors.primary}
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - progress)}
            rotation="-90"
            origin="125,125"
          />
        </Svg>
        <View style={styles.circleText}>
          <Text style={styles.time}>{format(Math.ceil(remaining))}</Text>
          <Text numberOfLines={2} style={styles.next}>
            Next: {next}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add 30 seconds of rest"
          onPress={() => {
            setRemaining((value) => value + 30);
            setTotal((value) => value + 30);
          }}
          style={styles.action}
        >
          <Text style={styles.actionText}>+30S</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={paused ? "Resume rest timer" : "Pause rest timer"}
          onPress={() => setPaused((value) => !value)}
          style={styles.action}
        >
          <Text style={styles.actionText}>{paused ? "▶" : "Ⅱ"}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skip rest"
          onPress={onComplete}
          style={[styles.action, styles.skip]}
        >
          <Text style={styles.actionText}>SKIP REST</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  eyebrow: { color: colors.textSubtle, letterSpacing: 2, fontWeight: "700" },
  circle: {
    width: 250,
    height: 250,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing.xl,
  },
  circleText: { position: "absolute", alignItems: "center", width: 190 },
  time: { color: colors.text, fontSize: 48, fontWeight: "800" },
  next: { color: colors.textSubtle, fontSize: 12, textAlign: "center" },
  actions: { flexDirection: "row", gap: spacing.xs, width: "100%" },
  action: {
    minHeight: 52,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderVisible,
    borderRadius: radii.sm,
  },
  skip: {
    flex: 1,
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionText: { color: colors.text, fontWeight: "800", fontSize: 13 },
});
