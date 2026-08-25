import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { FlatList, Swipeable } from "react-native-gesture-handler";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/types";
import { api } from "@/api/endpoints";
import { Screen } from "@/components/Screen";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { WorkoutNumber } from "@/components/WorkoutNumber";
import { ArrowUpRightIcon } from "@/components/Icons";
import { StateView } from "@/components/StateView";
import { colors, radii, spacing, tabBarHeight } from "@/theme/tokens";

export function WorkoutLibraryScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["workouts"],
    queryFn: ({ signal }) => api.workouts(signal),
  });
  const deletion = useMutation({
    mutationFn: api.deleteWorkout,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["workouts"] }),
        client.invalidateQueries({ queryKey: ["assignments"] }),
      ]);
    },
  });
  const confirmDelete = (id: string, name: string) =>
    Alert.alert(
      "Delete workout?",
      `${name} will be removed. Scheduled history is kept.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deletion.mutate(id),
        },
      ],
    );
  return (
    <Screen>
      <Header />
      <View style={styles.body}>
        {query.isPending ? (
          <StateView kind="loading" />
        ) : query.isError ? (
          <StateView
            kind="error"
            message="Your workouts could not be loaded."
            onRetry={() => void query.refetch()}
          />
        ) : (
          <FlatList
            data={query.data}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.list,
              query.data?.length === 0 && styles.emptyList,
            ]}
            ListEmptyComponent={
              <StateView
                kind="empty"
                title="No workouts yet"
                message="Create your first workout to start planning."
              />
            }
            renderItem={({ item }) => (
              <Swipeable
                containerStyle={styles.row}
                overshootRight={false}
                renderRightActions={() => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${item.name}`}
                    onPress={() => confirmDelete(item.id, item.name)}
                    style={styles.delete}
                  >
                    <Text style={styles.deleteText}>Delete</Text>
                  </Pressable>
                )}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${item.name}`}
                  onPress={() =>
                    navigation.navigate("WorkoutForm", { workoutId: item.id })
                  }
                  onLongPress={() => confirmDelete(item.id, item.name)}
                  style={styles.rowMain}
                >
                  <View style={styles.identity}>
                    <WorkoutNumber number={item.position} />
                    <Text style={styles.name}>{item.name}</Text>
                  </View>
                  <View style={styles.link}>
                    <ArrowUpRightIcon />
                  </View>
                </Pressable>
              </Swipeable>
            )}
          />
        )}
        <View style={styles.cta}>
          <Button
            label="ADD WORKOUT"
            onPress={() => navigation.navigate("WorkoutForm")}
          />
        </View>
        {deletion.isError ? (
          <Text accessibilityRole="alert" style={styles.error}>
            Workout could not be deleted.
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  list: { paddingHorizontal: spacing.md, paddingBottom: tabBarHeight + 110 },
  emptyList: { flexGrow: 1 },
  row: { marginBottom: spacing.xs },
  rowMain: {
    flex: 1,
    height: 84,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
  },
  identity: {
    marginLeft: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  name: { color: colors.text, fontSize: 16, fontWeight: "700", flexShrink: 1 },
  link: {
    height: "100%",
    aspectRatio: 1,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  delete: {
    width: 72,
    height: 84,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteText: { color: colors.text, fontWeight: "700" },
  cta: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    bottom: tabBarHeight + spacing.lg,
    backgroundColor: colors.background,
  },
  error: {
    position: "absolute",
    bottom: tabBarHeight + 4,
    left: spacing.md,
    right: spacing.md,
    color: colors.primary,
    textAlign: "center",
  },
});
