import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, FlatList, Linking } from 'react-native';
import Video from 'react-native-video';
import { supabase } from '../config/supabase';
import { useAuthStore } from '../store/authStore';

const { width, height } = Dimensions.get('window');

export const PromotionScreen = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [watchedPromotions, setWatchedPromotions] = useState(new Set());
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    fetchPromotions();
    return () => setIsMounted(false);
  }, []);

  const fetchPromotions = async () => {
    if (!user) return;
    
    try {
      // Get promotions user hasn't watched
      const { data: watchedIds } = await supabase
        .from('wallet_transactions')
        .select('promotion_id')
        .eq('user_id', user.id)
        .eq('payout_method', 'Video View');
      
      const watchedPromotionIds = watchedIds?.map(w => w.promotion_id) || [];
      
      let query = supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (watchedPromotionIds.length > 0) {
        query = query.not('id', 'in', `(${watchedPromotionIds.join(',')})`);
      }
      
      const { data, error } = await query;
      
      if (data) {
        setPromotions(data);
      }
    } catch (error) {
      console.log('Fetch promotions error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoComplete = async (promotion: any) => {
    if (!user || watchedPromotions.has(promotion.id)) return;
    
    try {
      // Add transaction for video view reward
      await supabase.from('wallet_transactions').insert({
        user_id: user.id,
        promotion_id: promotion.id,
        amount: promotion.reward_view || 0,
        status: 'accepted', // Auto-accept video view rewards
        payout_method: 'Video View'
      });
      
      // Mark as watched to prevent duplicate rewards
      setWatchedPromotions(prev => new Set([...prev, promotion.id]));
      
      console.log(`Reward added: ${promotion.reward_view} for watching ${promotion.title}`);
    } catch (error) {
      console.log('Video reward error:', error);
    }
  };

  const renderPromotion = ({ item }: any) => (
    <View style={styles.promotionContainer}>
      <Video
        source={{ uri: item.video_url }}
        style={styles.promotionVideo}
        resizeMode="cover"
        repeat
        muted={false}
        paused={currentIndex === promotions.findIndex(p => p.id === item.id)}
        controls={false}
        bufferConfig={{
          minBufferMs: 2000,
          maxBufferMs: 5000,
          bufferForPlaybackMs: 1000,
          bufferForPlaybackAfterRebufferMs: 1500
        }}
        onError={(error) => isMounted && console.log('Video error:', error)}
        onLoad={() => isMounted && console.log('Video loaded:', item.video_url)}
        onEnd={() => isMounted && handleVideoComplete(item)}
      />
      
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        
        <View style={styles.content}>
          <Text style={styles.brandName}>{item.brand_name}</Text>
          <Text style={styles.description}>{item.description}</Text>
          
          {item.promotion_url && (
            <TouchableOpacity 
              style={styles.ctaButton} 
              onPress={() => Linking.openURL(item.promotion_url)}
            >
              <Text style={styles.ctaText}>🛒 Buy Now</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#fff' }}>Loading promotions...</Text>
      </View>
    );
  }

  if (promotions.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#fff' }}>No promotions available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={promotions}
        renderItem={renderPromotion}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.y / height);
          setCurrentIndex(index);
        }}
        initialNumToRender={2}
        maxToRenderPerBatch={1}
        windowSize={3}
        removeClippedSubviews={true}
        snapToInterval={height}
        decelerationRate="fast"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  promotionContainer: {
    width,
    height,
    position: 'relative',
  },
  promotionVideo: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
  },
  closeText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 80,
  },
  brandName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 22,
  },
  actions: {
    position: 'absolute',
    right: -60,
    bottom: 0,
  },
  ctaButton: {
    backgroundColor: '#6c5ce7',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  ctaText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});