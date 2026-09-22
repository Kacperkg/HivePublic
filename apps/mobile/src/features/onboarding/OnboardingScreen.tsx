import { StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "@/navigation/types";
import { Screen } from "@/components/Screen";
import { BrandLockup } from "@/components/BrandLockup";
import { Button } from "@/components/Button";
import { OnboardingHero } from "@/features/onboarding/OnboardingHero";
import { colors, spacing } from "@/theme/tokens";

type Props = NativeStackScreenProps<AuthStackParamList, "GetStarted">;

export function OnboardingScreen({ navigation }: Props) {
  return (
    <Screen scroll edges={["bottom"]} contentStyle={styles.content}>
      <View style={styles.intro}>
        <OnboardingHero maxHeightFraction={0.68} />
        <View style={styles.copy}>
          <BrandLockup />
          <Text style={styles.description}>
            Build better behaviours, not fatigue, frustration and failure.
          </Text>
        </View>
      </View>
      <View style={styles.cta}>
        <Button
          label="GET STARTED"
          onPress={() => navigation.navigate("AuthChoice")}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { width: "100%", justifyContent: "space-between" },
  intro: { width: "100%" },
  copy: { paddingHorizontal: spacing.lg },
  cta: { paddingHorizontal: spacing.md, paddingBottom: spacing.xs },
  description: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "500",
    marginTop: spacing.sm,
  },
});
