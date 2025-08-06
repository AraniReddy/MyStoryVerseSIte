import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
  Modal
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import { launchImageLibrary } from 'react-native-image-picker';
import { supabase } from '../config/supabase';
import { useBrandStore } from '../store/brandStore';
import { notifyNewTask, notifyTargetedUsers } from '../utils/notifications';

export const AddTaskScreen = ({ navigation }: any) => {
  const { brands: storeBrands, fetchBrands } = useBrandStore();
  
  const [title, setTitle] = useState('');
  const [brandName, setBrandName] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [brandSearch, setBrandSearch] = useState('');
  
  useEffect(() => {
    fetchBrands();
    fetchCategories();
    setFilteredBrands(storeBrands);
  }, [storeBrands]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    const filtered = storeBrands.filter(brand => 
      brand.name.toLowerCase().includes(brandSearch.toLowerCase())
    );
    setFilteredBrands(filtered);
  }, [brandSearch, storeBrands]);
  const [filteredBrands, setFilteredBrands] = useState<any[]>([]);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [question, setQuestion] = useState('');
  const [reward, setReward] = useState('');
  const [userTarget, setUserTarget] = useState('');
  const [likeCost, setLikeCost] = useState('');
  const [commentCost, setCommentCost] = useState('');
  const [feedbackCost, setFeedbackCost] = useState('');
  const [feedbackType, setFeedbackType] = useState('URL'); // 'URL' or 'Questions'
  const [feedbackUrl, setFeedbackUrl] = useState('');
  const [showFeedbackDropdown, setShowFeedbackDropdown] = useState(false);
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [taskVisibility, setTaskVisibility] = useState('global');
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);
  const [secureMode, setSecureMode] = useState(false);
  const [activeTo, setActiveTo] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<{ uri: string; type: string; fileName?: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [uri: string]: number }>({});

  const pickFiles = () => {
    launchImageLibrary({ 
      mediaType: 'mixed',
      selectionLimit: 10,
      quality: 0.5,
      videoQuality: 'low'
    }, (response) => {
      if (response.assets) {
        const files = response.assets.map(file => ({
          uri: file.uri || '',
          type: file.type?.startsWith('video') ? 'video' : 'image',
          fileName: file.fileName
        }));
        const newTotal = mediaFiles.length + files.length;
        if (newTotal > 10) {
          Alert.alert('File Limit', `You can only upload up to 10 files. ${10 - mediaFiles.length} slots remaining.`);
          setMediaFiles(prev => [...prev, ...files].slice(0, 10));
        } else {
          setMediaFiles(prev => [...prev, ...files]);
        }
      }
    });
  };

  const uploadMedia = async () => {
    console.log('Starting media upload, files count:', mediaFiles.length);
    const urls = [];
    setUploading(true);
    
    for (let i = 0; i < mediaFiles.length; i++) {
      const file = mediaFiles[i];
      console.log('Processing file:', { uri: file.uri, type: file.type, fileName: file.fileName });
      
      if (file.uri) {
        setUploadProgress(prev => ({ ...prev, [file.uri]: 0 }));
        
        try {
          const ext = file.fileName?.split('.').pop() || (file.type === 'video' ? 'mp4' : 'jpg');
          const filePath = `tasks/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
          console.log('Upload path:', filePath);
          
          console.log('Fetching file data from URI...');
          const response = await fetch(file.uri);
          const arrayBuffer = await response.arrayBuffer();
          const fileData = new Uint8Array(arrayBuffer);
          console.log('File data size:', fileData.length, 'bytes');
          
          setUploadProgress(prev => ({ ...prev, [file.uri]: 50 }));
          
          console.log('Uploading to Supabase storage...');
          const { data, error } = await supabase.storage
            .from('media')
            .upload(filePath, fileData, {
              contentType: file.type === 'video' ? 'video/mp4' : 'image/jpeg'
            });
            
          console.log('Upload result:', { data, error });
            
          if (error) {
            console.error('Upload error:', error);
            throw error;
          }
          
          setUploadProgress(prev => ({ ...prev, [file.uri]: 100 }));
          
          const { data: urlData } = supabase.storage.from('media').getPublicUrl(data.path);
          console.log('Generated public URL:', urlData.publicUrl);
          urls.push(urlData.publicUrl);
          
        } catch (error) {
          console.error('File upload failed:', error);
          Alert.alert('Upload Error', `Failed to upload ${file.fileName || 'file'}`);
        }
        
        // Clear progress after delay
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[file.uri];
            return newProgress;
          });
        }, 500);
      }
    }
    console.log('Upload complete, URLs:', urls);
    setUploading(false);
    return urls;
  };

  const handleDelete = (index: number) => {
    const updatedFiles = [...mediaFiles];
    updatedFiles.splice(index, 1);
    setMediaFiles(updatedFiles);
  };

  const validateSubmission = () => {
    // Check required fields
    if (!brandName.trim()) {
      Alert.alert('Validation Error', 'Brand name is required');
      return false;
    }
    if (!question.trim()) {
      Alert.alert('Validation Error', 'Question is required');
      return false;
    }
    if (!reward || parseInt(reward) <= 0) {
      Alert.alert('Validation Error', 'Valid reward amount is required');
      return false;
    }
    if (!userTarget || parseInt(userTarget) <= 0) {
      Alert.alert('Validation Error', 'Valid user target is required');
      return false;
    }
    
    // Check media files
    if (mediaFiles.length === 0) {
      Alert.alert('Validation Error', 'At least one image or video is required');
      return false;
    }
    if (mediaFiles.length > 10) {
      Alert.alert('Validation Error', 'Maximum 10 files allowed');
      return false;
    }
    
    // Check file types
    const invalidFiles = mediaFiles.filter(file => 
      file.type !== 'image' && file.type !== 'video'
    );
    if (invalidFiles.length > 0) {
      Alert.alert('Validation Error', 'Only image and video files are allowed');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    console.log('Starting task submission...');
    if (!validateSubmission()) return;
    
    try {
      console.log('Uploading media files...');
      const imageUrls = await uploadMedia();
      console.log('Media upload complete, URLs received:', imageUrls);
      
      const taskData = {
        title,
        brand_name: brandName,
        brand_id: selectedBrandId,
        question,
        image_urls: imageUrls,
        reward_amount: parseInt(reward),
        secure_mode: secureMode,
        active_to: activeTo.toISOString(),
        active: true,
        user_target: parseInt(userTarget),
        like_cost: parseInt(likeCost) || 0,
        comment_cost: parseInt(commentCost) || 0,
        feedback_cost: parseInt(feedbackCost) || 0,
        feedback_url: feedbackType === 'URL' ? feedbackUrl : null,
        feedback_type: feedbackType,
        task_visibility: taskVisibility,
        category: category
      };
      
      console.log('Inserting task into database:', taskData);
      console.log('Inserting task data:', taskData);
      const { data, error } = await supabase.from('brand_tasks').insert(taskData).select();
      
      if (error) {
        console.error('Task insertion error:', error);
        throw error;
      }
      
      console.log('Task inserted successfully:', data);
      
      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }
      
      const createdTaskId = data[0]?.id;
      console.log('Task created successfully with ID:', createdTaskId);
      
      // Get category from tags table to use for notifications
      let categoryForNotification = '';
      if (category) {
        const { data: tagData } = await supabase
          .from('tags')
          .select('category')
          .eq('name', category)
          .single();
        
        categoryForNotification = tagData?.category || category;
      }
      
      // Notify targeted users based on task visibility
      const taskTags = [brandName.toLowerCase(), categoryForNotification.toLowerCase(), 'feedback', 'review'].filter(Boolean);
      let targetCountries = ['India', 'United States', 'United Kingdom', 'Nigeria', 'Indonesia'];
      
      if (taskVisibility === 'local') {
        targetCountries = ['India'];
      }
      
      console.log('Creating notifications for task:', createdTaskId);
      console.log('Task tags:', taskTags);
      console.log('Target countries:', targetCountries);
      
      await notifyTargetedUsers(taskTags, targetCountries, brandName, createdTaskId);
      console.log('Notifications created successfully');
      
      if (feedbackType === 'Questions' && createdTaskId) {
        navigation.navigate('AddQuestions', { taskId: createdTaskId });
      } else {
        Alert.alert('Success', 'Task created successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Task creation error:', error);
      Alert.alert('Error', 'Failed to create task');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add New Task</Text>
      </View>

      <Text style={styles.label}>Title</Text>
      <TextInput 
        style={styles.input} 
        value={title} 
        onChangeText={setTitle}
        placeholder="Enter task title"
        placeholderTextColor="#000"
      />

      <Text style={styles.label}>Brand Name</Text>
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
              key={`task-brand-${brand.id}`}
              style={styles.dropdownItem}
              onPress={() => {
                setBrandName(brand.name);
                setBrandSearch(brand.name);
                setSelectedBrandId(brand.id);
                setShowBrandDropdown(false);
              }}
            >
              <Text style={styles.dropdownItemText}>{brand.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.label}>Question</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        value={question}
        onChangeText={setQuestion}
        multiline
        placeholder="What do you want to ask users?"
        placeholderTextColor="#000"
      />

      <Text style={styles.label}>Reward Amount (₹)</Text>
      <TextInput
        style={styles.input}
        value={reward}
        onChangeText={setReward}
        keyboardType="numeric"
        placeholder="Enter reward amount"
        placeholderTextColor="#000"
      />

      <Text style={styles.label}>User Target</Text>
      <TextInput
        style={styles.input}
        value={userTarget}
        onChangeText={setUserTarget}
        keyboardType="numeric"
        placeholder="Number of users needed"
        placeholderTextColor="#000"
      />

      <Text style={styles.label}>Like Cost (₹)</Text>
      <TextInput
        style={styles.input}
        value={likeCost}
        onChangeText={setLikeCost}
        keyboardType="numeric"
        placeholder="Cost per like"
        placeholderTextColor="#000"
      />

      <Text style={styles.label}>Comment Cost (₹)</Text>
      <TextInput
        style={styles.input}
        value={commentCost}
        onChangeText={setCommentCost}
        keyboardType="numeric"
        placeholder="Cost per comment"
        placeholderTextColor="#000"
      />

      <Text style={styles.label}>Feedback Cost (₹)</Text>
      <TextInput
        style={styles.input}
        value={feedbackCost}
        onChangeText={setFeedbackCost}
        keyboardType="numeric"
        placeholder="Cost per feedback"
        placeholderTextColor="#000"
      />

      <Text style={styles.label}>Category</Text>
      <TouchableOpacity 
        style={styles.dropdown} 
        onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
      >
        <Text style={styles.dropdownText}>{category || 'Select Category'}</Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>
      
      {showCategoryDropdown && (
        <View style={styles.dropdownOptions}>
          {categories.map((cat) => (
            <TouchableOpacity 
              key={`category-${cat.id}`}
              style={styles.dropdownOption}
              onPress={() => {
                setCategory(cat.name);
                setShowCategoryDropdown(false);
              }}
            >
              <Text style={styles.dropdownOptionText}>{cat.emoji} {cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.label}>Feedback Type</Text>
      <TouchableOpacity 
        style={styles.dropdown} 
        onPress={() => setShowFeedbackDropdown(!showFeedbackDropdown)}
      >
        <Text style={styles.dropdownText}>{feedbackType}</Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>
      
      {showFeedbackDropdown && (
        <View style={styles.dropdownOptions}>
          <TouchableOpacity 
            style={styles.dropdownOption}
            onPress={() => {
              setFeedbackType('URL');
              setShowFeedbackDropdown(false);
            }}
          >
            <Text style={styles.dropdownOptionText}>URL</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.dropdownOption}
            onPress={() => {
              setFeedbackType('Questions');
              setShowFeedbackDropdown(false);
            }}
          >
            <Text style={styles.dropdownOptionText}>Questions</Text>
          </TouchableOpacity>
        </View>
      )}

      {feedbackType === 'URL' && (
        <>
          <Text style={styles.label}>Feedback URL</Text>
          <TextInput
            style={styles.input}
            value={feedbackUrl}
            onChangeText={setFeedbackUrl}
            placeholder="Enter feedback URL"
            placeholderTextColor="#000"
          />
        </>
      )}

      {feedbackType === 'Questions' && (
        <TouchableOpacity 
          style={styles.questionsButton}
          onPress={() => Alert.alert('Info', 'Please create the task first, then questions will be added automatically')}
        >
          <Text style={styles.questionsButtonText}>📝 Add Questions</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.label}>Task Visibility</Text>
      <TouchableOpacity 
        style={styles.dropdown} 
        onPress={() => setShowVisibilityDropdown(!showVisibilityDropdown)}
      >
        <Text style={styles.dropdownText}>{taskVisibility === 'local' ? 'Local (Country Only)' : 'Global (Worldwide)'}</Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>
      
      {showVisibilityDropdown && (
        <View style={styles.dropdownOptions}>
          <TouchableOpacity 
            style={styles.dropdownOption}
            onPress={() => {
              setTaskVisibility('local');
              setShowVisibilityDropdown(false);
            }}
          >
            <Text style={styles.dropdownOptionText}>Local (Country Only)</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.dropdownOption}
            onPress={() => {
              setTaskVisibility('global');
              setShowVisibilityDropdown(false);
            }}
          >
            <Text style={styles.dropdownOptionText}>Global (Worldwide)</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.row}>
        <Text style={styles.label}>Secure Mode</Text>
        <TouchableOpacity 
          style={[styles.toggle, { backgroundColor: secureMode ? '#28a745' : '#dc3545' }]} 
          onPress={() => setSecureMode(!secureMode)}
        >
          <Text style={styles.toggleText}>{secureMode ? 'ON' : 'OFF'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Active Until</Text>
      <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
        <Text style={styles.dateText}>{activeTo.toLocaleDateString()}</Text>
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

      <Text style={styles.label}>Upload Images/Videos</Text>
      <TouchableOpacity style={styles.uploadButton} onPress={pickFiles}>
        <Text style={styles.uploadText}>📁 Pick Files ({mediaFiles.length}/10)</Text>
      </TouchableOpacity>

      <View style={styles.previewContainer}>
        {mediaFiles.map((file, index) => (
          <TouchableOpacity
            key={`media-${index}-${file.uri}`}
            style={styles.mediaBox}
            onPress={() => setPreviewMedia(file.uri)}
            activeOpacity={0.9}
          >
            {file.type === 'image' ? (
              <Image source={{ uri: file.uri }} style={styles.previewImage} />
            ) : (
              <View style={styles.videoPreview}>
                <Image source={{ uri: file.uri }} style={styles.previewImage} />
                <View style={styles.playIcon}>
                  <Text style={styles.playText}>▶️</Text>
                </View>
              </View>
            )}
            
            {/* Delete Icon */}
            <TouchableOpacity style={styles.deleteIcon} onPress={() => handleDelete(index)}>
              <Text style={styles.deleteText}>🗑️</Text>
            </TouchableOpacity>

            {/* Upload Progress */}
            {uploadProgress[file.uri] !== undefined && (
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${uploadProgress[file.uri]}%` }]} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {uploading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6c5ce7" />
          <Text>Uploading media...</Text>
        </View>
      )}

      <TouchableOpacity 
        style={[styles.submitButton, { opacity: uploading ? 0.5 : 1 }]} 
        onPress={handleSubmit} 
        disabled={uploading}
      >
        <Text style={styles.submitText}>Create Task</Text>
      </TouchableOpacity>
      
      {/* Full-Screen Preview Modal */}
      {previewMedia && (
        <Modal visible={true} transparent animationType="fade" onRequestClose={() => setPreviewMedia(null)}>
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setPreviewMedia(null)}>
              <Text style={styles.closeText}>✖️</Text>
            </TouchableOpacity>

            {previewMedia.includes('video') || previewMedia.endsWith('.mp4') ? (
              <View style={styles.videoContainer}>
                <Image source={{ uri: previewMedia }} style={styles.fullscreenImage} resizeMode="contain" />
                <View style={styles.playIconLarge}>
                  <Text style={styles.playTextLarge}>▶️</Text>
                </View>
              </View>
            ) : (
              <Image source={{ uri: previewMedia }} style={styles.fullscreenImage} resizeMode="contain" />
            )}
          </View>
        </Modal>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    fontSize: 16,
    color: '#6c5ce7',
    marginRight: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  label: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginBottom: 8,
    color: '#333'
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    color: '#000',
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  toggle: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  toggleText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dateButton: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  uploadButton: {
    padding: 15,
    backgroundColor: '#6c5ce7',
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  uploadText: { 
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  previewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
    gap: 8,
  },
  mediaBox: {
    width: 100,
    height: 100,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  videoPreview: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  playIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -15 }, { translateY: -15 }],
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playText: {
    color: '#fff',
    fontSize: 12,
  },
  deleteIcon: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    padding: 4,
    zIndex: 10,
  },
  deleteText: {
    fontSize: 14,
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 4,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6c5ce7',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 10,
    zIndex: 10,
  },
  closeText: {
    fontSize: 20,
    color: '#fff',
  },
  fullscreenImage: {
    width: '90%',
    height: '70%',
  },
  videoContainer: {
    width: '90%',
    height: '70%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  playIconLarge: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playTextLarge: {
    color: '#fff',
    fontSize: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  submitButton: {
    padding: 15,
    backgroundColor: '#28a745',
    borderRadius: 12,
    marginTop: 20,
    alignItems: 'center',
  },
  submitText: { 
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dropdown: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
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
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 15,
    marginTop: -15,
  },
  dropdownOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#333',
  },
  questionsButton: {
    backgroundColor: '#6c5ce7',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  questionsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
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
  searchDropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    maxHeight: 200,
    marginTop: -15,
    marginBottom: 15,
  },
  dateConfirmButton: {
    backgroundColor: '#6c5ce7',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  dateConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});