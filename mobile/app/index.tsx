import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { getApiBaseUrl, setCustomApiUrl } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');
const SCANNER_SIZE = width * 0.7;

export default function ScannerScreen() {
  const { user, isLoading, logout } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [torch, setTorch] = useState(false);

  // Server IP config state
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState(getApiBaseUrl());

  const params = useLocalSearchParams<{ from?: string }>();

  // Protect route: redirect to /login if not logged in
  // Redirect supervisor to /dashboard unless specifically navigating to scanner from dashboard
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login');
      } else if (user.role === 'supervisor' && params.from !== 'dashboard') {
        router.replace('/dashboard');
      }
    }
  }, [user, isLoading, params.from]);

  const handleLogout = () => {
    Alert.alert('Konfirmasi Keluar', 'Apakah Anda yakin ingin keluar dari akun?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);

    // Navigate to confirm screen with scanned data
    router.push({
      pathname: '/confirm',
      params: { qrPayload: data },
    });
  };

  const handleManualSubmit = () => {
    if (!manualInput.trim()) {
      Alert.alert('Error', 'Masukkan batch number atau QR payload');
      return;
    }

    router.push({
      pathname: '/confirm',
      params: { qrPayload: manualInput.trim() },
    });
  };

  const handleSaveServerUrl = () => {
    if (!serverUrlInput.trim()) {
      Alert.alert('Error', 'URL Server tidak boleh kosong');
      return;
    }
    setCustomApiUrl(serverUrlInput.trim());
    setShowServerConfig(false);
    Alert.alert('Berhasil', `URL Backend diubah ke:\n${serverUrlInput.trim()}`);
  };

  // Reset scanned state when returning to this screen
  useEffect(() => {
    setScanned(false);
    setShowManualInput(false);
    setManualInput('');
  }, []);

  if (isLoading || !user) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#00ab7e" />
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionCard}>
          <View style={styles.permissionLogoContainer}>
            <Image
              source={require('../assets/logo.png')}
              style={styles.permissionLogo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.permissionTitle}>Izin Kamera Diperlukan</Text>
          <Text style={styles.permissionDesc}>
            HiFeed Scanner membutuhkan akses kamera untuk memindai barcode/QR code pada palet pakan.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
            <Text style={styles.primaryButtonText}>Izinkan Kamera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setShowManualInput(true)}
          >
            <Text style={styles.secondaryButtonText}>Input Manual</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { marginTop: 12 }]}
            onPress={() => {
              setServerUrlInput(getApiBaseUrl());
              setShowServerConfig(true);
            }}
          >
            <Text style={styles.secondaryButtonText}>⚙️ Setting Server IP</Text>
          </TouchableOpacity>
        </View>

        {/* Server Config Modal */}
        {renderServerModal()}
      </View>
    );
  }

  function renderServerModal() {
    return (
      <Modal visible={showServerConfig} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⚙️ Setting Backend IP</Text>
            <Text style={styles.modalDesc}>
              Sesuaikan IP komputer tempat Backend API berjalan (Port 3001).
            </Text>

            <Text style={styles.inputLabel}>URL Backend:</Text>
            <TextInput
              style={styles.input}
              value={serverUrlInput}
              onChangeText={setServerUrlInput}
              placeholder="http://192.168.1.X:3001"
              placeholderTextColor="#5b6b8a"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.tipText}>
              💡 Petunjuk:
              {'\n'}• Emulator Android (PC): http://10.0.2.2:3001
              {'\n'}• HP Fisik (Expo Go): http://[IP-Wi-Fi-Komputer]:3001
            </Text>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <TouchableOpacity
                style={[styles.secondaryButton, { flex: 1 }]}
                onPress={() => setShowServerConfig(false)}
              >
                <Text style={styles.secondaryButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { flex: 1, marginBottom: 0 }]}
                onPress={handleSaveServerUrl}
              >
                <Text style={styles.primaryButtonText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <View style={styles.container}>
      {!showManualInput ? (
        <>
          {/* Camera Scanner */}
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39'],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              enableTorch={torch}
            />
            {/* Scanner Overlay */}
            <View style={styles.scannerOverlay}>
              <View style={styles.scannerHeader}>
                {/* User Bar */}
                <View style={styles.userBar}>
                  <View style={styles.userInfoLeft}>
                    <View style={[styles.userAvatar, user.role === 'supervisor' ? styles.userAvatarSupervisor : styles.userAvatarStaff]}>
                      <Text style={styles.userAvatarText}>{user.role === 'supervisor' ? 'SV' : 'ST'}</Text>
                    </View>
                    <View>
                      <Text style={styles.userNameText}>{user.name}</Text>
                      <Text style={[styles.userRoleBadge, user.role === 'supervisor' ? styles.userRoleSupervisor : styles.userRoleStaff]}>
                        {user.role === 'supervisor' ? 'Supervisor Gudang' : 'Staff Lapangan'}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {user.role === 'supervisor' && (
                      <TouchableOpacity
                        onPress={() => router.replace('/dashboard')}
                        style={styles.backDashboardBtn}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.backDashboardBtnText}>📊 Dashboard</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                      <Text style={styles.logoutBtnText}>Keluar</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.scannerLogoContainer}>
                  <Image
                    source={require('../assets/logo.png')}
                    style={styles.scannerLogo}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.scannerTitle}>Scan Pakan</Text>
                <Text style={styles.scannerSubtitle}>
                  Arahkan kamera ke QR Code / Barcode pada karung atau palet pakan
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setServerUrlInput(getApiBaseUrl());
                    setShowServerConfig(true);
                  }}
                  style={styles.serverBadge}
                >
                  <Text style={styles.serverBadgeText}>⚙️ {getApiBaseUrl()}</Text>
                </TouchableOpacity>
              </View>

              {/* Scanner Frame */}
              <View style={styles.scannerFrame}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
                <View style={styles.scanLine} />
              </View>

              {/* Controls */}
              <View style={styles.controlsRow}>
                <TouchableOpacity
                  style={[styles.controlButton, torch && styles.controlButtonActive]}
                  onPress={() => setTorch(!torch)}
                >
                  <Text style={styles.controlButtonText}>
                    {torch ? '💡 Flash ON' : '🔦 Flash'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => setShowManualInput(true)}
                >
                  <Text style={styles.controlButtonText}>⌨️ Manual</Text>
                </TouchableOpacity>
              </View>

              {scanned && (
                <TouchableOpacity
                  style={styles.rescanButton}
                  onPress={() => setScanned(false)}
                >
                  <Text style={styles.rescanButtonText}>🔄 Scan Ulang</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </>
      ) : (
        /* Manual Input */
        <View style={styles.manualContainer}>
          <View style={styles.manualCard}>
            {/* User Bar in Manual Mode */}
            <View style={[styles.userBar, { marginBottom: 16, backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: 12, padding: 8 }]}>
              <View style={styles.userInfoLeft}>
                <View style={[styles.userAvatar, user.role === 'supervisor' ? styles.userAvatarSupervisor : styles.userAvatarStaff]}>
                  <Text style={styles.userAvatarText}>{user.role === 'supervisor' ? 'SV' : 'ST'}</Text>
                </View>
                <View>
                  <Text style={styles.userNameText}>{user.name}</Text>
                  <Text style={[styles.userRoleBadge, user.role === 'supervisor' ? styles.userRoleSupervisor : styles.userRoleStaff]}>
                    {user.role === 'supervisor' ? 'Supervisor Gudang' : 'Staff Lapangan'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                <Text style={styles.logoutBtnText}>Keluar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.manualLogoContainer}>
              <Image
                source={require('../assets/logo.png')}
                style={styles.manualLogo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.manualTitle}>Input Manual</Text>
            <Text style={styles.manualDesc}>
              Masukkan batch number atau paste QR payload jika kamera tidak tersedia.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Contoh: BATCH-BR01-2024-001"
              placeholderTextColor="#5b6b8a"
              value={manualInput}
              onChangeText={setManualInput}
              autoCapitalize="characters"
              autoFocus
            />

            <TouchableOpacity style={styles.primaryButton} onPress={handleManualSubmit}>
              <Text style={styles.primaryButtonText}>🔍 Cari Batch</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setShowManualInput(false)}
            >
              <Text style={styles.secondaryButtonText}>← Kembali ke Scanner</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { marginTop: 12 }]}
              onPress={() => {
                setServerUrlInput(getApiBaseUrl());
                setShowServerConfig(true);
              }}
            >
              <Text style={styles.secondaryButtonText}>⚙️ Server IP: {getApiBaseUrl()}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {renderServerModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e1a',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  scannerHeader: {
    alignItems: 'center',
  },
  scannerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f0f4ff',
    marginBottom: 8,
  },
  scannerSubtitle: {
    fontSize: 14,
    color: '#94a3c0',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  scannerFrame: {
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#00ab7e',
  },
  cornerTL: {
    top: 0, left: 0,
    borderTopWidth: 4, borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    top: 0, right: 0,
    borderTopWidth: 4, borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    bottom: 0, left: 0,
    borderBottomWidth: 4, borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    bottom: 0, right: 0,
    borderBottomWidth: 4, borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  scanLine: {
    position: 'absolute',
    top: '50%',
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: '#00ab7e',
    opacity: 0.8,
    borderRadius: 1,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  controlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  controlButtonActive: {
    backgroundColor: 'rgba(0, 171, 126, 0.25)',
    borderColor: '#00ab7e',
  },
  controlButtonText: {
    color: '#f0f4ff',
    fontSize: 14,
    fontWeight: '600',
  },
  rescanButton: {
    backgroundColor: '#00ab7e',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  rescanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Permission styles
  permissionCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f0f4ff',
    marginBottom: 12,
  },
  permissionDesc: {
    fontSize: 15,
    color: '#94a3c0',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    maxWidth: 300,
  },

  // Manual input styles
  manualContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  manualCard: {
    backgroundColor: '#1a1f35',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e2740',
  },
  manualIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  manualTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f0f4ff',
    marginBottom: 8,
  },
  manualDesc: {
    fontSize: 14,
    color: '#94a3c0',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  input: {
    width: '100%',
    backgroundColor: '#161c30',
    borderWidth: 1,
    borderColor: '#1e2740',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#f0f4ff',
    marginBottom: 16,
    fontWeight: '500',
  },

  // Button styles
  primaryButton: {
    width: '100%',
    backgroundColor: '#00ab7e',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  scannerLogoContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#e8f5f0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 171, 126, 0.3)',
    marginBottom: 10,
  },
  scannerLogo: {
    width: 30,
    height: 30,
  },
  permissionLogoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#e8f5f0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderWidth: 2,
    borderColor: 'rgba(0, 171, 126, 0.3)',
    marginBottom: 20,
  },
  permissionLogo: {
    width: 56,
    height: 56,
  },
  manualLogoContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#e8f5f0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 171, 126, 0.3)',
    marginBottom: 16,
  },
  manualLogo: {
    width: 40,
    height: 40,
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e2740',
  },
  secondaryButtonText: {
    color: '#94a3c0',
    fontSize: 14,
    fontWeight: '600',
  },

  // Server badge & modal styles
  serverBadge: {
    marginTop: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  serverBadgeText: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1f35',
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1e2740',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f0f4ff',
    marginBottom: 6,
  },
  modalDesc: {
    fontSize: 13,
    color: '#94a3c0',
    marginBottom: 16,
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 13,
    color: '#cbd5e1',
    fontWeight: '600',
    marginBottom: 6,
  },
  tipText: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
    marginTop: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 10,
    borderRadius: 8,
  },

  // User info bar styles
  userBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: 'rgba(10, 14, 26, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
  },
  userInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarStaff: {
    backgroundColor: '#ff6b35',
  },
  userAvatarSupervisor: {
    backgroundColor: '#00ab7e',
  },
  userAvatarText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  userNameText: {
    color: '#f0f4ff',
    fontSize: 12,
    fontWeight: '700',
  },
  userRoleBadge: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 1,
  },
  userRoleStaff: {
    color: '#ff8a50',
  },
  userRoleSupervisor: {
    color: '#00ab7e',
  },
  backDashboardBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#00ab7e',
  },
  backDashboardBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  logoutBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutBtnText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '600',
  },
});
