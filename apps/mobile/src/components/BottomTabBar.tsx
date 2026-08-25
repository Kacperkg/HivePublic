import { Pressable, StyleSheet, View } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { CalendarIcon, HomeIcon, ReportIcon } from "./Icons";
import { colors, tabBarHeight } from "@/theme/tokens";

const icons = {
  Home: HomeIcon,
  "Gym Calendar": CalendarIcon,
  "Gym Report": ReportIcon,
} as const;

export function BottomTabBar({ state, navigation, insets }: BottomTabBarProps) {
  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: Math.max(insets.bottom, 8) }]}
    >
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const Icon = icons[route.name as keyof typeof icons];
          return (
            <View key={route.key} style={styles.itemWrap}>
              {focused ? <View style={styles.highlight} /> : null}
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={route.name}
                style={styles.item}
                onPress={() => {
                  const event = navigation.emit({
                    type: "tabPress",
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!focused && !event.defaultPrevented)
                    navigation.navigate(route.name, route.params);
                }}
              >
                {Icon ? (
                  <Icon color={focused ? colors.primary : colors.text} />
                ) : null}
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  bar: {
    flexDirection: "row",
    width: 184,
    height: tabBarHeight,
    borderRadius: 50,
    paddingHorizontal: 8,
    backgroundColor: colors.surface,
  },
  itemWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  item: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  highlight: {
    position: "absolute",
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
});
