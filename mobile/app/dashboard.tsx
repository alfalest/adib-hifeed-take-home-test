import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import {
  getInventoryItems,
  getInventoryBatches,
  getInventoryMutations,
  FeedItem,
  StockBatch,
  StockMutation,
} from '../lib/api';

const { width } = Dimensions.get('window');

type TabType = 'stock' | 'batches' | 'mutations';

export default function SupervisorDashboardScreen() {
  const { user, isLoading, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('stock');
  const [items, setItems] = useState<FeedItem[]>([]);
  const [batches, setBatches] = useState<StockBatch[]>([]);
  const [mutations, setMutations] = useState<StockMutation[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Route protection
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login');
      } else if (user.role !== 'supervisor') {
        // Staff lapangan belongs to scanner
        router.replace('/');
      }
    }
  }, [user, isLoading]);

  const loadDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoadingData(true);

      const [itemsData, batchesData, mutationsData] = await Promise.all([
        getInventoryItems(100),
        getInventoryBatches(100),
        getInventoryMutations(50),
      ]);

      setItems(itemsData);
      setBatches(batchesData);
      setMutations(mutationsData);
    } catch (err: any) {
      Alert.alert('Gagal Memuat Data', err.message || 'Periksa koneksi ke server backend.');
    } finally {
      setLoadingData(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role === 'supervisor') {
      loadDashboardData();
    }
  }, [user, loadDashboardData]);

  const handleLogout = () => {
    Alert.alert('Konfirmasi Keluar', 'Apakah Anda yakin ingin keluar dari akun Supervisor?', [
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

  if (isLoading || !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00ab7e" />
      </View>
    );
  }

  // Calculate Metrics
  const totalItems = items.length;
  const totalActiveBatches = batches.filter((b) => b.status === 'ACTIVE').length;
  const nearExpiryBatches = batches.filter((b) => b.is_near_expiry).length;
  const lowStockItems = items.filter((i) => i.is_low_stock).length;

  // Filtered lists based on search
  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBatches = batches.filter(
    (b) =>
      b.batch_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.feed_item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMutations = mutations.filter(
    (m) =>
      m.feed_item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.batch.batch_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.created_by.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Image source={require('../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
            </View>
            <View>
              <Text style={styles.brandTitle}>HiFeed SCOM</Text>
              <View style={styles.supervisorBadge}>
                <Text style={styles.supervisorBadgeText}>SUPERVISOR GUDANG</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <Text style={styles.logoutBtnText}>Keluar</Text>
          </TouchableOpacity>
        </View>

        {/* Greeting & Action Row */}
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greetingSub}>Selamat datang,</Text>
            <Text style={styles.greetingName}>{user.name}</Text>
          </View>

          <TouchableOpacity
            style={styles.openScannerBtn}
            onPress={() => router.push({ pathname: '/', params: { from: 'dashboard' } })}
            activeOpacity={0.8}
          >
            <Text style={styles.openScannerBtnText}>📷 Buka Scanner</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadDashboardData(true)}
            tintColor="#00ab7e"
            colors={['#00ab7e']}
          />
        }
      >
        {/* KPI Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconBadge}>
              <Text style={styles.statEmoji}>📦</Text>
            </View>
            <Text style={styles.statValue}>{totalItems}</Text>
            <Text style={styles.statLabel}>Total SKU Pakan</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Text style={styles.statEmoji}>🏷️</Text>
            </View>
            <Text style={[styles.statValue, { color: '#10b981' }]}>{totalActiveBatches}</Text>
            <Text style={styles.statLabel}>Batch Aktif</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Text style={styles.statEmoji}>⚠️</Text>
            </View>
            <Text style={[styles.statValue, { color: nearExpiryBatches > 0 ? '#f59e0b' : '#94a3b8' }]}>
              {nearExpiryBatches}
            </Text>
            <Text style={styles.statLabel}>Mendekati Expired</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <Text style={styles.statEmoji}>🚨</Text>
            </View>
            <Text style={[styles.statValue, { color: lowStockItems > 0 ? '#ef4444' : '#94a3b8' }]}>
              {lowStockItems}
            </Text>
            <Text style={styles.statLabel}>Stok Rendah</Text>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'stock' && styles.tabBtnActive]}
            onPress={() => setActiveTab('stock')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, activeTab === 'stock' && styles.tabBtnTextActive]}>
              Stok Pakan ({items.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'batches' && styles.tabBtnActive]}
            onPress={() => setActiveTab('batches')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, activeTab === 'batches' && styles.tabBtnTextActive]}>
              Daftar Batch ({batches.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'mutations' && styles.tabBtnActive]}
            onPress={() => setActiveTab('mutations')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, activeTab === 'mutations' && styles.tabBtnTextActive]}>
              Mutasi ({mutations.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={
              activeTab === 'stock'
                ? 'Cari nama pakan / SKU...'
                : activeTab === 'batches'
                  ? 'Cari nomor batch...'
                  : 'Cari mutasi / nama petugas...'
            }
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClearBtn}>
              <Text style={styles.searchClearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Content Section */}
        {loadingData && !refreshing ? (
          <View style={styles.tabLoading}>
            <ActivityIndicator size="small" color="#00ab7e" />
            <Text style={styles.tabLoadingText}>Memuat data dari server...</Text>
          </View>
        ) : (
          <View style={styles.tabContent}>
            {/* TAB 1: STOK PAKAN */}
            {activeTab === 'stock' && (
              <View>
                {filteredItems.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyIcon}>📦</Text>
                    <Text style={styles.emptyTitle}>Tidak ada data pakan</Text>
                    <Text style={styles.emptySub}>Tidak ditemukan pakan yang sesuai kata kunci</Text>
                  </View>
                ) : (
                  filteredItems.map((item) => (
                    <View key={item.id} style={styles.itemCard}>
                      <View style={styles.itemCardHeader}>
                        <View style={{ flex: 1 }}>
                          <View style={styles.skuRow}>
                            <Text style={styles.skuText}>{item.sku}</Text>
                            <View style={styles.categoryBadge}>
                              <Text style={styles.categoryBadgeText}>{item.category}</Text>
                            </View>
                          </View>
                          <Text style={styles.itemName}>{item.name}</Text>
                        </View>

                        <View style={item.is_low_stock ? styles.statusLowBadge : styles.statusNormalBadge}>
                          <Text style={item.is_low_stock ? styles.statusLowText : styles.statusNormalText}>
                            {item.is_low_stock ? 'Stok Rendah' : 'Aman'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.itemCardDivider} />

                      <View style={styles.itemCardStats}>
                        <View style={styles.itemStatCol}>
                          <Text style={styles.itemStatLabel}>Stok Saat Ini</Text>
                          <Text
                            style={[
                              styles.itemStatValue,
                              item.is_low_stock && { color: '#ef4444' },
                            ]}
                          >
                            {item.current_stock.toLocaleString()} <Text style={styles.itemUnit}>{item.unit}</Text>
                          </Text>
                        </View>

                        <View style={styles.itemStatCol}>
                          <Text style={styles.itemStatLabel}>Batas Minimum</Text>
                          <Text style={styles.itemStatValueMuted}>
                            {item.min_stock.toLocaleString()} {item.unit}
                          </Text>
                        </View>

                        <View style={styles.itemStatCol}>
                          <Text style={styles.itemStatLabel}>Batch Aktif</Text>
                          <Text style={styles.itemStatValueMuted}>
                            {item.active_batches_count || 0} batch
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* TAB 2: DAFTAR BATCH */}
            {activeTab === 'batches' && (
              <View>
                {filteredBatches.length === 0 ? (
                  <View style={styles.emptyCard}>
                    {/* <Text style={styles.emptyIcon}>🏷️</Text> */}
                    <Text style={styles.emptyTitle}>Tidak ada batch ditemukan</Text>
                  </View>
                ) : (
                  filteredBatches.map((b) => {
                    const isExp = b.is_expired;
                    const isNear = b.is_near_expiry;

                    return (
                      <View key={b.id} style={styles.batchCard}>
                        <View style={styles.batchCardHeader}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.batchNumber}>{b.batch_number}</Text>
                            <Text style={styles.batchFeedName}>{b.feed_item.name}</Text>
                          </View>

                          <View
                            style={[
                              styles.batchStatusBadge,
                              isExp
                                ? styles.batchExpBadge
                                : isNear
                                  ? styles.batchNearBadge
                                  : styles.batchActiveBadge,
                            ]}
                          >
                            <Text
                              style={[
                                styles.batchStatusText,
                                isExp
                                  ? styles.batchExpText
                                  : isNear
                                    ? styles.batchNearText
                                    : styles.batchActiveText,
                              ]}
                            >
                              {isExp ? 'EXPIRED' : isNear ? 'MENDEKATI EXP' : 'AKTIF'}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.itemCardDivider} />

                        <View style={styles.batchDetailsRow}>
                          <View style={styles.batchDetailItem}>
                            <Text style={styles.batchDetailLabel}>Sisa Kuantitas</Text>
                            <Text style={styles.batchQtyValue}>
                              {b.current_qty} / {b.initial_qty}{' '}
                              <Text style={{ fontSize: 11, color: '#94a3b8' }}>{b.feed_item.unit}</Text>
                            </Text>
                          </View>

                          <View style={styles.batchDetailItem}>
                            <Text style={styles.batchDetailLabel}>Tanggal Expired</Text>
                            <Text
                              style={[
                                styles.batchDetailValue,
                                (isExp || isNear) && { color: isExp ? '#ef4444' : '#f59e0b', fontWeight: '700' },
                              ]}
                            >
                              {new Date(b.expired_date).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </Text>
                          </View>

                          <View style={styles.batchDetailItem}>
                            <Text style={styles.batchDetailLabel}>Masa Berlaku</Text>
                            <Text
                              style={[
                                styles.batchDetailValue,
                                b.days_until_expiry <= 0 ? { color: '#ef4444' } : { color: '#10b981' },
                              ]}
                            >
                              {b.days_until_expiry <= 0
                                ? 'Lewat tempo'
                                : `${b.days_until_expiry} hari lagi`}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}

            {/* TAB 3: RIWAYAT MUTASI */}
            {activeTab === 'mutations' && (
              <View>
                {filteredMutations.length === 0 ? (
                  <View style={styles.emptyCard}>
                    {/* <Text style={styles.emptyIcon}>📋</Text> */}
                    <Text style={styles.emptyTitle}>Belum ada riwayat mutasi</Text>
                  </View>
                ) : (
                  filteredMutations.map((m) => {
                    const isInbound = m.type === 'INBOUND';

                    return (
                      <View key={m.id} style={styles.mutationCard}>
                        <View style={styles.mutationTop}>
                          <View
                            style={[
                              styles.mutationTypeBadge,
                              isInbound ? styles.inboundBadge : styles.dispatchBadge,
                            ]}
                          >
                            <Text
                              style={[
                                styles.mutationTypeText,
                                isInbound ? styles.inboundText : styles.dispatchText,
                              ]}
                            >
                              {isInbound ? '📥 MASUK (INBOUND)' : '📤 KELUAR (DISPATCH)'}
                            </Text>
                          </View>

                          <Text
                            style={[
                              styles.mutationQty,
                              isInbound ? { color: '#10b981' } : { color: '#38bdf8' },
                            ]}
                          >
                            {isInbound ? '+' : '-'}
                            {m.quantity} {m.feed_item.unit}
                          </Text>
                        </View>

                        <Text style={styles.mutationFeedName}>{m.feed_item.name}</Text>

                        <View style={styles.mutationMetaRow}>
                          <Text style={styles.mutationBatchText}>
                            Batch: <Text style={{ color: '#e2e8f0' }}>{m.batch.batch_number}</Text>
                          </Text>
                          <Text style={styles.mutationUserText}>
                            Oleh: <Text style={{ color: '#00ab7e' }}>{m.created_by}</Text>
                          </Text>
                        </View>

                        <Text style={styles.mutationDate}>
                          🕒{' '}
                          {new Date(m.created_at).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                    );
                  })
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e1a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0e1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#111827',
    paddingTop: Platform.OS === 'ios' ? 54 : 44,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#e8f5f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 171, 126, 0.4)',
    padding: 4,
  },
  logoImage: {
    width: 30,
    height: 30,
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  supervisorBadge: {
    backgroundColor: 'rgba(0, 171, 126, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  supervisorBadgeText: {
    color: '#00ab7e',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutBtnText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  greetingSub: {
    color: '#94a3b8',
    fontSize: 12,
  },
  greetingName: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 1,
  },
  openScannerBtn: {
    backgroundColor: '#00ab7e',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: '#00ab7e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  openScannerBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    width: (width - 42) / 2,
    backgroundColor: '#131b2e',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  statIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statEmoji: {
    fontSize: 16,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#00ab7e',
  },
  tabBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131b2e',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  searchIcon: {
    marginRight: 8,
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
    padding: 0,
  },
  searchClearBtn: {
    padding: 4,
  },
  searchClearText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '700',
  },
  tabLoading: {
    paddingVertical: 30,
    alignItems: 'center',
    gap: 8,
  },
  tabLoadingText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  tabContent: {
    gap: 10,
  },
  emptyCard: {
    backgroundColor: '#131b2e',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
    marginTop: 10,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  emptySub: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
  },
  itemCard: {
    backgroundColor: '#131b2e',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 10,
  },
  itemCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  skuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  skuText: {
    color: '#00ab7e',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryBadgeText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '500',
  },
  itemName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  statusNormalBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusNormalText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
  },
  statusLowBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusLowText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '700',
  },
  itemCardDivider: {
    height: 1,
    backgroundColor: '#1e293b',
    marginVertical: 10,
  },
  itemCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemStatCol: {
    flex: 1,
  },
  itemStatLabel: {
    color: '#64748b',
    fontSize: 11,
    marginBottom: 2,
  },
  itemStatValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  itemStatValueMuted: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  itemUnit: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '400',
  },
  batchCard: {
    backgroundColor: '#131b2e',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 10,
  },
  batchCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  batchNumber: {
    color: '#00ab7e',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  batchFeedName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  batchStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  batchActiveBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  batchActiveText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '700',
  },
  batchNearBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  batchNearText: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: '700',
  },
  batchExpBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  batchExpText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '700',
  },
  batchStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  batchDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  batchDetailItem: {
    flex: 1,
  },
  batchDetailLabel: {
    color: '#64748b',
    fontSize: 11,
    marginBottom: 2,
  },
  batchQtyValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  batchDetailValue: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  mutationCard: {
    backgroundColor: '#131b2e',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 10,
  },
  mutationTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  mutationTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  inboundBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  inboundText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '700',
  },
  dispatchBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  dispatchText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '700',
  },
  mutationTypeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  mutationQty: {
    fontSize: 16,
    fontWeight: '800',
  },
  mutationFeedName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  mutationMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  mutationBatchText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  mutationUserText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  mutationDate: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 6,
  },
});
