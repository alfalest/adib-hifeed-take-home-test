import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, Image, StyleSheet } from 'react-native';
import { AuthProvider } from '../context/AuthContext';

function HeaderLogo() {
  return (
    <View style={headerStyles.container}>
      <View style={headerStyles.logoWrapper}>
        <Image
          source={require('../assets/logo.png')}
          style={headerStyles.logo}
          resizeMode="contain"
        />
      </View>
      <View>
        <Text style={headerStyles.brandText}>HiFeed</Text>
        <Text style={headerStyles.subtitleText}>Mobile Scanner</Text>
      </View>
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack
        initialRouteName="login"
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
          name="login"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="dashboard"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="index"
          options={{
            headerTitle: () => <HeaderLogo />,
            headerTitleAlign: 'center',
          }}
        />
        <Stack.Screen
          name="confirm"
          options={{
            title: 'Konfirmasi Aksi',
            presentation: 'modal',
            headerTitleAlign: 'center',
            headerTitle: () => (
              <View style={headerStyles.container}>
                <View style={headerStyles.logoWrapper}>
                  <Image
                    source={require('../assets/logo.png')}
                    style={headerStyles.logo}
                    resizeMode="contain"
                  />
                </View>
                <View>
                  <Text style={headerStyles.brandText}>HiFeed</Text>
                  <Text style={headerStyles.subtitleText}>Konfirmasi Aksi</Text>
                </View>
              </View>
            ),
          }}
        />
      </Stack>
    </AuthProvider>
  );
}

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoWrapper: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#e8f5f0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 171, 126, 0.3)',
  },
  logo: {
    width: 24,
    height: 24,
  },
  brandText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00ab7e',
    letterSpacing: -0.3,
    lineHeight: 20,
  },
  subtitleText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3c0',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
