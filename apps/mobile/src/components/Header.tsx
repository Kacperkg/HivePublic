import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "@/auth/AuthProvider";
import { AvatarIcon } from "./Icons";
import { colors, spacing, touchTarget } from "@/theme/tokens";

export function Header() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.welcome}>Hey,</Text>
        <Text style={styles.user} numberOfLines={1}>
          {user ? `${user.firstName} ${user.surname}` : ""}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open profile"
        hitSlop={8}
        onPress={() => navigation.navigate("Profile")}
        style={styles.avatar}
      >
        <AvatarIcon />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: "100%",
    minHeight: 86,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  welcome: {
    color: colors.text,
    fontSize: 44,
    lineHeight: 48,
    fontWeight: "800",
  },
  user: {
    color: colors.textMuted,
    fontSize: 20,
    fontWeight: "500",
    maxWidth: 270,
  },
  avatar: {
    width: 50,
    height: 50,
    minWidth: touchTarget,
    minHeight: touchTarget,
    borderRadius: 25,
    overflow: "hidden",
    backgroundColor: colors.text,
  },
});
