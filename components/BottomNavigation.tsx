import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  onSignOut: () => void;
};

const BottomNavigation: React.FC<Props> = ({ onSignOut }) => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.tab} onPress={() => router.replace('/screen/home')}>
        <Text style={styles.icon}>🏠</Text>
        <Text style={styles.label}>Home</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.tab} onPress={() => router.replace('/screen/water/water')}>
        <Text style={styles.icon}>💧</Text>
        <Text style={styles.label}>Water</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.tab} onPress={() => router.replace('/screen/medicines/medicine')}>
        <Text style={styles.icon}>💊</Text>
        <Text style={styles.label}>Medicines</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.tab} onPress={() => router.replace('/screen/reports/report')}>
        <Text style={styles.icon}>📊</Text>
        <Text style={styles.label}>Reports</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.tab} onPress={() => router.replace('/screen/profle/profile')}>
        <Text style={styles.icon}>👤</Text>
        <Text style={styles.label}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E5E5E5',
    paddingBottom: 24,
    paddingTop: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tab: {
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 22,
  },
  label: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
});

export default BottomNavigation;
