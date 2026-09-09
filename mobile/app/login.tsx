import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl, setCustomApiUrl } from '../lib/api';

export default function LoginScreen() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Server IP config modal state
  const [showServerModal, setShowServerModal] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState(getApiBaseUrl());

  const { user, isLoading, login } = useAuth();

  // If already authenticated, redirect to appropriate screen based on role
  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === 'supervisor') {
        router.replace('/dashboard');
      } else {
        router.replace('/');
      }
    }
  }, [user, isLoading]);

  const handleLogin = async () => {
    if (!userId.trim() || !password.trim()) {
      Alert.alert('Perhatian', 'Harap isi User ID dan Password.');
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await login(userId.trim(), password);
      // Route based on role: supervisor goes to dashboard, staff goes to scanner
      if (loggedUser.role === 'supervisor') {
        router.replace('/dashboard');
      } else {
        router.replace('/');
      }
    } catch (err: any) {
      Alert.alert('Gagal Masuk', err.message || 'Periksa User ID dan Password Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (id: string, pass: string) => {
    setUserId(id);
    setPassword(pass);
  };

  const handleSaveServerUrl = () => {
    if (!serverUrlInput.trim()) {
      Alert.alert('Error', 'URL Server tidak boleh kosong');
      return;
    }
    setCustomApiUrl(serverUrlInput.trim());
    setShowServerModal(false);
    Alert.alert('Berhasil', `URL Server diubah ke: ${serverUrlInput.trim()}`);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Logo & Header */}
        <View style={styles.header}>
          <View style={styles.logoWrapper}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brandTitle}>HiFeed</Text>
          <Text style={styles.brandSubtitle}>Mobile Scanner & Field Operations</Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Masuk Akun</Text>
          <Text style={styles.cardDesc}>
            Masuk dengan kredensial staff lapangan atau supervisor
          </Text>

          {/* User ID Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>User ID</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: staff-01"
              placeholderTextColor="#64748b"
              value={userId}
              onChangeText={setUserId}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Masukkan password"
                placeholderTextColor="#64748b"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                <Text style={styles.eyeBtnText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitBtnText}>Masuk ke Aplikasi</Text>
            )}
          </TouchableOpacity>

          {/* Quick Demo Fill Buttons */}
          <View style={styles.demoSection}>
            <Text style={styles.demoSectionTitle}>Akun Uji Coba Cepat:</Text>
            <View style={styles.demoGrid}>
              <TouchableOpacity
                style={styles.demoButtonStaff}
                onPress={() => handleQuickFill('staff-01', 'staff123')}
              >
                <Text style={styles.demoBadgeStaff}>Staff Lapangan</Text>
                <Text style={styles.demoName}>Ahmad Fauzi</Text>
                <Text style={styles.demoSub}>ID: staff-01</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.demoButtonSupervisor}
                onPress={() => handleQuickFill('supervisor-01', 'super123')}
              >
                <Text style={styles.demoBadgeSupervisor}>Supervisor</Text>
                <Text style={styles.demoName}>Supervisor Gudang</Text>
                <Text style={styles.demoSub}>ID: supervisor-01</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Server Config Button */}
        <TouchableOpacity
          style={styles.serverConfigBtn}
          onPress={() => {
            setServerUrlInput(getApiBaseUrl());
            setShowServerModal(true);
          }}
        >
          <Text style={styles.serverConfigBtnText}>⚙️ Pengaturan Server: {getApiBaseUrl()}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Server URL Config Modal */}
      <Modal
        visible={showServerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowServerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pengaturan IP Server Backend</Text>
            <Text style={styles.modalDesc}>
              Masukkan IP PC Anda jika menggunakan perangkat fisik di jaringan Wi-Fi lokal:
            </Text>

            <TextInput
              style={styles.modalInput}
              value={serverUrlInput}
              onChangeText={setServerUrlInput}
              placeholder="http://192.168.x.x:3001"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowServerModal(false)}
              >
                <Text style={styles.modalCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveServerUrl}
              >
                <Text style={styles.modalSaveText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e1a',
  },
  scrollContent: {
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoWrapper: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#e8f5f0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 171, 126, 0.3)',
    marginBottom: 12,
  },
  logo: {
    width: 46,
    height: 46,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#00ab7e',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3c0',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  card: {
    backgroundColor: '#141d2e',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f0f4ff',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: '#94a3c0',
    marginBottom: 18,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0a0e1a',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#f0f4ff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  passwordContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 60,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    padding: 6,
  },
  eyeBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00ab7e',
  },
  submitBtn: {
    backgroundColor: '#00ab7e',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  demoSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  demoSectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  demoGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  demoButtonStaff: {
    flex: 1,
    backgroundColor: 'rgba(255, 107, 53, 0.08)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.25)',
  },
  demoBadgeStaff: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    color: '#ff6b35',
    fontSize: 9,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  demoButtonSupervisor: {
    flex: 1,
    backgroundColor: 'rgba(0, 171, 126, 0.08)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 171, 126, 0.25)',
  },
  demoBadgeSupervisor: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 171, 126, 0.2)',
    color: '#00ab7e',
    fontSize: 9,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  demoName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f0f4ff',
  },
  demoSub: {
    fontSize: 10,
    color: '#94a3c0',
    marginTop: 2,
  },
  serverConfigBtn: {
    marginTop: 20,
    alignItems: 'center',
    padding: 10,
  },
  serverConfigBtnText: {
    fontSize: 11,
    color: '#64748b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#141d2e',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f0f4ff',
    marginBottom: 6,
  },
  modalDesc: {
    fontSize: 12,
    color: '#94a3c0',
    marginBottom: 14,
    lineHeight: 18,
  },
  modalInput: {
    backgroundColor: '#0a0e1a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f0f4ff',
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalCancelText: {
    color: '#94a3c0',
    fontSize: 13,
    fontWeight: '600',
  },
  modalSaveBtn: {
    backgroundColor: '#00ab7e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalSaveText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
