import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "#1A1A2E", // Dark premium blue
          },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: {
            fontWeight: "bold",
          },
          contentStyle: {
            backgroundColor: "#0F0F1A", // Very dark background
          },
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ 
            title: "Quiz Chain",
            headerShown: false // We will build a custom hero header in index
          }} 
        />
        <Stack.Screen 
          name="create" 
          options={{ 
            title: "Buat Kuis Baru",
            presentation: "modal"
          }} 
        />
        <Stack.Screen 
          name="quiz" 
          options={{ 
            title: "Kuis Berjalan",
            headerBackVisible: false, // Don't allow accidental back during quiz unless with a custom button
          }} 
        />
      </Stack>
    </>
  );
}
