import { Pressable, StyleSheet, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { BackIcon } from "./Icons";
import { colors, spacing, touchTarget } from "@/theme/tokens";

export function BackButton({ label }: { label?: string }) {
  const navigation = useNavigation();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      onPress={() => navigation.goBack()}
      style={styles.button}
      hitSlop={8}
    >
      <BackIcon />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: touchTarget,
    minHeight: touchTarget,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  label: { color: colors.text, fontSize: 20, fontWeight: "700" },
});
