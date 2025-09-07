import { Stack } from "expo-router";
import { AuthProvider } from "../contexts/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="screen/home" />
        <Stack.Screen name="screen/water/water" />
        <Stack.Screen name="screen/medicines/medicine" />
        <Stack.Screen name="screen/reports/report" />
        <Stack.Screen name="screen/profle/profile" />
      </Stack>
    </AuthProvider>
  );
}
