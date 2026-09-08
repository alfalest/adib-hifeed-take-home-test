import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { findBatchByQR, processInbound, processDispatch, type BatchDetail } from '@/lib/api';

type ActionType = 'INBOUND' | 'DISPATCH' | null;

export default function ConfirmScreen() {
  const { qrPayload } = useLocalSearchParams<{ qrPayload: string }>();
  const [batch, setBatch] = useState<BatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<ActionType>(null);
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [success, setSuccess] = useState(false);
  const [resultMessage, setResultMessage] = useState('');

  useEffect(() => {
    loadBatch();
  }, [qrPayload]);

  const loadBatch = async () => {
    if (!qrPayload) {
      setError('QR payload tidak ditemukan');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const found = await findBatchByQR(qrPayload);
      if (!found) {
        setError(`Batch tidak ditemukan untuk payload: "${qrPayload}". Pastikan QR code valid.`);
      } else {
        setBatch(found);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data batch');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleSubmit = async () => {
    if (!action) {
      Alert.alert('Error', 'Pilih aksi terlebih dahulu (Inbound / Dispatch)');
      return;
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Error', 'Masukkan jumlah kuantitas yang valid');
      return;
    }

    if (!batch) return;

    try {
      setSubmitting(true);

      if (action === 'INBOUND') {
        await processInbound({
          batch_number: batch.batch_number,
          sku: batch.feed_item.sku,
          quantity: qty,
          expired_date: batch.expired_date,
          notes: notes || undefined,
        });
        setResultMessage(`✅ Berhasil menambah ${qty} unit ke batch ${batch.batch_number}`);
      } else {
        await processDispatch({
          qr_payload: batch.qr_payload,
          quantity: qty,
          notes: notes || undefined,
        });
        setResultMessage(`✅ Berhasil mengurangi ${qty} unit dari batch ${batch.batch_number}`);
      }

      setSuccess(true);
    } catch (err: any) {
      Alert.alert('Gagal', err.message || 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Mencari batch...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>❌</Text>
        <Text style={styles.errorTitle}>Batch Tidak Ditemukan</Text>
        <Text style={styles.errorDesc}>{error}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>← Scan Ulang</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (success) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.successIcon}>🎉</Text>
        <Text style={styles.successTitle}>Berhasil!</Text>
        <Text style={styles.successMessage}>{resultMessage}</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            setSuccess(false);
            setAction(null);
            setQuantity('');
            setNotes('');
            router.back();
          }}
        >
          <Text style={styles.primaryButtonText}>📷 Scan Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!batch) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Batch Detail Card */}
      <View style={styles.detailCard}>
        <View style={styles.detailHeader}>
          <Text style={styles.detailIcon}>📦</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.detailName}>{batch.feed_item.name}</Text>
            <Text style={styles.detailSku}>{batch.feed_item.sku}</Text>
          </View>
          <View style={[
            styles.statusBadge,
            batch.status === 'ACTIVE' ? styles.statusActive :
            batch.status === 'DEPLETED' ? styles.statusDepleted : styles.statusExpired
          ]}>
            <Text style={[
              styles.statusText,
              batch.status === 'ACTIVE' ? styles.statusTextActive :
              batch.status === 'DEPLETED' ? styles.statusTextDepleted : styles.statusTextExpired
            ]}>
              {batch.status}
            </Text>
          </View>
        </View>

        <View style={styles.detailGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>No. Batch</Text>
            <Text style={styles.detailValue}>{batch.batch_number}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Sisa Qty</Text>
            <Text style={[styles.detailValue, styles.detailValueHighlight]}>
              {batch.current_qty} / {batch.initial_qty}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Tgl Kedaluwarsa</Text>
            <Text style={[
              styles.detailValue,
              batch.is_expired && styles.expiredText,
              batch.is_near_expiry && styles.nearExpiryText,
            ]}>
              {formatDate(batch.expired_date)}
              {batch.is_expired && ' ⚠️ EXPIRED'}
              {batch.is_near_expiry && ` ⏰ ${batch.days_until_expiry} hari lagi`}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Kategori</Text>
            <Text style={styles.detailValue}>
              {batch.feed_item.category === 'POULTRY' ? '🐔' : '🐄'} {batch.feed_item.category}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Selection */}
      <Text style={styles.sectionTitle}>Pilih Aksi</Text>
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionInbound, action === 'INBOUND' && styles.actionSelected]}
          onPress={() => setAction('INBOUND')}
        >
          <Text style={styles.actionIcon}>📥</Text>
          <Text style={[styles.actionLabel, action === 'INBOUND' && styles.actionLabelSelected]}>
            Inbound
          </Text>
          <Text style={styles.actionDesc}>Tambah Stok</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionDispatch, action === 'DISPATCH' && styles.actionSelectedDispatch]}
          onPress={() => setAction('DISPATCH')}
        >
          <Text style={styles.actionIcon}>📤</Text>
          <Text style={[styles.actionLabel, action === 'DISPATCH' && styles.actionLabelSelectedDispatch]}>
            Dispatch
          </Text>
          <Text style={styles.actionDesc}>Kurangi Stok</Text>
        </TouchableOpacity>
      </View>

      {/* Quantity Input */}
      {action && (
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Jumlah Kuantitas</Text>
          <TextInput
            style={styles.input}
            placeholder="Masukkan jumlah..."
            placeholderTextColor="#5b6b8a"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            autoFocus
          />
          {action === 'DISPATCH' && (
            <Text style={styles.inputHint}>
              Sisa stok batch: {batch.current_qty} {batch.feed_item.unit}
            </Text>
          )}

          <Text style={[styles.inputLabel, { marginTop: 16 }]}>Catatan (opsional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Contoh: Dispatch ke Peternakan Mitra..."
            placeholderTextColor="#5b6b8a"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            style={[
              styles.submitButton,
              action === 'INBOUND' ? styles.submitInbound : styles.submitDispatch,
              submitting && styles.submitDisabled,
            ]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {action === 'INBOUND' ? '📥 Konfirmasi Inbound' : '📤 Konfirmasi Dispatch'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e1a',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#0a0e1a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#94a3c0',
  },

  // Error
  errorIcon: { fontSize: 56, marginBottom: 20 },
  errorTitle: { fontSize: 22, fontWeight: '700', color: '#f87171', marginBottom: 8 },
  errorDesc: { fontSize: 14, color: '#94a3c0', textAlign: 'center', lineHeight: 20, marginBottom: 32, maxWidth: 320 },

  // Success
  successIcon: { fontSize: 64, marginBottom: 20 },
  successTitle: { fontSize: 28, fontWeight: '800', color: '#34d399', marginBottom: 12 },
  successMessage: { fontSize: 16, color: '#94a3c0', textAlign: 'center', lineHeight: 24, marginBottom: 40, maxWidth: 320 },

  // Detail Card
  detailCard: {
    backgroundColor: '#1a1f35',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1e2740',
    marginBottom: 24,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e2740',
  },
  detailIcon: { fontSize: 32 },
  detailName: { fontSize: 18, fontWeight: '700', color: '#f0f4ff' },
  detailSku: { fontSize: 13, color: '#6366f1', fontWeight: '600', marginTop: 2 },
  detailGrid: { gap: 16 },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: { fontSize: 14, color: '#5b6b8a', fontWeight: '500' },
  detailValue: { fontSize: 14, color: '#f0f4ff', fontWeight: '600', textAlign: 'right', flex: 1, marginLeft: 16 },
  detailValueHighlight: { color: '#6366f1', fontSize: 16 },
  expiredText: { color: '#f87171' },
  nearExpiryText: { color: '#fbbf24' },

  // Status Badge
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusActive: { backgroundColor: 'rgba(52, 211, 153, 0.15)' },
  statusDepleted: { backgroundColor: 'rgba(91, 107, 138, 0.15)' },
  statusExpired: { backgroundColor: 'rgba(248, 113, 113, 0.15)' },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  statusTextActive: { color: '#34d399' },
  statusTextDepleted: { color: '#5b6b8a' },
  statusTextExpired: { color: '#f87171' },

  // Section
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#f0f4ff', marginBottom: 12 },

  // Actions
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionButton: {
    flex: 1,
    backgroundColor: '#1a1f35',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1e2740',
  },
  actionInbound: {},
  actionDispatch: {},
  actionSelected: {
    borderColor: '#34d399',
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
  },
  actionSelectedDispatch: {
    borderColor: '#f87171',
    backgroundColor: 'rgba(248, 113, 113, 0.08)',
  },
  actionIcon: { fontSize: 32, marginBottom: 8 },
  actionLabel: { fontSize: 16, fontWeight: '700', color: '#94a3c0', marginBottom: 4 },
  actionLabelSelected: { color: '#34d399' },
  actionLabelSelectedDispatch: { color: '#f87171' },
  actionDesc: { fontSize: 12, color: '#5b6b8a' },

  // Input
  inputSection: { marginBottom: 24 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#94a3c0', marginBottom: 8 },
  input: {
    backgroundColor: '#161c30',
    borderWidth: 1,
    borderColor: '#1e2740',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#f0f4ff',
    fontWeight: '500',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputHint: { fontSize: 12, color: '#fbbf24', marginTop: 6, fontWeight: '500' },

  // Submit
  submitButton: {
    marginTop: 20,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitInbound: { backgroundColor: '#34d399' },
  submitDispatch: { backgroundColor: '#f87171' },
  submitDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#fff', fontSize: 17, fontWeight: '800' },

  // Primary Button (reuse)
  primaryButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
