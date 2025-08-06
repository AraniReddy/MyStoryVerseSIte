import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useTaskStore } from '../store/taskStore';
import { useAuthStore } from '../store/authStore';
import { useBrandStore } from '../store/brandStore';
import { BrandTask } from '../types';
import { TaskRecommendationEngine } from '../utils/taskAlgorithm';
import { supabase } from '../config/supabase';

export const HomeScreen = ({ navigation }: any) => {
  const { tasks, loading, fetchTasks } = useTaskStore();
  const { profile, user } = useAuthStore();
  const { brands, fetchBrands, getBrandWeight } = useBrandStore();
  const [recommendedTasks, setRecommendedTasks] = useState<BrandTask[]>([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);



  useEffect(() => {
    fetchTasks();
    fetchBrands();
    checkUnreadNotifications();
    
    // Check if user needs to select interests
    if (!profile?.interests || profile.interests.length === 0) {
      navigation.navigate('InterestSelection');
    }
    
    // Debug profile picture URL
    if (profile?.profile_picture_url) {
      console.log('Profile picture URL:', profile.profile_picture_url);
    }
  }, [profile]);
  
  // Listen for refresh parameter from navigation
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', (e) => {
      const refresh = e?.target?.params?.refresh;
      if (refresh) {
        console.log('Hard refreshing HomeScreen');
        setPage(1);
        setRecommendedTasks([]);
        loadTasks(1, true);
        fetchTasks();
        checkUnreadNotifications();
      }
    });
    
    return unsubscribe;
  }, [navigation, loadTasks]);

  const checkUnreadNotifications = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('read', false)
        .limit(1);
      
      if (!error) {
        setHasUnreadNotifications((data?.length || 0) > 0);
      }
    } catch (error) {
      console.error('Error checking notifications:', error);
    }
  };

  const loadTasks = React.useCallback(async (pageNum: number, reset: boolean = false) => {
    if (!profile || !user) return;
    
    try {
      // Get tasks user has already completed
      const { data: completedTasks } = await supabase
        .from('task_responses')
        .select('task_id')
        .eq('user_id', user.id);
      
      const completedTaskIds = completedTasks?.map(t => t.task_id) || [];
      
      let query = supabase.from('brand_tasks').select('*');
      
      // Filter by task visibility
      if (profile.country) {
        query = query.or(`task_visibility.eq.global,and(task_visibility.eq.local,brand_name.ilike.%${profile.country}%)`);
      } else {
        query = query.eq('task_visibility', 'global');
      }
      
      // Exclude completed tasks
      if (completedTaskIds.length > 0) {
        query = query.not('id', 'in', `(${completedTaskIds.join(',')})`);
      }
      
      const { data: tasksData, error } = await query;
      
      // Filter tasks based on user_target
      const filteredTasks = [];
      if (tasksData) {
        for (const task of tasksData) {
          // Check how many responses this task already has
          const { data: responses } = await supabase
            .from('task_responses')
            .select('id')
            .eq('task_id', task.id);
          
          const responseCount = responses?.length || 0;
          
          // Only show task if response count is less than user_target
          if (responseCount < task.user_target) {
            filteredTasks.push(task);
          }
        }
      }
      
      // Get likes and comments count for each task
      if (filteredTasks) {
        for (let task of filteredTasks) {
          const [likesResult, commentsResult] = await Promise.all([
            supabase.from('task_likes').select('*', { count: 'exact' }).eq('task_id', task.id).eq('liked', true),
            supabase.from('comments').select('*', { count: 'exact' }).eq('task_id', task.id)
          ]);
          
          task.likes_count = likesResult.count || 0;
          task.comments_count = commentsResult.count || 0;
        }
      }
      
      if (error) throw error;
      
      if (filteredTasks && filteredTasks.length > 0) {
        if (reset) {
          setRecommendedTasks(filteredTasks);
        } else {
          // Filter out duplicates when appending
          setRecommendedTasks(prev => {
            const existingIds = new Set(prev.map(task => task.id));
            const newTasks = filteredTasks.filter(task => !existingIds.has(task.id));
            return [...prev, ...newTasks];
          });
        }
        
        setHasMore(filteredTasks.length === 20);
      } else {
        if (reset) {
          setRecommendedTasks([]);
        }
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      if (reset) {
        setRecommendedTasks([]);
      }
      setHasMore(false);
    }
  }, [profile?.user_id, user?.id]);

  useEffect(() => {
    setPage(1);
    loadTasks(1, true);
  }, [loadTasks]);

  const loadMoreTasks = React.useCallback(async () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      await loadTasks(nextPage, false);
      setLoadingMore(false);
    }
  }, [page, loadingMore, hasMore, loadTasks]);

  const handleRefresh = React.useCallback(async () => {
    setPage(1);
    await loadTasks(1, true);
    fetchTasks();
    checkUnreadNotifications();
  }, [loadTasks, fetchTasks]);

  const TaskCard = React.memo(({ task, navigation }: { task: BrandTask, navigation: any }) => (
    <View style={styles.taskCard}>
      <TouchableOpacity onPress={() => navigation.navigate('TaskDetail', { task })}>
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: task.image_urls && task.image_urls[0] ? task.image_urls[0] : 'https://via.placeholder.com/400x200?text=No+Image' }} 
            style={styles.taskImage}
            resizeMode="cover"
            onError={() => console.log('Failed to load image:', task.image_urls[0])}
          />
          {task.secure_mode && (
            <View style={styles.lockIcon}>
              <Text style={styles.lockText}>🔒</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      <View style={styles.taskInfo}>
        <Text style={styles.brandName}>{task.brand_name}</Text>
        <Text style={styles.question}>{task.question}</Text>
        <Text style={styles.reward}>₹{task.reward_amount}</Text>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity key={`like-${task.id}`} style={styles.actionButton} onPress={() => navigation.navigate('TaskDetail', { task })}>
            <Text style={styles.actionIcon}>👍</Text>
            <Text style={styles.actionCount}>{task.likes_count || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity key={`comment-${task.id}`} style={styles.actionButton} onPress={() => navigation.navigate('TaskDetail', { task })}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionCount}>{task.comments_count || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            key={`feedback-${task.id}`}
            style={[styles.actionButton, styles.feedbackButton]} 
            onPress={() => navigation.navigate('TaskDetail', { task })}
          >
            <Text style={styles.feedbackIcon}>📝</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  ));

  const renderTask = ({ item }: { item: BrandTask }) => (
    <TaskCard task={item} navigation={navigation} />
  );

  const keyExtractor = (item: BrandTask, index: number) => `task-${item.id}-${index}`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.profileSection} onPress={() => navigation.navigate('Profile')}>
          <View style={styles.profilePicture}>
            {profile?.profile_picture_url ? (
              <Image 
                source={{ uri: profile.profile_picture_url }} 
                style={styles.profileImage}
              />
            ) : (
              <Text style={styles.profileInitial}>{profile?.name?.charAt(0).toUpperCase() || 'U'}</Text>
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.welcomeText}>Welcome!</Text>
            <Text style={styles.userName}>{profile?.name || 'User'}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.alertButton} onPress={() => navigation.navigate('Notification')}>
            <Text style={styles.alertIcon}>🔔</Text>
            {hasUnreadNotifications && <View style={styles.redDot} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Wallet')} style={styles.walletSection}>
            <Text style={styles.walletIcon}>💼</Text>
            <Text style={styles.balance}>{profile?.points_balance || 0}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <FlatList
        data={recommendedTasks}
        renderItem={renderTask}
        keyExtractor={keyExtractor}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={30}
        refreshing={loading}
        onRefresh={handleRefresh}
        onEndReached={loadMoreTasks}
        onEndReachedThreshold={0.6}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
      
      {recommendedTasks.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No tasks available</Text>
          <Text style={styles.emptyMessage}>
            We're adding more tasks for you to review, give feedback, and earn money. Stay tuned! 💸
          </Text>
        </View>
      )}
      
      <TouchableOpacity style={styles.promotionsButton} onPress={() => navigation.navigate('Promotion')}>
        <Text style={styles.promotionsText}>🎁 Promotions</Text>
      </TouchableOpacity>
      

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6c5ce7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  profileInitial: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userInfo: {
    marginLeft: 10,
  },
  welcomeText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertButton: {
    marginRight: 15,
    position: 'relative',
  },
  alertIcon: {
    fontSize: 20,
  },
  redDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4757',
  },
  walletSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletIcon: {
    fontSize: 18,
    marginRight: 5,
  },
  balance: {
    fontSize: 16,
    color: '#28a745',
    fontWeight: 'bold',
  },
  listContainer: {
    paddingTop: 10,
  },
  taskCard: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  imageContainer: {
    position: 'relative',
  },
  taskImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  lockIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockText: {
    fontSize: 16,
    color: '#fff',
  },
  taskInfo: {
    padding: 18,
  },
  brandName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  question: {
    fontSize: 15,
    color: '#555',
    marginBottom: 12,
    lineHeight: 20,
  },
  reward: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
    backgroundColor: '#f0f9f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 20,
  },
  actionCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  feedbackButton: {
  },
  feedbackIcon: {
    fontSize: 20,
  },
  promotionsButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  promotionsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  emptyState: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});