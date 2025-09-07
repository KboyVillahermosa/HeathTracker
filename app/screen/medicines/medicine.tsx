import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import BottomNavigation from '../../../components/BottomNavigation';
import { supabase } from '../../../lib/supabase';

interface Medicine {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  nextDose: string;
  taken: boolean;
}

export default function MedicineReminders() {
  const router = useRouter();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [maxMedicines] = useState(3); // Basic: 3, Premium: unlimited

  const sampleMedicines: Medicine[] = [
    {
      id: '1',
      name: 'Vitamin D',
      dosage: '1000 IU',
      frequency: 'Once daily',
      nextDose: '8:00 AM',
      taken: false,
    },
    {
      id: '2',
      name: 'Omega-3',
      dosage: '500mg',
      frequency: 'Twice daily',
      nextDose: '2:00 PM',
      taken: true,
    },
  ];

  useEffect(() => {
    setMedicines(sampleMedicines);
  }, []);

  const handleMarkTaken = (id: string) => {
    setMedicines(prev => 
      prev.map(med => 
        med.id === id ? { ...med, taken: !med.taken } : med
      )
    );
  };

  const handleSnooze = (id: string) => {
    Alert.alert('Snooze', 'Medicine reminder snoozed for 10 minutes');
  };

  const canAddMedicine = () => {
    return isPremium || medicines.length < maxMedicines;
  };

  const handleAddMedicine = () => {
    if (!canAddMedicine()) {
      Alert.alert(
        'Limit Reached',
        'Basic plan allows up to 3 medicines. Upgrade to Premium for unlimited medicines.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => {} }
        ]
      );
      return;
    }
    Alert.alert('Add Medicine', 'Add medicine functionality coming soon!');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.brandContainer}>
            <Text style={styles.brandName}>HealthTrack</Text>
            <View style={styles.brandDot} />
          </View>
          <Text style={styles.headerTitle}>Medicines</Text>
        </View>
      </View>
      
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Next Dose Banner */}
          <View style={styles.nextDoseBanner}>
            <Text style={styles.bannerTitle}>Next Dose</Text>
            <Text style={styles.bannerTime}>8:00 AM - Vitamin D</Text>
            <Text style={styles.bannerDosage}>1000 IU</Text>
          </View>

          {/* Medicine List */}
          <View style={styles.medicinesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Todays Medicines</Text>
              <TouchableOpacity 
                style={[styles.addButton, !canAddMedicine() && styles.addButtonDisabled]}
                onPress={handleAddMedicine}
              >
                <Text style={[styles.addButtonText, !canAddMedicine() && styles.addButtonTextDisabled]}>
                  + Add
                </Text>
              </TouchableOpacity>
            </View>

            {medicines.map((medicine) => (
              <View key={medicine.id} style={styles.medicineCard}>
                <View style={styles.medicineInfo}>
                  <Text style={styles.medicineName}>{medicine.name}</Text>
                  <Text style={styles.medicineDosage}>{medicine.dosage}</Text>
                  <Text style={styles.medicineFrequency}>{medicine.frequency}</Text>
                  <Text style={styles.medicineTime}>Next: {medicine.nextDose}</Text>
                </View>
                <View style={styles.medicineActions}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      medicine.taken ? styles.takenButton : styles.notTakenButton
                    ]}
                    onPress={() => handleMarkTaken(medicine.id)}
                  >
                    <Text style={[
                      styles.actionButtonText,
                      medicine.taken ? styles.takenButtonText : styles.notTakenButtonText
                    ]}>
                      {medicine.taken ? 'Taken' : 'Mark Taken'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.snoozeButton}
                    onPress={() => handleSnooze(medicine.id)}
                  >
                    <Text style={styles.snoozeButtonText}>Snooze 10m</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* Premium Features */}
          {!isPremium && (
            <View style={styles.premiumSection}>
              <Text style={styles.premiumTitle}>Unlock Premium Features</Text>
              <Text style={styles.premiumText}>
                • Unlimited medicines{'\n'}
                • Advanced schedules{'\n'}
                • Refill reminders{'\n'}
                • Custom tones & analytics
              </Text>
              <TouchableOpacity style={styles.premiumButton}>
                <Text style={styles.premiumButtonText}>Start 7-Day Free Trial</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Adherence Stats */}
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Adherence</Text>
            <View style={styles.adherenceCard}>
              <Text style={styles.adherencePercentage}>85%</Text>
              <Text style={styles.adherenceLabel}>This Week</Text>
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
  nextDoseBanner: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 4,
  },
  bannerTime: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1976D2',
    marginBottom: 2,
  },
  bannerDosage: {
    fontSize: 14,
    color: '#1976D2',
  },
  medicinesSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  addButton: {
    backgroundColor: '#FF6B7A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  addButtonTextDisabled: {
    color: '#666666',
  },
  medicineCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  medicineInfo: {
    marginBottom: 12,
  },
  medicineName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  medicineDosage: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  medicineFrequency: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  medicineTime: {
    fontSize: 14,
    color: '#FF6B7A',
    fontWeight: '500',
  },
  medicineActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  takenButton: {
    backgroundColor: '#4CAF50',
  },
  notTakenButton: {
    backgroundColor: '#FF6B7A',
  },
  actionButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  takenButtonText: {
    color: '#FFFFFF',
  },
  notTakenButtonText: {
    color: '#FFFFFF',
  },
  snoozeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
  },
  snoozeButtonText: {
    color: '#666666',
    fontWeight: '500',
    fontSize: 14,
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
  statsSection: {
    marginBottom: 32,
  },
  adherenceCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  adherencePercentage: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 4,
  },
  adherenceLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
});