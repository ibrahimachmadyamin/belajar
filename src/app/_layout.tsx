import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F8F9FA' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="settings" options={{ headerShown: true, title: 'Pengaturan' }} />
        <Stack.Screen name="quiz" options={{ headerShown: true, title: 'Kuis AI', presentation: 'modal' }} />
        <Stack.Screen name="chat" options={{ headerShown: true, title: 'Tanya AI' }} />
      </Stack>
    </>
  );
}
