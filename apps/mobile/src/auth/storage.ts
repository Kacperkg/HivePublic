import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const key = "the-hive-session";
let webSession: string | null = null;

export const sessionStorage = {
  get: async () =>
    Platform.OS === "web" ? webSession : SecureStore.getItemAsync(key),
  set: async (token: string) => {
    if (Platform.OS === "web") webSession = token;
    else await SecureStore.setItemAsync(key, token);
  },
  clear: async () => {
    if (Platform.OS === "web") webSession = null;
    else await SecureStore.deleteItemAsync(key);
  },
};
