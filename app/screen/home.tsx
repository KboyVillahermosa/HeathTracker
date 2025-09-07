import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BottomNavigation from '../../components/BottomNavigation';
import { supabase } from '../../lib/supabase';

export default function Home() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [waterConsumed, setWaterConsumed] = useState(1200);
  const [waterGoal, setWaterGoal] = useState(2000);
  const [medicinesTaken, setMedicinesTaken] = useState(2);
  const [medicinesTotal, setMedicinesTotal] = useState(3);
  const [streak, setStreak] = useState(7);

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUserEmail(user?.email || null);
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  const getWaterProgress = () => {
    return Math.min((waterConsumed / waterGoal) * 100, 100);
  };

  const getAdherenceRate = () => {
    return Math.round((medicinesTaken / medicinesTotal) * 100);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.brandContainer}>
            <Text style={styles.brandName}>HealthTrack</Text>
            <View style={styles.brandDot} />
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <View style={styles.profileIcon}>
              <Text style={styles.profileText}>
                {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Welcome back!</Text>
            {loading ? (
              <Text style={styles.welcomeSubtitle}>Loading your profile...</Text>
            ) : (
              <Text style={styles.welcomeSubtitle}>
                {userEmail ? `${userEmail}` : 'Ready to track your health?'}
              </Text>
            )}
          </View>
          
          {/* Water Tracking Card */}
          <View style={styles.featureCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>💧 Water Tracking</Text>
              <TouchableOpacity onPress={() => router.push('/screen/water/water')}>
                <Text style={styles.cardAction}>View Details</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${getWaterProgress()}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {waterConsumed}ml / {waterGoal}ml
              </Text>
            </View>
            <Text style={styles.cardSubtext}>
              {waterGoal - waterConsumed}ml remaining today
            </Text>
          </View>

          {/* Medicine Reminders Card */}
          <View style={styles.featureCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>💊 Medicine Reminders</Text>
              <TouchableOpacity onPress={() => router.push('/screen/medicines/medicine')}>
                <Text style={styles.cardAction}>View Details</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.cardValue}>
              {medicinesTaken}/{medicinesTotal} medicines taken
            </Text>
            <Text style={styles.cardSubtext}>
              {getAdherenceRate()}% adherence rate
            </Text>
          </View>

          {/* Stats Overview */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{streak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{getAdherenceRate()}%</Text>
              <Text style={styles.statLabel}>Adherence</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{isPremium ? '∞' : '3'}</Text>
              <Text style={styles.statLabel}>Medicines</Text>
            </View>
          </View>
          
          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/screen/water/water')}  
            >
              <View style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>💧</Text>
              </View>
              <Text style={styles.actionText}>Log Water</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/screen/medicines/medicine')}
            >
              <View style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>💊</Text>
              </View>
              <Text style={styles.actionText}>Mark Medicine</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/screen/reports/report')}
            >
              <View style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>📊</Text>
              </View>
              <Text style={styles.actionText}>View Reports</Text>
            </TouchableOpacity>
          </View>

          {/* Premium Upgrade */}
          {!isPremium && (
            <View style={styles.premiumCard}>
              <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
              <Text style={styles.premiumSubtitle}>Unlock unlimited features</Text>
              <Text style={styles.premiumFeatures}>
                • Unlimited medicines & reminders{'\n'}
                • Advanced analytics & export{'\n'}
                • Cloud sync & backup{'\n'}
                • 7-day free trial
              </Text>
              <TouchableOpacity style={styles.premiumButton}>
                <Text style={styles.premiumButtonText}>Start Free Trial</Text>
              </TouchableOpacity>
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
  profileButton: {
    padding: 4,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B7A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '400',
  },
  featureCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  cardAction: {
    fontSize: 14,
    color: '#FF6B7A',
    fontWeight: '500',
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  cardValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  cardSubtext: {
    fontSize: 14,
    color: '#666666',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF6B7A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  quickActions: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionEmoji: {
    fontSize: 18,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  premiumCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 4,
  },
  premiumSubtitle: {
    fontSize: 14,
    color: '#E65100',
    marginBottom: 12,
  },
  premiumFeatures: {
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
});
  