import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BottomNavigation from '../../../components/BottomNavigation';
import { supabase } from '../../../lib/supabase';

export default function WaterTracking() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [goal, setGoal] = useState<number>(2000);
  const [todayTotal, setTodayTotal] = useState<number>(0);
  const [remindersCount, setRemindersCount] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);

  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
    })();
  }, []);

  useEffect(() => {
    if (userId) loadAll();
  }, [userId]);

  const loadAll = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadGoal(), loadTodayTotal(), loadReminders(), loadStreak()]);
    } finally {
      setRefreshing(false);
    }
  };

  const loadGoal = async () => {
    const { data, error } = await supabase
      .from('water_goals')
      .select('daily_goal_ml')
      .eq('user_id', userId)
      .single();
    if (!error && data?.daily_goal_ml) setGoal(data.daily_goal_ml);
  };

  const loadTodayTotal = async () => {
    const { data, error } = await supabase
      .from('v_water_daily')
      .select('total_ml')
      .eq('user_id', userId)
      .gte('day', todayISO)
      .lte('day', todayISO)
      .maybeSingle();
    if (!error) setTodayTotal(data?.total_ml ?? 0);
  };

  const loadReminders = async () => {
    const { count } = await supabase
      .from('water_reminders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    setRemindersCount(count ?? 0);
  };

  const loadStreak = async () => {
    // naive streak: count of consecutive days up to today where total >= goal
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const { data } = await supabase
      .from('v_water_daily')
      .select('day,total_ml')
      .eq('user_id', userId)
      .gte('day', since.toISOString().slice(0, 10))
      .order('day', { ascending: false });
    let s = 0;
    let day = new Date(todayISO + 'T00:00:00Z');
    for (const row of data ?? []) {
      const rd = new Date(row.day);
      if (rd.toDateString() !== day.toDateString()) break;
      if ((row.total_ml ?? 0) >= goal) {
        s += 1;
        day.setDate(day.getDate() - 1);
      } else break;
    }
    setStreak(s);
  };

  const quickLog = async (amount: number) => {
    if (!userId) return;
    const { error } = await supabase.from('water_logs').insert({
      user_id: userId,
      amount_ml: amount,
      source: `quick-${amount}`,
    });
    if (error) Alert.alert('Error', error.message);
    await loadTodayTotal();
    await loadStreak();
  };

  const setDefaultGoalIfMissing = async () => {
    if (!userId) return;
    const { data } = await supabase.from('water_goals').select('id').eq('user_id', userId).maybeSingle();
    if (!data) {
      await supabase.from('water_goals').insert({ user_id: userId, daily_goal_ml: goal, auto_goal: false });
    }
  };

  useEffect(() => {
    if (userId) setDefaultGoalIfMissing();
  }, [userId]);

  const remaining = Math.max(goal - todayTotal, 0);
  const pct = Math.min((todayTotal / goal) * 100, 100);

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

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadAll} />}
      >
        <View style={styles.content}>
          <View style={styles.progressSection}>
            <Text style={styles.sectionTitle}>Todays Goal</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${pct}%` }]} />
              </View>
              <Text style={styles.progressText}>{todayTotal}ml / {goal}ml</Text>
            </View>
            <Text style={styles.remainingText}>{remaining}ml remaining</Text>
          </View>

          <View style={styles.quickLogSection}>
            <Text style={styles.sectionTitle}>Quick Log</Text>
            <View style={styles.quickLogButtons}>
              {[200, 250, 300].map(a => (
                <TouchableOpacity key={a} style={styles.quickLogButton} onPress={() => quickLog(a)}>
                  <Text style={styles.quickLogText}>+{a}ml</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.statsSection}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{streak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{remindersCount}</Text>
              <Text style={styles.statLabel}>Reminders</Text>
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
