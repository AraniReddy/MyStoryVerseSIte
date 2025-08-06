import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform, Image } from 'react-native';
import DatePicker from 'react-native-date-picker';
import { useAuthStore } from '../store/authStore';

export const SignUpScreen = ({ navigation }: any) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [gender, setGender] = useState('');
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [country, setCountry] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState(new Date(2000, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const countries = [
    { name: 'India', code: 'IN' },
    { name: 'United States', code: 'US' },
    { name: 'United Kingdom', code: 'GB' },
    { name: 'Nigeria', code: 'NG' },
    { name: 'Indonesia', code: 'ID' },
  ];

  const { signUp, loading } = useAuthStore();

  const handleSignUp = async () => {
    if (!name || !email || !password || !confirmPassword || !gender || !country) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    const age = new Date().getFullYear() - dateOfBirth.getFullYear();

    try {
      const dateOfBirthString = dateOfBirth.toISOString().split('T')[0];
      await signUp(email, name, age, gender.toLowerCase(), country, dateOfBirthString, password);
      navigation.navigate('OTPVerification', { email, name, age, gender: gender.toLowerCase(), location: country, dateOfBirth: dateOfBirthString, password });
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image 
          source={require('../assets/logobanner.jpeg')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <ScrollView style={styles.formScroll} contentContainerStyle={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#000"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor="#000"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#000"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#000"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateText}>
            {dateOfBirth.toLocaleDateString()}
          </Text>
        </TouchableOpacity>
        
        <DatePicker
          modal
          open={showDatePicker}
          date={dateOfBirth}
          mode="date"
          maximumDate={new Date()}
          onConfirm={(date) => {
            setShowDatePicker(false);
            setDateOfBirth(date);
          }}
          onCancel={() => {
            setShowDatePicker(false);
          }}
        />

        
        <View style={styles.dropdownContainer}>
          <TouchableOpacity style={styles.dropdown} onPress={() => setShowGenderDropdown(!showGenderDropdown)}>
            <Text style={styles.dropdownText}>{gender || 'Select Gender'}</Text>
            <Text style={styles.dropdownArrow}>{showGenderDropdown ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          
          {showGenderDropdown && (
            <View style={styles.dropdownOptions}>
              <TouchableOpacity style={styles.dropdownOption} onPress={() => { setGender('Male'); setShowGenderDropdown(false); }}>
                <Text style={styles.dropdownOptionText}>Male</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownOption} onPress={() => { setGender('Female'); setShowGenderDropdown(false); }}>
                <Text style={styles.dropdownOptionText}>Female</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownOption} onPress={() => { setGender('Other'); setShowGenderDropdown(false); }}>
                <Text style={styles.dropdownOptionText}>Other</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.dropdownContainer}>
          <TouchableOpacity style={styles.dropdown} onPress={() => setShowCountryDropdown(!showCountryDropdown)}>
            <Text style={styles.dropdownText}>{country || 'Select Country'}</Text>
            <Text style={styles.dropdownArrow}>{showCountryDropdown ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          
          {showCountryDropdown && (
            <View style={styles.dropdownOptions}>
              {countries.map((countryItem) => (
                <TouchableOpacity 
                  key={`country-${countryItem.code}`} 
                  style={styles.dropdownOption} 
                  onPress={() => { setCountry(countryItem.name); setShowCountryDropdown(false); }}
                >
                  <Text style={styles.dropdownOptionText}>{countryItem.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        

        
        <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp} disabled={loading}>
          <Text style={styles.signUpButtonText}>{loading ? 'Creating Account...' : 'Create Account'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>Already have an account? Sign in</Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
  },
  logo: {
    width: 200,
    height: 100,
  },
  formScroll: {
    flex: 1,
  },
  form: {
    padding: 20,
    justifyContent: 'center',
    flexGrow: 1,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    fontSize: 16,
    color: '#000',
  },
  signUpButton: {
    backgroundColor: '#6c5ce7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  signUpButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  linkText: {
    textAlign: 'center',
    color: '#6c5ce7',
    fontSize: 16,
    marginBottom: 20,
  },
  dropdownContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
  dropdownOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    zIndex: 1000,
  },
  dropdownOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#333',
  },
  dateInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
});