import { Image, StyleSheet, View, useWindowDimensions } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { colors, spacing } from "@/theme/tokens";

type Props = { maxHeightFraction: number };

export function OnboardingHero({ maxHeightFraction }: Props) {
  const { width, height } = useWindowDimensions();
  const heroHeight = Math.min(width * (594 / 402), height * maxHeightFraction);
  const fadeHeight = heroHeight * 0.32;

  return (
    <View style={[styles.hero, { height: heroHeight }]}>
      <Image
        accessibilityIgnoresInvertColors
        source={require("../../../assets/images/onboarding-collage.png")}
        style={styles.image}
        resizeMode="cover"
      />
      <Svg
        pointerEvents="none"
        accessibilityElementsHidden
        style={styles.fade}
        width={width}
        height={fadeHeight}
        viewBox={`0 0 ${width} ${fadeHeight}`}
      >
        <Defs>
          <LinearGradient
            id="bottomFade"
            gradientUnits="userSpaceOnUse"
            x1={0}
            y1={0}
            x2={0}
            y2={fadeHeight}
          >
            <Stop offset="0%" stopColor={colors.background} stopOpacity={0} />
            <Stop
              offset="35%"
              stopColor={colors.background}
              stopOpacity={0.25}
            />
            <Stop offset="100%" stopColor={colors.background} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect width={width} height={fadeHeight} fill="url(#bottomFade)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: "100%",
    marginBottom: spacing.lg,
    position: "relative",
  },
  image: { width: "100%", height: "100%" },
  fade: { position: "absolute", left: 0, right: 0, bottom: 0 },
});
