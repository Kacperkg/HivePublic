import {
  Image,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "@/navigation/types";
import { Screen } from "@/components/Screen";
import { BrandLockup } from "@/components/BrandLockup";
import { Button } from "@/components/Button";
import { colors, spacing } from "@/theme/tokens";

export function AuthChoiceScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParamList, "AuthChoice">) {
  const { height } = useWindowDimensions();
  return (
    <Screen
      scroll
      edges={["left", "right", "bottom"]}
      contentStyle={styles.content}
    >
      <Image
        accessibilityIgnoresInvertColors
        source={require("../../../assets/images/onboarding-collage.png")}
        style={[styles.hero, { maxHeight: Math.max(350, height * 0.54) }]}
        resizeMode="cover"
      />
      <View style={styles.copy}>
        <BrandLockup />
        <Text style={styles.description}>
          Build better behaviours, not fatigue, frustration and failure.
        </Text>
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
  content: { justifyContent: "center" },
  hero: {
    width: "100%",
    aspectRatio: 402 / 594,
    marginTop: -48,
    marginBottom: spacing.lg,
  },
  copy: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  description: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "500",
    marginTop: spacing.lg,
    marginBottom: 40,
  },
  secondary: { marginTop: spacing.xs, borderRadius: 0 },
});
