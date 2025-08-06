import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

export const PrivacyPolicyScreen = ({ navigation }: any) => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>SecretShop – Privacy Policy</Text>
      <Text style={styles.subtitle}>Effective Date: August 5, 2025{"\n"}Last Updated: August 5, 2025</Text>
      
      <Text style={styles.paragraph}>
        At SecretShop, your privacy is important to us. This Privacy Policy describes how we collect, use, disclose, and safeguard your information when you use our mobile application.
        {"\n\n"}🔍 <Text style={styles.sectionTitle}>Information We Collect</Text>
        {"\n\n"}Personal Information:
        {"\n"}• Full Name and Email Address
        {"\n"}• Country and Location (for task matching)
        {"\n"}• Profile Picture (optional)
        
        {"\n\n"}🎯 <Text style={styles.sectionTitle}>How We Use Your Information</Text>
        {"\n\n"}• Match you with relevant brand tasks
        {"\n"}• Deliver micro-rewards
        {"\n"}• Improve app features and user experience
        {"\n"}• Communicate updates and support messages
        
        {"\n\n"}🔒 <Text style={styles.sectionTitle}>Data Protection</Text>
        {"\n\n"}• Data securely stored using Supabase (GDPR-compliant)
        {"\n"}• All uploads are encrypted during transfer
        {"\n"}• We do not sell or rent your personal data
        
        {"\n\n"}💰 <Text style={styles.sectionTitle}>Rewards & Payments</Text>
        {"\n\n"}• UPI ID processing for rewards
        {"\n"}• Wallet balance tracking
        {"\n"}• Secure transaction processing
        
        {"\n\n"}📞 <Text style={styles.sectionTitle}>Contact Us</Text>
        {"\n\n"}📧 Email: support@mystoryverse.online
        {"\n"}🌐 Website: https://mystoryverse.online
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', flex: 1 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  paragraph: { fontSize: 16, color: '#555', lineHeight: 22 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20, fontStyle: 'italic' },
  sectionTitle: { fontWeight: 'bold', color: '#333' },
});