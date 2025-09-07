import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import BottomNavigation from '../../../components/BottomNavigation';
import { supabase } from '../../../lib/supabase';

export default function WaterTracking() {
  const router = useRouter();
  const [waterGoal, setWaterGoal] = useState(2000); // ml
  const [waterConsumed, setWaterConsumed] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [reminders, setReminders] = useState(6); // Basic: 6, Premium: unlimited
  const [streak, setStreak] = useState(0);

  const quickLogAmounts = [200, 250, 300];

  const handleQuickLog = (amount: number) => {
    setWaterConsumed(prev => prev + amount);
  };

  const handleReset = () => {
    setWaterConsumed(0);
  };

  const getProgressPercentage = () => {
    return Math.min((waterConsumed / waterGoal) * 100, 100);
  };

  const getRemainingWater = () => {
    return Math.max(waterGoal - waterConsumed, 0);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.brandContainer}>
            <Text style={styles.brandName}>HealthTrack</Text>
            <View style={styles.brandDot} />
          </View>
          <Text style={styles.headerTitle}>Water Tracking</Text>
        </View>
      </View>
      
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Water Goal Progress */}
          <View style={styles.progressSection}>
            <Text style={styles.sectionTitle}>Todays Goal</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${getProgressPercentage()}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {waterConsumed}ml / {waterGoal}ml
              </Text>
            </View>
            <Text style={styles.remainingText}>
              {getRemainingWater()}ml remaining
            </Text>
          </View>

          {/* Quick Log Buttons */}
          <View style={styles.quickLogSection}>
            <Text style={styles.sectionTitle}>Quick Log</Text>
            <View style={styles.quickLogButtons}>
              {quickLogAmounts.map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={styles.quickLogButton}
                  onPress={() => handleQuickLog(amount)}
                >
                  <Text style={styles.quickLogText}>+{amount}ml</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsSection}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{streak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{reminders}</Text>
              <Text style={styles.statLabel}>Reminders</Text>
            </View>
          </View>

          {/* Premium Features */}
          {!isPremium && (
            <View style={styles.premiumSection}>
              <Text style={styles.premiumTitle}>Unlock Premium Features</Text>
              <Text style={styles.premiumText}>
                • Unlimited reminders{'\n'}
                • Smart goal adjustment{'\n'}
                • Monthly charts & insights{'\n'}
                • CSV/PDF export
              </Text>
              <TouchableOpacity style={styles.premiumButton}>
                <Text style={styles.premiumButtonText}>Start 7-Day Free Trial</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* History */}
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>7-Day History</Text>
            <View style={styles.historyPlaceholder}>
              <Text style={styles.historyText}>History chart will appear here</Text>
            </View>
          </View>
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
  progressSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 20,
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 10,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  remainingText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  quickLogSection: {
    marginBottom: 32,
  },
  quickLogButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickLogButton: {
    backgroundColor: '#FF6B7A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  quickLogText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  statsSection: {
    flexDirection: 'row',
    marginBottom: 32,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FF6B7A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
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
  historySection: {
    marginBottom: 32,
  },
  historyPlaceholder: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
  },
  historyText: {
    color: '#666666',
    fontSize: 16,
  },
});
