import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import BottomNavigation from '../../../components/BottomNavigation';
import { supabase } from '../../../lib/supabase';

export default function Profile() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/(auth)/login');
          }
        }
      ]
    );
  };

  const handleEditProfile = () => {
    // TODO: Navigate to edit profile screen
    Alert.alert('Edit Profile', 'Edit profile functionality coming soon!');
  };

  const handleSettings = () => {
    // TODO: Navigate to settings screen
    Alert.alert('Settings', 'Settings functionality coming soon!');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.brandContainer}>
            <Text style={styles.brandName}>HealthTrack</Text>
            <View style={styles.brandDot} />
          </View>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
      </View>
      
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.profileSection}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileText}>
                {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <Text style={styles.profileEmail}>
              {loading ? 'Loading...' : userEmail || 'No email available'}
            </Text>
            <Text style={styles.profileSubtitle}>Health Tracker User</Text>
          </View>
          
          <View style={styles.menuSection}>
            <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
              <View style={styles.menuIcon}>
                <Text style={styles.menuEmoji}>✏️</Text>
              </View>
              <Text style={styles.menuText}>Edit Profile</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={handleSettings}>
              <View style={styles.menuIcon}>
                <Text style={styles.menuEmoji}>⚙️</Text>
              </View>
              <Text style={styles.menuText}>Settings</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIcon}>
                <Text style={styles.menuEmoji}>📊</Text>
              </View>
              <Text style={styles.menuText}>Health Statistics</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuIcon}>
                <Text style={styles.menuEmoji}>🔔</Text>
              </View>
              <Text style={styles.menuText}>Notifications</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.signOutSection}>
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
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
  profileSection: {
    alignItems: 'center',
    marginBottom: 40,
    paddingVertical: 20,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B7A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  profileEmail: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  profileSubtitle: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '400',
  },
  menuSection: {
    marginBottom: 40,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuEmoji: {
    fontSize: 18,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  menuArrow: {
    fontSize: 20,
    color: '#CCCCCC',
    fontWeight: '300',
  },
  signOutSection: {
    marginBottom: 32,
  },
  signOutButton: {
    backgroundColor: '#FF6B7A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
