import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../contexts/AuthContext";

export default function Index() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (session) {
        router.replace("/screen/home");
      } else {
        router.replace("/(auth)/login");
      }
    }
  }, [session, loading]);

  return (
    <View style={styles.container}>
      <View style={styles.brandContainer}>
        <Text style={styles.brandName}>HealthTrack</Text>
        <View style={styles.brandDot} />
      </View>
      <ActivityIndicator size="large" color="#FF6B7A" style={styles.loader} />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 40,
  },
  brandName: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FF6B7A",
    letterSpacing: -0.5,
  },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF6B7A",
    marginLeft: 6,
  },
  loader: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#666666",
    fontWeight: "400",
  },
});
