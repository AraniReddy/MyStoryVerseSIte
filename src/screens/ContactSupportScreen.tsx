import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';

export const ContactSupportScreen = ({ navigation }: any) => {
  const handleEmailPress = () => {
    Linking.openURL('mailto:support@mystoryverse.online');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📞 Contact Support</Text>
      
      <Text style={styles.subtitle}>Having trouble or need help?</Text>
      <Text style={styles.description}>
        If you're facing issues with the app, tasks, or rewards, we're here to help!
        {"\n\n"}You can contact us in the following ways:
      </Text>

      <View style={styles.contactCard}>
        <Text style={styles.contactTitle}>Email:</Text>
        <TouchableOpacity style={styles.emailButton} onPress={handleEmailPress}>
          <Text style={styles.emailText}>✉️ support@mystoryverse.online</Text>
        </TouchableOpacity>
        <Text style={styles.emailNote}>(Recommended for account or reward issues)</Text>
      </View>

      <View style={styles.contactCard}>
        <Text style={styles.contactTitle}>In-App Support (coming soon):</Text>
        <Text style={styles.description}>Submit a request or report a bug directly from the app.</Text>
      </View>

      <View style={styles.responseCard}>
        <Text style={styles.responseTitle}>Response Time:</Text>
        <Text style={styles.responseText}>We usually respond within 24–48 hours on working days.</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', flex: 1 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  subtitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 10 },
  description: { fontSize: 16, color: '#555', lineHeight: 22, marginBottom: 20 },
  contactCard: { backgroundColor: '#f8f9fa', padding: 15, borderRadius: 10, marginBottom: 15 },
  contactTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  emailButton: { backgroundColor: '#6c5ce7', padding: 12, borderRadius: 8, marginBottom: 8 },
  emailText: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  emailNote: { fontSize: 14, color: '#666', fontStyle: 'italic' },
  responseCard: { backgroundColor: '#e8f5e8', padding: 15, borderRadius: 10 },
  responseTitle: { fontSize: 16, fontWeight: 'bold', color: '#28a745', marginBottom: 8 },
  responseText: { fontSize: 14, color: '#555' },
});