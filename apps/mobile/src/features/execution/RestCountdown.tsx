import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors } from "@/theme/tokens";

export function RestCountdown({
  seconds,
  onComplete,
}: {
  seconds: number;
  onComplete(): void;
}) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    const started = Date.now();
    const interval = setInterval(() => {
      const next = Math.max(
        0,
        seconds - Math.floor((Date.now() - started) / 1000),
      );
      setRemaining(next);
      if (next === 0) {
        clearInterval(interval);
        onComplete();
      }
    }, 250);
    return () => clearInterval(interval);
  }, [seconds, onComplete]);
  const radius = 112;
  const circumference = 2 * Math.PI * radius;
  const progress = seconds ? remaining / seconds : 0;
  return (
    <View
      style={styles.container}
      accessibilityLabel={`${remaining} seconds rest remaining`}
    >
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
      <Text style={styles.time}>{remaining}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    width: 250,
    height: 250,
    alignItems: "center",
    justifyContent: "center",
  },
  time: {
    position: "absolute",
    color: colors.text,
    fontSize: 48,
    fontWeight: "600",
  },
});
