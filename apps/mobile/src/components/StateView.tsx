import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Button } from "./Button";
import { colors, spacing } from "@/theme/tokens";

export function StateView({
  kind,
  title,
  message,
  onRetry,
}: {
  kind: "loading" | "empty" | "error";
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.container}>
      {kind === "loading" ? (
        <ActivityIndicator color={colors.primary} size="large" />
      ) : (
        <>
          <Text style={styles.title}>
            {title ??
              (kind === "error" ? "Something went wrong" : "Nothing here yet")}
          </Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          {onRetry ? (
            <Button label="TRY AGAIN" onPress={onRetry} style={styles.button} />
          ) : null}
        </>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  message: {
    color: colors.textSubtle,
    fontSize: 16,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  button: { alignSelf: "stretch", marginTop: spacing.lg },
});
