import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "@/navigation/types";
import { Screen } from "@/components/Screen";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/Button";
import { FormField } from "./FormField";
import { useAuth } from "@/auth/AuthProvider";
import { ApiError } from "@/api/client";
import type { FieldErrors } from "@/api/types";
import { colors, spacing } from "@/theme/tokens";

export function RegisterScreen(
  _: NativeStackScreenProps<AuthStackParamList, "Register">,
) {
  const { register } = useAuth();
  const [values, setValues] = useState({
    firstName: "",
    surname: "",
    email: "",
    password: "",
  });
  const [fields, setFields] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const update = (key: keyof typeof values) => (value: string) =>
    setValues((current) => ({ ...current, [key]: value }));
  const submit = async () => {
    setFields({});
    setError(null);
    setLoading(true);
    try {
      await register({
        ...values,
        firstName: values.firstName.trim(),
        surname: values.surname.trim(),
        email: values.email.trim(),
      });
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
        setFields(caught.fields ?? {});
      } else setError("Unable to create your account.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Screen scroll keyboard contentStyle={styles.content}>
      <View>
        <BackButton />
        <Text style={styles.title}>CREATE ACCOUNT</Text>
      </View>
      <View style={styles.form}>
        <FormField
          placeholder="FIRST NAME"
          value={values.firstName}
          onChangeText={update("firstName")}
          autoComplete="given-name"
          error={fields.firstName}
        />
        <FormField
          placeholder="SURNAME"
          value={values.surname}
          onChangeText={update("surname")}
          autoComplete="family-name"
          error={fields.surname}
        />
        <FormField
          placeholder="EMAIL"
          value={values.email}
          onChangeText={update("email")}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          error={fields.email}
        />
        <FormField
          placeholder="PASSWORD"
          value={values.password}
          onChangeText={update("password")}
          secureTextEntry
          autoComplete="new-password"
          error={fields.password}
        />
        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}
        <Button
          label="REGISTER"
          loading={loading}
          disabled={Object.values(values).some((value) => !value)}
          onPress={() => void submit()}
        />
      </View>
      <View />
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: {
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  title: {
    marginTop: spacing.lg,
    fontSize: 24,
    color: colors.text,
    fontWeight: "700",
  },
  form: { marginVertical: spacing.xl },
  error: {
    color: colors.primary,
    textAlign: "center",
    marginBottom: spacing.md,
  },
});
