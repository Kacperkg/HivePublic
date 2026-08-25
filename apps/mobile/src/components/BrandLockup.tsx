import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/tokens";

export function BrandLockup() {
  return (
    <View style={styles.row} accessibilityRole="header">
      <Text style={styles.the}>THE</Text>
      <Text style={styles.hive}>HIVE</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start" },
  the: { color: colors.primary, fontSize: 16, fontWeight: "800" },
  hive: {
    color: colors.text,
    fontSize: 48,
    lineHeight: 52,
    fontWeight: "800",
    marginTop: -8,
  },
});
