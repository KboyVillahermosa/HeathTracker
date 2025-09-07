import React from 'react'
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useHydration } from '../hooks/useHydration'

export function WaterTracker() {
  const { todayTotal, goal, percentage, loading, logWater } = useHydration()

  const handleQuickLog = async (amount: number) => {
    try {
      await logWater(amount)
    } catch (error) {
      Alert.alert('Error', 'Failed to log water intake')
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Water Intake</Text>
        <Text style={styles.subtitle}>
          {todayTotal}ml of {goal}ml
        </Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${percentage}%` }
            ]} 
          />
        </View>
        <Text style={styles.percentageText}>{Math.round(percentage)}%</Text>
      </View>

      <View style={styles.quickButtons}>
        <TouchableOpacity 
          style={styles.quickButton}
          onPress={() => handleQuickLog(200)}
        >
          <Text style={styles.quickButtonText}>+200ml</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.quickButton}
          onPress={() => handleQuickLog(250)}
        >
          <Text style={styles.quickButtonText}>+250ml</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.quickButton}
          onPress={() => handleQuickLog(300)}
        >
          <Text style={styles.quickButtonText}>+300ml</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B7A',
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B7A',
    minWidth: 40,
  },
  quickButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quickButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  quickButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF6B7A',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666666',
    fontSize: 16,
  },
})
