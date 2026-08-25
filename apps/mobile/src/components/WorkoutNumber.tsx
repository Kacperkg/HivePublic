import { StyleSheet, Text, View } from "react-native";
import { toRoman } from "@/utils/roman";
import { colors, radii } from "@/theme/tokens";

export function WorkoutNumber({ number }: { number: number }) {
  return (
    <View style={styles.box}>
      <Text style={styles.text}>{toRoman(number)}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  box: {
    width: 30,
    height: 30,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { color: colors.text, fontWeight: "700" },
});
