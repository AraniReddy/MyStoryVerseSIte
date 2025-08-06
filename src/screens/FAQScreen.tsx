import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

export const FAQScreen = ({ navigation }: any) => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>❓ Frequently Asked Questions</Text>
      
      <View style={styles.faqItem}>
        <Text style={styles.question}>1. What is SecretShop?</Text>
        <Text style={styles.answer}>SecretShop is a platform where users can give feedback on product ideas from brands and earn small rewards in return.</Text>
      </View>

      <View style={styles.faqItem}>
        <Text style={styles.question}>2. Can I interact with other users?</Text>
        <Text style={styles.answer}>No, SecretShop is designed to be a private feedback platform. Users cannot view other profiles, send messages, or interact outside of commenting on tasks.</Text>
      </View>

      <View style={styles.faqItem}>
        <Text style={styles.question}>3. How do likes and comments work?</Text>
        <Text style={styles.answer}>You can like tasks you enjoy and leave comments with your thoughts. Brands can see your input to improve their products.</Text>
      </View>

      <View style={styles.faqItem}>
        <Text style={styles.question}>4. What is the Question & Answer feature?</Text>
        <Text style={styles.answer}>Some tasks may include questions instead of links. Simply read and answer them directly in the app to submit your feedback.</Text>
      </View>

      <View style={styles.faqItem}>
        <Text style={styles.question}>5. Is my profile visible to others?</Text>
        <Text style={styles.answer}>No. Your profile is completely private and not visible to any other user.</Text>
      </View>

      <View style={styles.faqItem}>
        <Text style={styles.question}>6. How do I earn rewards?</Text>
        <Text style={styles.answer}>Each completed task (feedback or Q&A) can earn you small rewards, which are added to your wallet once verified.</Text>
      </View>

      <View style={styles.faqItem}>
        <Text style={styles.question}>7. Can I edit or delete my comments?</Text>
        <Text style={styles.answer}>Yes, you can edit or delete your comments within a certain time window after submission.</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', flex: 1 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  faqItem: { marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  question: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  answer: { fontSize: 14, color: '#555', lineHeight: 20 },
});