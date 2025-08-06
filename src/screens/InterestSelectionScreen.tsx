import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../config/supabase';

const INTEREST_OPTIONS = [
  { label: 'Tech & Gadgets', value: 'tech & gadgets', emoji: '📱' },
  { label: 'Fashion & Lifestyle', value: 'fashion & lifestyle', emoji: '👗' },
  { label: 'Shopping', value: 'shopping', emoji: '🛍️' },
  { label: 'Gaming & Entertainment', value: 'gaming & entertainment', emoji: '🎮' },
  { label: 'Food & Beverages', value: 'food & beverages', emoji: '🍔' },
  { label: 'Health & Fitness', value: 'health & fitness', emoji: '🏋️' },
];

export const InterestSelectionScreen = ({ navigation }: any) => {
  const { user, profile, updateProfile } = useAuthStore();
  const [selected, setSelected] = useState<string[]>(profile?.interests || []);

  const toggle = (value: string) => {
    setSelected(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const handleSubmit = async () => {
    if (selected.length === 0) return;

    try {
      if (user && profile) {
        // Update existing profile with new interests
        const { error } = await supabase
          .from('user_profiles')
          .update({ interests: selected })
          .eq('user_id', user.id);

        if (!error) {
          // Update local profile state
          await updateProfile({ ...profile, interests: selected });
          navigation.goBack();
        }
      } else {
        // Create new profile (signup flow)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: newProfile, error } = await supabase
            .from('user_profiles')
            .insert({
              user_id: user.id,
              name: user.email?.split('@')[0] || 'User',
              age: 25,
              gender: 'other',
              location: 'India',
              email: user.email,
              interests: selected,
              points_balance: 0
            })
            .select()
            .single();

          if (!error) {
            useAuthStore.setState({ user, profile: newProfile });
            navigation.replace('Home');
          }
        }
      }
    } catch (error) {
      console.log('Interest update error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {profile && (
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        )}
        <Image 
          source={require('../assets/logobanner.jpeg')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Tell us what you love</Text>
        <Text style={styles.subtitle}>Select your interests to get personalized tasks</Text>
        
        <FlatList
          data={INTEREST_OPTIONS}
          numColumns={2}
          keyExtractor={(item) => item.value}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => {
            const isSelected = selected.includes(item.value);
            return (
              <TouchableOpacity
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => toggle(item.value)}
              >
                <Text style={styles.emoji}>{item.emoji}</Text>
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        <TouchableOpacity
          style={[styles.button, selected.length === 0 && { opacity: 0.5 }]}
          disabled={selected.length === 0}
          onPress={handleSubmit}
        >
          <Text style={styles.buttonText}>{profile ? 'Update Interests' : 'Continue'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
  },
  logo: {
    width: 150,
    height: 75,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  grid: {
    gap: 12,
    alignItems: 'center',
  },
  chip: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 24,
    margin: 8,
    borderWidth: 2,
    borderColor: '#e1e5e9',
    alignItems: 'center',
    minWidth: 120,
  },
  chipSelected: {
    backgroundColor: '#6c5ce7',
    borderColor: '#6c5ce7',
  },
  emoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  chipText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  button: {
    marginTop: 32,
    backgroundColor: '#6c5ce7',
    padding: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 30,
    zIndex: 1,
  },
  backText: {
    fontSize: 16,
    color: '#6c5ce7',
    fontWeight: '600',
  },
});