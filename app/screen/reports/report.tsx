import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BottomNavigation from '../../../components/BottomNavigation';
import { supabase } from '../../../lib/supabase';

export default function Reports() {
  const router = useRouter();
  const [isPremium, setIsPremium] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  const handleExport = (format: 'csv' | 'pdf') => {
    if (!isPremium) {
      Alert.alert(
        'Premium Feature',
        'Export functionality is available in Premium plan only.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => {} }
        ]
      );
      return;
    }
    Alert.alert('Export', `${format.toUpperCase()} export started`);
  };

  const handleShare = () => {
    if (!isPremium) {
      Alert.alert(
        'Premium Feature',
        'Share functionality is available in Premium plan only.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => {} }
        ]
      );
      return;
    }
    Alert.alert('Share', 'Share report via email/messenger');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
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
          {/* Period Selection */}
          <View style={styles.periodSection}>
            <Text style={styles.sectionTitle}>Report Period</Text>
            <View style={styles.periodButtons}>
              {['week', 'month', 'custom'].map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.periodButton,
                    selectedPeriod === period && styles.periodButtonActive
                  ]}
                  onPress={() => setSelectedPeriod(period)}
                >
                  <Text style={[
                    styles.periodButtonText,
                    selectedPeriod === period && styles.periodButtonTextActive
                  ]}>
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Weekly Summary */}
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Weekly Summary</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Water Intake</Text>
                <Text style={styles.summaryValue}>12.5L</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Medicines Taken</Text>
                <Text style={styles.summaryValue}>18/21</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Adherence Rate</Text>
                <Text style={styles.summaryValue}>85.7%</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Streak</Text>
                <Text style={styles.summaryValue}>7 days</Text>
              </View>
            </View>
          </View>

          {/* Charts Placeholder */}
          <View style={styles.chartsSection}>
            <Text style={styles.sectionTitle}>Charts & Insights</Text>
            <View style={styles.chartPlaceholder}>
              <Text style={styles.chartText}>Water intake chart</Text>
            </View>
            <View style={styles.chartPlaceholder}>
              <Text style={styles.chartText}>Medicine adherence chart</Text>
            </View>
          </View>

          {/* Premium Features */}
          {!isPremium && (
            <View style={styles.premiumSection}>
              <Text style={styles.premiumTitle}>Unlock Premium Reports</Text>
              <Text style={styles.premiumText}>
                • Monthly & custom-range reports{'\n'}
                • CSV/PDF export{'\n'}
                • Share via email/messenger{'\n'}
                • Advanced analytics
              </Text>
              <TouchableOpacity style={styles.premiumButton}>
                <Text style={styles.premiumButtonText}>Start 7-Day Free Trial</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Export & Share */}
          {isPremium && (
            <View style={styles.exportSection}>
              <Text style={styles.sectionTitle}>Export & Share</Text>
              <View style={styles.exportButtons}>
                <TouchableOpacity 
                  style={styles.exportButton}
                  onPress={() => handleExport('csv')}
                >
                  <Text style={styles.exportButtonText}>Export CSV</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.exportButton}
                  onPress={() => handleExport('pdf')}
                >
                  <Text style={styles.exportButtonText}>Export PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.shareButton}
                  onPress={handleShare}
                >
                  <Text style={styles.shareButtonText}>Share Report</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
      
      <BottomNavigation onSignOut={handleSignOut} />
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