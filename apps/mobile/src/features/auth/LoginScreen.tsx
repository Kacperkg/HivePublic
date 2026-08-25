import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "@/navigation/types";
import { Screen } from "@/components/Screen";
import { BrandLockup } from "@/components/BrandLockup";
import { Button } from "@/components/Button";
import { FormField } from "./FormField";
import { useAuth } from "@/auth/AuthProvider";
import { ApiError } from "@/api/client";
import { colors, spacing } from "@/theme/tokens";

export function LoginScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParamList, "Login">) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      await login({ email: email.trim(), password });
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : "Unable to sign in.",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <Screen scroll keyboard contentStyle={styles.content}>
      <View>
        <BrandLockup />
        <View style={styles.form}>
          <FormField
            accessibilityLabel="Email"
            placeholder="EMAIL"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="next"
          />
          <FormField
            accessibilityLabel="Password"
            placeholder="PASSWORD"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
            onSubmitEditing={() => void submit()}
          />
          {error ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          ) : null}
          <Button
            label="SIGN IN"
            onPress={() => void submit()}
            loading={loading}
            disabled={!email || !password}
          />
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate("Register")}
        style={styles.create}
      >
        <Text style={styles.muted}>Not a Member? </Text>
        <Text style={[styles.muted, styles.link]}>Create an Account</Text>
      </Pressable>
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: {
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: 80,
    paddingBottom: spacing.sm,
  },
  form: { marginTop: 64 },
  error: {
    color: colors.primary,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  create: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  muted: { color: colors.textSubtle },
  link: { textDecorationLine: "underline" },
});
