import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, Platform } from 'react-native';

interface Props {
  children: React.ReactNode;
}

export const NetworkChecker = ({ children }: Props) => {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('https://www.google.com', {
          method: 'HEAD',
          timeout: 5000
        });
        setIsConnected(response.ok);
      } catch (error) {
        setIsConnected(false);
        Alert.alert(
          'No Internet Connection',
          'SecretShop requires internet to work. Please check your connection.',
          [{ text: 'OK' }]
        );
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!isConnected) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No Internet Connection</Text>
        <Text style={styles.message}>
          SecretShop requires an internet connection to work properly.
          Please check your connection and try again.
        </Text>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});