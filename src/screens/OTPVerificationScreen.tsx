import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { useAuthStore } from '../store/authStore';

export const OTPVerificationScreen = ({ navigation, route }: any) => {
  const { email } = route.params;
  const [otp, setOtp] = useState('');
  const { loading, verifyOtp } = useAuthStore();

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    try {
      await verifyOtp(email, otp);
      navigation.navigate('InterestSelection');
    } catch (error: any) {
      Alert.alert('Verification Failed', error.message);
    }
  };

  const handleResendOTP = () => {
    Alert.alert('OTP Sent', 'A new OTP has been sent to your email');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Image 
          source={require('../assets/logobanner.jpeg')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.description}>
          We've sent a 6-digit verification code to {email}
        </Text>

        <TextInput
          style={styles.otpInput}
          placeholder="Enter 6-digit OTP"
          value={otp}
          onChangeText={setOtp}
          keyboardType="numeric"
          maxLength={6}
          textAlign="center"
        />

        <TouchableOpacity style={styles.verifyButton} onPress={handleVerifyOTP} disabled={loading}>
          <Text style={styles.verifyButtonText}>{loading ? 'Verifying...' : 'Verify OTP'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResendOTP} style={styles.resendButton}>
          <Text style={styles.resendText}>Didn't receive code? Resend OTP</Text>
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
    backgroundColor: '#6c5ce7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  backButton: {
    marginRight: 15,
  },
  backIcon: {
    color: '#fff',
    fontSize: 24,
  },
  logo: {
    width: 150,
    height: 80,
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  otpInput: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#6c5ce7',
    padding: 20,
    marginBottom: 20,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 8,
  },
  verifyButton: {
    backgroundColor: '#6c5ce7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  verifyButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButton: {
    marginTop: 10,
  },
  resendText: {
    color: '#6c5ce7',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});