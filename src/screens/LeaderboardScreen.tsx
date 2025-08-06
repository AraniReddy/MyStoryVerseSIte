import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

export const LeaderboardScreen = () => {
  const leaderboardData = [
    { id: '1', name: 'Arjun Kumar', points: 2450, rank: 1 },
    { id: '2', name: 'Sneha Patel', points: 2180, rank: 2 },
    { id: '3', name: 'Rahul Singh', points: 1950, rank: 3 },
    { id: '4', name: 'Priya Sharma', points: 1720, rank: 4 },
    { id: '5', name: 'Dev User', points: 1500, rank: 5 },
    { id: '6', name: 'Amit Gupta', points: 1350, rank: 6 },
    { id: '7', name: 'Kavya Reddy', points: 1200, rank: 7 },
    { id: '8', name: 'Rohit Jain', points: 1050, rank: 8 },
  ];

  const renderLeaderboardItem = ({ item }: any) => (
    <View style={styles.leaderboardItem}>
      <View style={styles.rankSection}>
        <View style={[styles.rankBadge, item.rank <= 3 && styles.topRankBadge]}>
          <Text style={[styles.rankText, item.rank <= 3 && styles.topRankText]}>
            {item.rank}
          </Text>
        </View>
      </View>
      
      <View style={styles.profileSection}>
        <View style={styles.profilePic}>
          <Text style={styles.profileInitial}>{item.name.charAt(0)}</Text>
        </View>
        <Text style={styles.userName}>{item.name}</Text>
      </View>
      
      <View style={styles.pointsSection}>
        <Text style={styles.points}>₹{item.points}</Text>
        <Text style={styles.pointsLabel}>earned</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏆 Leaderboard</Text>
        <Text style={styles.subtitle}>Top earners this month</Text>
      </View>

      <FlatList
        data={leaderboardData}
        renderItem={renderLeaderboardItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
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
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#ddd6fe',
  },
  listContainer: {
    padding: 15,
  },
  leaderboardItem: {
    backgroundColor: '#fff',
    flexDirection: 'row',
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
  rankSection: {
    marginRight: 15,
  },
  rankBadge: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topRankBadge: {
    backgroundColor: '#ffd700',
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  topRankText: {
    color: '#fff',
  },
  profileSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePic: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#6c5ce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileInitial: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  pointsSection: {
    alignItems: 'flex-end',
  },
  points: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
  },
  pointsLabel: {
    fontSize: 12,
    color: '#666',
  },
});