import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { colors, radii, spacing } from "@/theme/tokens";

export function FormField({
  error,
  ...props
}: TextInputProps & { error?: string | undefined }) {
  return (
    <View style={styles.group}>
      <TextInput
        {...props}
        placeholderTextColor="#AAA"
        style={[styles.input, error ? styles.invalid : null, props.style]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: spacing.md },
  input: {
    minHeight: 60,
    borderWidth: 1,
    borderColor: colors.borderVisible,
    borderRadius: radii.sm,
    paddingHorizontal: 20,
    color: colors.text,
    fontWeight: "700",
  },
  invalid: { borderColor: colors.primary },
  error: {
    color: colors.primary,
    fontSize: 13,
    marginTop: spacing.xxs,
    marginHorizontal: spacing.xs,
  },
});
