import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

export const TermsAndConditionsScreen = ({ navigation }: any) => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>SecretShop – Terms & Conditions</Text>
      <Text style={styles.subtitle}>Effective Date: August 5, 2025{"\n"}Last Updated: August 5, 2025</Text>
      
      <Text style={styles.paragraph}>
        Welcome to SecretShop! By using our mobile application, you agree to be bound by the following Terms & Conditions.
        
        {"\n\n"}✅ <Text style={styles.sectionTitle}>Acceptance of Terms</Text>
        {"\n\n"}By downloading or using SecretShop, you agree to:
        {"\n"}• These Terms & Conditions
        {"\n"}• Our Privacy Policy
        {"\n"}If you do not agree, please uninstall the app.
        
        {"\n\n"}📱 <Text style={styles.sectionTitle}>Description of Service</Text>
        {"\n\n"}SecretShop is a platform where users can:
        {"\n"}• Participate in short feedback tasks for brands
        {"\n"}• Submit responses in text, audio, or video form
        {"\n"}• Earn micro-rewards (digital points, vouchers)
        
        {"\n\n"}👤 <Text style={styles.sectionTitle}>User Accounts</Text>
        {"\n\n"}To use SecretShop, you must:
        {"\n"}• Be at least 13 years of age
        {"\n"}• Provide accurate information during signup
        {"\n"}• Keep your account credentials confidential
        
        {"\n\n"}💰 <Text style={styles.sectionTitle}>Rewards and Payments</Text>
        {"\n\n"}SecretShop reserves the right to:
        {"\n"}• Review all submissions before approving rewards
        {"\n"}• Deny rewards for low-quality or inappropriate content
        {"\n"}• Modify the reward system at any time
        
        {"\n\n"}🔒 <Text style={styles.sectionTitle}>User Conduct</Text>
        {"\n\n"}You agree not to:
        {"\n"}• Misuse the app or attempt to reverse-engineer it
        {"\n"}• Submit fraudulent responses or create multiple accounts
        {"\n"}• Attempt to manipulate rewards
        {"\n"}Violation may result in suspension or permanent ban.
        
        {"\n\n"}⚖️ <Text style={styles.sectionTitle}>Governing Law</Text>
        {"\n\n"}These Terms are governed by the laws of India, subject to the jurisdiction of courts in Hyderabad, Telangana.
        
        {"\n\n"}✉️ <Text style={styles.sectionTitle}>Contact Us</Text>
        {"\n\n"}📧 Email: support@mystoryverse.online
        {"\n"}🌐 Website: https://mystoryverse.online
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', flex: 1 },
  header: { marginBottom: 20 },
  backButton: { fontSize: 16, color: '#6c5ce7' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  paragraph: { fontSize: 16, color: '#555', lineHeight: 22 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20, fontStyle: 'italic' },
  sectionTitle: { fontWeight: 'bold', color: '#333' },
});