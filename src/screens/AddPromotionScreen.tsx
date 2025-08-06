import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import DatePicker from 'react-native-date-picker';
import { supabase } from '../config/supabase';
import { useBrandStore } from '../store/brandStore';

export const AddPromotionScreen = ({ navigation }: any) => {
  const { brands, fetchBrands } = useBrandStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [brandName, setBrandName] = useState('');
  const [brandSearch, setBrandSearch] = useState('');
  const [filteredBrands, setFilteredBrands] = useState<any[]>([]);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [promotionUrl, setPromotionUrl] = useState('');
  const [videoFile, setVideoFile] = useState<any>(null);
  const [activeTo, setActiveTo] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchBrands();
    setFilteredBrands(brands);
  }, [brands]);

  useEffect(() => {
    const filtered = brands.filter(brand => 
      brand.name.toLowerCase().includes(brandSearch.toLowerCase())
    );
    setFilteredBrands(filtered);
  }, [brandSearch, brands]);

  const pickVideo = () => {
    launchImageLibrary({ 
      mediaType: 'video',
      quality: 0.5,
      videoQuality: 'low',
      selectionLimit: 1
    }, (response) => {
      if (response.assets && response.assets[0]) {
        const video = response.assets[0];
        console.log('Selected video:', video);
        if (video.duration && video.duration > 30) {
          Alert.alert('Video Too Long', 'Please select a video under 30 seconds');
          return;
        }
        setVideoFile(video);
      }
    });
  };



  const uploadFile = async (file: any, folder: string) => {
    const ext = file.fileName?.split('.').pop() || 'mp4';
    const filePath = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    
    const response = await fetch(file.uri);
    const arrayBuffer = await response.arrayBuffer();
    const fileData = new Uint8Array(arrayBuffer);
    
    const { data, error } = await supabase.storage
      .from('media')
      .upload(filePath, fileData);
      
    if (error) throw error;
    
    const { data: urlData } = supabase.storage.from('media').getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  const handleSubmit = async () => {
    if (!title || !description || !brandName || !videoFile) {
      Alert.alert('Error', 'Please fill all required fields and select a video');
      return;
    }

    setUploading(true);
    try {
      const videoUrl = await uploadFile(videoFile, 'promotions');

      const { error } = await supabase.from('promotions').insert({
        title,
        description,
        brand_name: brandName,
        video_url: videoUrl,
        promotion_url: promotionUrl || null,
        video_duration: videoFile.duration || null,
        reward_view: 5, // Default 5 points per video view
        active_to: activeTo.toISOString()
      });

      if (error) throw error;

      Alert.alert('Success', 'Promotion created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Promotion creation error:', error);
      Alert.alert('Error', 'Failed to create promotion');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>

      <TextInput style={styles.input} placeholder="Title" placeholderTextColor="#000" value={title} onChangeText={setTitle} />
      <TextInput style={[styles.input, { height: 80 }]} placeholder="Description" placeholderTextColor="#000" value={description} onChangeText={setDescription} multiline />
      <TextInput 
        style={styles.input} 
        value={brandSearch} 
        onChangeText={setBrandSearch}
        placeholder="Search brand name..."
        placeholderTextColor="#000"
        onFocus={() => setShowBrandDropdown(true)}
      />
      
      {showBrandDropdown && brandSearch && (
        <View style={styles.searchDropdown}>
          {filteredBrands.slice(0, 10).map((brand) => (
            <TouchableOpacity
              key={`brand-${brand.id}`}
              style={styles.dropdownItem}
              onPress={() => {
                setBrandName(brand.name);
                setBrandSearch(brand.name);
                setShowBrandDropdown(false);
              }}
            >
              <Text style={styles.dropdownItemText}>{brand.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <TextInput style={styles.input} placeholder="Promotion URL (optional)" placeholderTextColor="#000" value={promotionUrl} onChangeText={setPromotionUrl} />

      <TouchableOpacity style={styles.uploadButton} onPress={pickVideo}>
        <Text style={styles.uploadText}>📹 {videoFile ? `Video Selected: ${videoFile.fileName || 'video'}` : 'Select Video (≤30s)'}</Text>
      </TouchableOpacity>
      
      {videoFile && (
        <TouchableOpacity style={styles.videoPreview} onPress={() => Alert.alert('Video Preview', 'Video selected successfully. It will be uploaded when you create the promotion.')}>
          <Image source={{ uri: videoFile.uri }} style={styles.previewImage} />
          <View style={styles.playOverlay}>
            <Text style={styles.playIcon}>▶️</Text>
          </View>
          <Text style={styles.previewText}>Video: {videoFile.fileName}</Text>
          <Text style={styles.previewText}>Duration: {videoFile.duration ? `${Math.round(videoFile.duration)}s` : 'Unknown'}</Text>
        </TouchableOpacity>
      )}



      <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
        <Text style={styles.dateText}>Active Until: {activeTo.toLocaleDateString()}</Text>
      </TouchableOpacity>

      <DatePicker
        modal
        open={showDatePicker}
        date={activeTo}
        mode="date"
        minimumDate={new Date()}
        onConfirm={(date) => {
          setShowDatePicker(false);
          setActiveTo(date);
        }}
        onCancel={() => {
          setShowDatePicker(false);
        }}
      />

      <TouchableOpacity 
        style={[styles.submitButton, { opacity: uploading ? 0.5 : 1 }]} 
        onPress={handleSubmit} 
        disabled={uploading}
      >
        <Text style={styles.submitText}>{uploading ? 'Creating...' : 'Create Promotion'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },

  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 10, marginBottom: 15, fontSize: 16, color: '#000' },
  uploadButton: { padding: 15, backgroundColor: '#6c5ce7', borderRadius: 10, marginBottom: 15, alignItems: 'center' },
  uploadText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  dateButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 10, marginBottom: 15 },
  dateText: { fontSize: 16, color: '#333' },
  videoPreview: { backgroundColor: '#f0f0f0', padding: 10, borderRadius: 8, marginBottom: 15, position: 'relative' },

  previewImage: { width: '100%', height: 150, borderRadius: 8, marginBottom: 8 },
  playOverlay: { position: 'absolute', top: 85, left: '50%', transform: [{ translateX: -15 }], backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 15, width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
  playIcon: { color: '#fff', fontSize: 16 },
  previewText: { fontSize: 14, color: '#666', marginBottom: 2 },
  searchDropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    maxHeight: 200,
    marginTop: -15,
    marginBottom: 15,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  submitButton: { padding: 15, backgroundColor: '#28a745', borderRadius: 12, marginTop: 20, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});