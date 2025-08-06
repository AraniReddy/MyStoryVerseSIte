import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export const NotificationSettingsScreen = ({ navigation }: any) => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🔔 Notification Settings</Text>
        
        <View style={styles.messageCard}>
          <Text style={styles.messageIcon}>🚀</Text>
          <Text style={styles.messageTitle}>Coming Soon!</Text>
          <Text style={styles.messageText}>
            We are bringing more notification settings in next update!!!
          </Text>
          <Text style={styles.messageSubtext}>
            Stay tuned for customizable notification preferences, sound settings, and more.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, flex: 1, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 40, color: '#333' },
  messageCard: { 
    backgroundColor: '#fff', 
    padding: 30, 
    borderRadius: 20, 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  messageIcon: { fontSize: 60, marginBottom: 20 },
  messageTitle: { fontSize: 22, fontWeight: 'bold', color: '#6c5ce7', marginBottom: 15 },
  messageText: { fontSize: 16, textAlign: 'center', color: '#333', marginBottom: 10, lineHeight: 24 },
  messageSubtext: { fontSize: 14, textAlign: 'center', color: '#666', lineHeight: 20 },
});