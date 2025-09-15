import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BottomNavigation from '../../../components/BottomNavigation';
import { supabase } from '../../../lib/supabase';

type Weekly = {
  week: string;
  water_total_ml: number | null;
  meds_taken: number | null;
  meds_expected: number | null;
  adherence_pct: number | null;
};

export default function Reports() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [rows, setRows] = useState<Weekly[]>([]);
  const [isPremium] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'custom'>('week');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
    })();
  }, []);

  useEffect(() => {
    if (userId) loadWeekly();
  }, [userId]);

  const loadWeekly = async () => {
    const { data, error } = await supabase
      .from('v_weekly_summary')
      .select('*')
      .eq('user_id', userId)
      .order('week', { ascending: false })
      .limit(12);
    if (error) Alert.alert('Error', error.message);
    else setRows(data ?? []);
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    if (!isPremium) {
      Alert.alert('Premium Feature', 'Export is available in Premium.');
      return;
    }
    Alert.alert('Export', `${format.toUpperCase()} export started`);
  };

  const handleShare = () => {
    if (!isPremium) {
      Alert.alert('Premium Feature', 'Share is available in Premium.');
      return;
    }
    Alert.alert('Share', 'Share report via email/messenger');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.brandContainer}>
            <Text style={styles.brandName}>HealthTrack</Text>
            <View style={styles.brandDot} />
          </View>
          <Text style={styles.headerTitle}>Reports</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Weekly Summary</Text>
            {rows.map((r) => (
              <View key={r.week} style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Week</Text>
                  <Text style={styles.summaryValue}>{new Date(r.week).toDateString()}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Water Intake</Text>
                  <Text style={styles.summaryValue}>{r.water_total_ml ?? 0} ml</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Medicines Taken</Text>
                  <Text style={styles.summaryValue}>{r.meds_taken ?? 0}/{r.meds_expected ?? 0}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Adherence</Text>
                  <Text style={styles.summaryValue}>{r.adherence_pct ?? 0}%</Text>
                </View>
              </View>
            ))}
          </View>

          {!isPremium && (
            <View style={styles.premiumSection}>
              <Text style={styles.premiumTitle}>Unlock Premium Reports</Text>
              <Text style={styles.premiumText}>Monthly/custom reports, CSV/PDF export, share.</Text>
              <TouchableOpacity style={styles.premiumButton}>
                <Text style={styles.premiumButtonText}>Start 7-Day Free Trial</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <BottomNavigation onSignOut={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FF6B7A',
    letterSpacing: -0.5,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B7A',
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  periodSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  periodButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#FF6B7A',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  summarySection: {
    marginBottom: 32,
  },
  summaryCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  chartsSection: {
    marginBottom: 32,
  },
  chartPlaceholder: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    marginBottom: 12,
  },
  chartText: {
    color: '#666666',
    fontSize: 16,
  },
  premiumSection: {
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 8,
  },
  premiumText: {
    fontSize: 14,
    color: '#E65100',
    marginBottom: 16,
    lineHeight: 20,
  },
  premiumButton: {
    backgroundColor: '#FF6B7A',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
  },
  premiumButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  exportSection: {
    marginBottom: 32,
  },
  exportButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  exportButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});