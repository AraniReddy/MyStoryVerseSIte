import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../config/supabase';
import { getCurrencyByCountry, convertCurrency, formatCurrency } from '../utils/currency';

export const WalletScreen = ({ navigation }: any) => {
  const { profile, user } = useAuthStore();
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [userCurrency, setUserCurrency] = useState('INR');
  const [displayBalance, setDisplayBalance] = useState(0);

  useEffect(() => {
    if (profile?.country) {
      setUserCurrency(getCurrencyByCountry(profile.country));
    }
    fetchTransactions();
    convertBalance();
  }, [profile]);

  const fetchTransactions = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select(`
          *,
          brand_tasks(brand_name, question)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (data) {
        const formattedTransactions = await Promise.all(
          data.map(async (transaction) => {
            const convertedAmount = await convertCurrency(
              transaction.amount, 
              'INR', 
              userCurrency
            );
            
            return {
              id: transaction.id,
              type: transaction.amount > 0 ? 'earned' : 'withdrawal',
              amount: convertedAmount,
              description: transaction.brand_tasks?.brand_name 
                ? `${transaction.brand_tasks.brand_name} feedback`
                : transaction.payout_method === 'UPI' ? 'UPI withdrawal' : 'Transaction',
              date: new Date(transaction.created_at).toLocaleDateString(),
              status: transaction.status
            };
          })
        );
        setTransactions(formattedTransactions);
      }
    } catch (error) {
      console.log('Fetch transactions error:', error);
    }
  };

  const convertBalance = async () => {
    if (profile?.points_balance) {
      const converted = await convertCurrency(profile.points_balance, 'INR', userCurrency);
      setDisplayBalance(converted);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    await convertBalance();
    setRefreshing(false);
  };

  const renderTransaction = ({ item }: any) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <View style={[styles.transactionIcon, item.type === 'earned' ? styles.earnedIcon : styles.withdrawalIcon]}>
          <Text style={styles.iconText}>{item.type === 'earned' ? '💰' : '💸'}</Text>
        </View>
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionDescription}>{item.description}</Text>
          <Text style={styles.transactionDate}>{item.date}</Text>
        </View>
      </View>
      <View style={styles.transactionRight}>
        <Text style={[styles.transactionAmount, item.type === 'earned' ? styles.earnedAmount : styles.withdrawalAmount]}>
          {item.type === 'earned' ? '+' : ''}{formatCurrency(Math.abs(item.amount), userCurrency)}
        </Text>
        <View style={[styles.statusBadge, item.status === 'paid' ? styles.paidBadge : styles.pendingBadge]}>
          <Text style={[styles.statusText, item.status === 'paid' ? styles.paidText : styles.pendingText]}>
            {item.status}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>💳 Wallet</Text>
        </View>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(displayBalance, userCurrency)}</Text>
          <TouchableOpacity style={styles.withdrawButton}>
            <Text style={styles.withdrawButtonText}>Withdraw</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.transactionsSection}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.transactionsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#6c5ce7',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  backIcon: {
    color: '#fff',
    fontSize: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  balanceCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#ddd6fe',
    marginBottom: 5,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  withdrawButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 20,
  },
  withdrawButtonText: {
    color: '#6c5ce7',
    fontSize: 16,
    fontWeight: '600',
  },
  transactionsSection: {
    flex: 1,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  transactionsList: {
    paddingBottom: 20,
  },
  transactionItem: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  earnedIcon: {
    backgroundColor: '#e8f5e8',
  },
  withdrawalIcon: {
    backgroundColor: '#ffeaea',
  },
  iconText: {
    fontSize: 18,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  earnedAmount: {
    color: '#28a745',
  },
  withdrawalAmount: {
    color: '#dc3545',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  paidBadge: {
    backgroundColor: '#e8f5e8',
  },
  pendingBadge: {
    backgroundColor: '#fff3cd',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  paidText: {
    color: '#28a745',
  },
  pendingText: {
    color: '#856404',
  },
});