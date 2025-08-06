import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Image, TextInput, RefreshControl } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../config/supabase';


export const ProfileScreen = ({ navigation }: any) => {
  const { profile, user, signOut, updateProfile } = useAuthStore();

  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [taskStats, setTaskStats] = useState({ completed: 0, comments: 0, rewards: 0 });
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (profile) {
      setProfileImageUrl(profile.profile_picture_url || null);
    }
    loadTaskStats();
  }, [profile, user]);

  const loadTaskStats = async () => {
    if (!user) return;
    try {
      const [responsesResult, commentsResult] = await Promise.all([
        supabase.from('task_responses').select('*').eq('user_id', user.id),
        supabase.from('comments').select('*', { count: 'exact' }).eq('user_id', user.id)
      ]);
      
      const responses = responsesResult.data || [];
      const commentsCount = commentsResult.count || 0;
      
      setTaskStats({
        completed: responses.length,
        comments: commentsCount,
        rewards: responses.reduce((sum, r) => sum + (r.reward_status === 'paid' ? 1 : 0), 0)
      });
    } catch (error) {
      console.log('Task stats error:', error);
    }
  };

  const handleImagePicker = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, async (response) => {
      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        if (asset.uri && user) {
          try {
            const fileExt = asset.uri.split('.').pop();
            const fileName = `${Date.now()}_${user.id}.${fileExt}`;
            
            const response = await fetch(asset.uri);
            const arrayBuffer = await response.arrayBuffer();
            const fileData = new Uint8Array(arrayBuffer);
            
            const { data, error } = await supabase.storage
              .from('avatars')
              .upload(fileName, fileData, {
                upsert: true,
                contentType: 'image/jpeg'
              });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
              .from('avatars')
              .getPublicUrl(fileName);
            
            const { error: updateError } = await supabase
              .from('user_profiles')
              .update({ profile_picture_url: publicUrl })
              .eq('user_id', user.id);

            if (updateError) throw updateError;

            setProfileImageUrl(publicUrl);
            await loadProfile();
          } catch (error) {
            console.error('Upload error:', error);
          }
        }
      }
    });
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: () => signOut() }
    ]);
  };

  const handleEditName = () => {
    setEditedName(profile?.name || '');
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (!user || !editedName.trim()) return;
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ name: editedName.trim() })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      await loadProfile();
      setIsEditingName(false);
      Alert.alert('Success', 'Name updated successfully');
    } catch (error) {
      console.log('Update error:', error);
      Alert.alert('Error', 'Failed to update name');
    }
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setEditedName('');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTaskStats();
    await loadProfile();
    setRefreshing(false);
  };

  const loadProfile = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setProfileImageUrl(data.profile_picture_url || null);
        await updateProfile(data);
      }
    } catch (error) {
      console.log('Profile refresh error:', error);
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* User Info Card */}
      <View style={styles.userCard}>
        <TouchableOpacity style={styles.profilePicture} onPress={handleImagePicker}>
          {profileImageUrl ? (
            <Image 
              source={{ uri: profileImageUrl }} 
              style={styles.profileImage}
              onError={(error) => {
                console.log('Profile image load error:', error);
                Alert.alert('Image Error', 'Failed to load profile image');
                setProfileImageUrl(null);
              }}
              onLoad={() => console.log('Profile image loaded successfully')}
            />
          ) : (
            <Text style={styles.profileInitial}>{(profile?.name || 'User').charAt(0).toUpperCase()}</Text>
          )}
        </TouchableOpacity>
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            {isEditingName ? (
              <View style={styles.editNameRow}>
                <TextInput
                  style={styles.nameInput}
                  value={editedName}
                  onChangeText={setEditedName}
                  autoFocus
                />
                <TouchableOpacity style={styles.saveIcon} onPress={handleSaveName}>
                  <Text style={styles.actionIcon}>✓</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelIcon} onPress={handleCancelEdit}>
                  <Text style={styles.actionIcon}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.userName}>{profile?.name || 'User'}</Text>
                <TouchableOpacity style={styles.editIcon} onPress={handleEditName}>
                  <Text style={styles.penIcon}>✏️</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          <Text style={styles.userEmail}>{profile?.email || user?.email}</Text>
          <Text style={styles.userDetails}>{profile?.gender} • {profile?.age} • {profile?.location}</Text>
        </View>
      </View>

      {/* Wallet Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💰 Wallet</Text>
        <View style={styles.walletCard}>
          <Text style={styles.balance}>₹{profile?.points_balance || 0}</Text>
          <TouchableOpacity style={styles.walletButton} onPress={() => navigation.navigate('Wallet')}>
            <Text style={styles.walletButtonText}>View Wallet</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Task Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Activity</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{taskStats.completed}</Text>
            <Text style={styles.statLabel}>Tasks Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{taskStats.comments}</Text>
            <Text style={styles.statLabel}>Comments Given</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{taskStats.rewards}</Text>
            <Text style={styles.statLabel}>Rewards Earned</Text>
          </View>
        </View>
      </View>

      {/* Interests */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🏷️ Interests</Text>
          <TouchableOpacity onPress={() => navigation.navigate('InterestSelection')}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.interestTags}>
          {profile?.interests?.map((interest, index) => (
            <View key={`interest-${index}-${interest}`} style={styles.tag}>
              <Text style={styles.tagText}>{interest}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚙️ Settings</Text>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('NotificationSettings')}>
          <Text style={styles.menuText}>🔔 Notifications</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={[styles.menuText, { color: '#ff4757' }]}>🗑️ Delete Account</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      {profile?.user_type === 'Admin' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👨‍💼 Admin</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AddTask')}>
            <Text style={styles.menuText}>➕ Add Task</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AddPromotion')}>
            <Text style={styles.menuText}>🎬 Add Promotion</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Support */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🛟 Support</Text>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('FAQ')}>
          <Text style={styles.menuText}>❓ FAQ</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ContactSupport')}>
          <Text style={styles.menuText}>📞 Contact Support</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('TermsAndConditions')}>
          <Text style={styles.menuText}>📄 Terms & Conditions</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => {
          console.log('Navigating to PrivacyPolicy');
          navigation.navigate('PrivacyPolicy');
        }}>
          <Text style={styles.menuText}>🔒 Privacy Policy</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  userCard: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profilePicture: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6c5ce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profileInitial: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flexShrink: 1,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userDetails: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  editIcon: {
    marginLeft: 5,
    paddingHorizontal: 2,
  },
  penIcon: {
    fontSize: 14,
    color: '#6c5ce7',
  },
  editNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nameInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#6c5ce7',
    paddingVertical: 2,
  },
  saveIcon: {
    marginLeft: 8,
    paddingHorizontal: 4,
  },
  cancelIcon: {
    marginLeft: 4,
    paddingHorizontal: 4,
  },
  actionIcon: {
    fontSize: 16,
    color: '#6c5ce7',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  editText: {
    color: '#6c5ce7',
    fontSize: 14,
    fontWeight: '600',
  },
  walletCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balance: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#28a745',
  },
  walletButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  walletButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6c5ce7',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  interestTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    fontSize: 14,
    color: '#333',
  },
  arrow: {
    fontSize: 18,
    color: '#ccc',
  },
  logoutButton: {
    backgroundColor: '#ff4757',
    marginHorizontal: 15,
    marginBottom: 30,
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  comingSoonText: {
    fontSize: 12,
    color: '#6c5ce7',
    fontStyle: 'italic',
  },
});