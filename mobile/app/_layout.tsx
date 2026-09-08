import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#0a0e1a',
          },
          headerTintColor: '#f0f4ff',
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
          },
          contentStyle: {
            backgroundColor: '#0a0e1a',
          },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'HiFeed Scanner',
            headerTitleAlign: 'center',
          }}
        />
        <Stack.Screen
          name="confirm"
          options={{
            title: 'Konfirmasi Aksi',
            presentation: 'modal',
            headerTitleAlign: 'center',
          }}
        />
      </Stack>
    </>
  );
}
