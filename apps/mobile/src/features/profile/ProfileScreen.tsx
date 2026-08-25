import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Screen } from "@/components/Screen";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/Button";
import { AvatarIcon, LogoutIcon } from "@/components/Icons";
import { useAuth } from "@/auth/AuthProvider";
import { colors, spacing } from "@/theme/tokens";

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      await logout();
    } catch {
      setError("Failed to log out. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Screen contentStyle={styles.content}>
      <View>
        <BackButton label="Back" />
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <AvatarIcon size={100} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.hello}>Hello,</Text>
            <Text style={styles.name} numberOfLines={2}>
              {user ? `${user.firstName} ${user.surname}` : "User"}
            </Text>
          </View>
        </View>
      </View>
      <View>
        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}
        <Button
          label="LOGOUT"
          variant="quiet"
          loading={loading}
          onPress={() => void submit()}
        />
        <View pointerEvents="none" style={styles.icon}>
          <LogoutIcon />
        </View>
      </View>
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
  profile: {
    marginTop: spacing.xl,
    flexDirection: "row",
    gap: spacing.lg,
    alignItems: "flex-end",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.text,
    overflow: "hidden",
  },
  copy: { flex: 1, paddingBottom: 4 },
  hello: {
    color: colors.text,
    fontSize: 44,
    lineHeight: 48,
    fontWeight: "700",
  },
  name: { color: colors.textMuted, fontSize: 20, fontWeight: "700" },
  error: {
    color: colors.primary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  icon: { position: "absolute", right: 18, bottom: 27 },
});
