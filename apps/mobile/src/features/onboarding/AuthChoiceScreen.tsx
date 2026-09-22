import { StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "@/navigation/types";
import { Screen } from "@/components/Screen";
import { BrandLockup } from "@/components/BrandLockup";
import { Button } from "@/components/Button";
import { OnboardingHero } from "@/features/onboarding/OnboardingHero";
import { colors, spacing } from "@/theme/tokens";

export function AuthChoiceScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParamList, "AuthChoice">) {
  return (
    <Screen scroll edges={["bottom"]} contentStyle={styles.content}>
      <View style={styles.intro}>
        <OnboardingHero maxHeightFraction={0.6} />
        <View style={styles.copy}>
          <BrandLockup />
          <Text style={styles.description}>
            Build better behaviours, not fatigue, frustration and failure.
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Button label="LOGIN" onPress={() => navigation.navigate("Login")} />
        <Button
          label="REGISTER"
          variant="secondary"
          onPress={() => navigation.navigate("Register")}
          style={styles.secondary}
        />
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { width: "100%", justifyContent: "space-between" },
  intro: { width: "100%" },
  copy: { paddingHorizontal: spacing.lg },
  actions: { paddingHorizontal: spacing.md, paddingBottom: spacing.xs },
  description: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "500",
    marginTop: spacing.sm,
  },
  secondary: { marginTop: spacing.xs, borderRadius: 0 },
});
