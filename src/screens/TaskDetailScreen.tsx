import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, TextInput, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Modal, Alert } from 'react-native';
import AlertAsync from 'react-native-alert-async';
import { supabase } from '../config/supabase';
import { useAuthStore } from '../store/authStore';
import { useTaskStore } from '../store/taskStore';
import { BrandTask } from '../types';
import { notifyTaskCompleted } from '../utils/notifications';

interface Props {
  route: { params: { task: BrandTask } };
  navigation: any;
}

export const TaskDetailScreen = ({ route, navigation }: Props) => {
  const { task } = route.params;
  const [liked, setLiked] = useState<boolean | null>(null);
  const likedRef = useRef<boolean | null>(null);
  const commentRef = useRef<string>('');
  const questionsRef = useRef<any[]>([]);
  const answersRef = useRef<number[]>([]);
  const textAnswersRef = useRef<string[]>([]);
  const [comment, setComment] = useState('');
  const [imagePreview, setImagePreview] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [textAnswers, setTextAnswers] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { submitResponse } = useTaskStore();
  const { profile } = useAuthStore();
  
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={[styles.headerButtonText, submitting && styles.headerButtonDisabled]}>
            {submitting ? 'Submitting...' : 'Submit'}
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, submitting]);

  useEffect(() => {
    loadComments();
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      console.log('Loading questions for task:', task.id);
      const { data, error } = await supabase
        .from('task_questions')
        .select('*')
        .eq('task_id', task.id)
        .order('question_order');
      
      console.log('Questions data:', data);
      console.log('Questions error:', error);
      
      if (error) throw error;
      setQuestions(data || []);
      setAnswers(new Array(data?.length || 0).fill(-1));
      setTextAnswers(new Array(data?.length || 0).fill(''));
      
      // Update refs as well
      questionsRef.current = data || [];
      answersRef.current = new Array(data?.length || 0).fill(-1);
      textAnswersRef.current = new Array(data?.length || 0).fill('');
      
      console.log('Questions loaded:', data?.length || 0);
    } catch (error) {
      console.error('Error loading questions:', error);
    }
  };

  const loadComments = async () => {
    try {
      const { data: commentsData, error } = await supabase
        .from('comments')
        .select('id, comment_text, created_at, user_id')
        .eq('task_id', task.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Get user names for each comment
      const formattedComments = [];
      for (const comment of commentsData || []) {
        const { data: userData } = await supabase
          .from('user_profiles')
          .select('name')
          .eq('user_id', comment.user_id)
          .single();
        
        formattedComments.push({
          id: comment.id,
          comment_text: comment.comment_text,
          user_name: userData?.name || 'User',
          user_id: comment.user_id,
          created_at: comment.created_at
        });
      }
      
      setComments(formattedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleCommentSubmit = async () => {
    if (!comment.trim()) return;

    try {
      const { data, error } = await supabase.from('comments').insert({
        user_id: profile?.user_id,
        task_id: task.id,
        comment_text: comment.trim()
      }).select();
      
      if (error) throw error;
      
      // Add comment to local state with real ID
      const newComment = {
        id: data[0].id,
        comment_text: comment.trim(),
        user_name: profile?.name || 'You',
        user_id: profile?.user_id,
        created_at: data[0].created_at
      };
      setComments(prev => [newComment, ...prev]);
      setComment(''); // Clear comment after successful submission
    } catch (error: any) {
      console.error('Comment submit error:', error);
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      console.log('Deleting comment with ID:', commentId);
      console.log('Current user ID:', profile?.user_id);
      
      const { data, error, count } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);
      
      console.log('Delete result:', { data, error, count });
      
      if (error) {
        console.error('Database delete error:', error);
        throw error;
      }
      
      console.log('Comment deleted from database successfully');
      setComments(prev => prev.filter(c => c.id !== commentId));
      console.log('Comment removed from UI');
    } catch (error) {
      console.error('Error deleting comment:', error);
      Alert.alert('Error', 'Failed to delete comment');
    }
  };

  const updateComment = async (commentId: string, newText: string) => {
    try {
      console.log('Updating comment with ID:', commentId);
      console.log('New text:', newText);
      console.log('Current user ID:', profile?.user_id);
      
      const { data, error, count } = await supabase
        .from('comments')
        .update({ comment_text: newText })
        .eq('id', commentId);
      
      console.log('Update result:', { data, error, count });
      
      if (error) {
        console.error('Database update error:', error);
        throw error;
      }
      
      console.log('Comment updated in database successfully');
      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, comment_text: newText } : c
      ));
      console.log('Comment updated in UI');
    } catch (error) {
      console.error('Error updating comment:', error);
      Alert.alert('Error', 'Failed to update comment');
    }
  };

  const handleSubmit = async () => {
    console.log('Current liked state:', liked);
    console.log('Current liked ref:', likedRef.current);
    const currentLiked = likedRef.current;
    
    // Check if like/dislike is selected
    if (currentLiked === null) {
      await AlertAsync('Please select like or dislike');
      return;
    }
    
    // Check if comment is provided
    console.log('Current comment state:', comment);
    console.log('Current comment ref:', commentRef.current);
    const currentComment = commentRef.current;
    if (!currentComment.trim()) {
      await AlertAsync('Please add a comment');
      return;
    }
    
    // Check if all questions are answered
    console.log('Questions count (state):', questions.length);
    console.log('Questions count (ref):', questionsRef.current.length);
    console.log('Answers (ref):', answersRef.current);
    console.log('Text answers (ref):', textAnswersRef.current);
    
    const currentQuestions = questionsRef.current;
    if (currentQuestions.length > 0) {
      for (let i = 0; i < currentQuestions.length; i++) {
        const question = currentQuestions[i];
        console.log(`Question ${i}:`, question.question_type);
        
        if (question.question_type === 'multiple_choice') {
          console.log(`Answer ${i}:`, answersRef.current[i]);
          if (answersRef.current[i] === -1 || answersRef.current[i] === undefined) {
            await AlertAsync('Please answer all questions');
            return;
          }
        } else {
          console.log(`Text answer ${i}:`, textAnswersRef.current[i]);
          if (!textAnswersRef.current[i] || !textAnswersRef.current[i].trim()) {
            await AlertAsync('Please answer all questions');
            return;
          }
        }
      }
    }

    setSubmitting(true);
    try {
      // Check if task is still available (user_target not exceeded)
      const { data: existingResponses } = await supabase
        .from('task_responses')
        .select('id')
        .eq('task_id', task.id);
      
      if (existingResponses && existingResponses.length >= (task.user_target || 0)) {
        await AlertAsync('Task Full', 'This task has reached its response limit.');
        navigation.navigate('Home');
        return;
      }
      
      // Store main feedback response
      await supabase.from('task_responses').insert({
        user_id: profile?.user_id,
        task_id: task.id,
        liked: currentLiked,
        comment: currentComment.trim() || null,
        reward_status: 'pending'
      });
      
      // Update current_responses field
      await supabase
        .from('brand_tasks')
        .update({ current_responses: ((task as any).current_responses || 0) + 1 })
        .eq('id', task.id);
      
      // Make task inactive if target reached
      if (((task as any).current_responses || 0) + 1 >= (task.user_target || 0)) {
        await supabase
          .from('brand_tasks')
          .update({ active: false })
          .eq('id', task.id);
        
        console.log(`Task ${task.id} made inactive - target reached`);
      }
      
      // Store like/unlike in task_responses table (already stored in 'liked' field)
      console.log('Like stored in task_responses.liked field:', liked);
      
      // Store comment in comments table if provided
      if (currentComment.trim()) {
        await supabase.from('comments').insert({
          user_id: profile?.user_id,
          task_id: task.id,
          comment_text: currentComment.trim()
        });
      }
      
      // Create wallet transaction record
      console.log('Creating wallet transaction for user:', profile?.user_id);
      const { data: walletData, error: walletError } = await supabase.from('wallet_transactions').insert({
        user_id: profile?.user_id,
        task_id: task.id,
        amount: task.reward_amount,
        status: 'pending',
        payout_method: 'UPI',
        transaction_type: 'earned'
      });
      
      if (walletError) {
        console.error('Wallet transaction error:', walletError);
      } else {
        console.log('Wallet transaction created successfully:', walletData);
      }
      
      // Create notification for feedback submission
      if (profile?.user_id) {
        console.log('Creating feedback notification for user:', profile.user_id);
        const { data: notifData, error: notifError } = await supabase.from('notifications').insert({
          user_id: profile.user_id,
          title: '✅ Feedback Submitted',
          message: `Thank you for your feedback on ${task.brand_name}! Reward: ₹${task.reward_amount} (pending approval).`,
          type: 'task',
          read: false
        });
        
        if (notifError) {
          console.error('Notification creation error:', notifError);
        } else {
          console.log('Feedback notification created successfully');
        }
      }
      
      await AlertAsync('Success', 'Feedback submitted! Points will be added soon.', [
        { text: 'OK', onPress: () => navigation.navigate('Home', { refresh: Date.now() }) }
      ]);
    } catch (error: any) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      <View style={styles.mediaContainer}>
        {task.image_urls.map((url, index) => (
          <TouchableOpacity key={`task-image-${index}-${url.slice(-10)}`} onPress={() => setImagePreview(true)}>
            <Image source={{ uri: url }} style={styles.image} resizeMode="cover" />
          </TouchableOpacity>
        ))}
      </View>
      
      <Modal visible={imagePreview} transparent={true}>
        <View style={styles.previewModal}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setImagePreview(false)}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Image source={{ uri: task.image_urls[0] }} style={styles.previewImage} resizeMode="contain" />
        </View>
      </Modal>
      <View style={styles.content}>
        <Text style={styles.brandName}>{task.brand_name}</Text>
        <Text style={styles.question}>{task.question}</Text>
        <View style={styles.rewardSection}>
          <Text style={styles.reward}>Reward: ₹{task.reward_amount}</Text>
          <TouchableOpacity
            style={[styles.likeButton, liked === true && styles.likeButtonActive]}
            onPress={() => {
              console.log('Like button pressed, setting to true');
              setLiked(true);
              likedRef.current = true;
            }}
          >
            <Text style={styles.likeIcon}>👍</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.likeButton, liked === false && styles.dislikeButtonActive]}
            onPress={() => {
              console.log('Dislike button pressed, setting to false');
              setLiked(false);
              likedRef.current = false;
            }}
          >
            <Text style={styles.likeIcon}>👎</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.feedbackIcon}
            onPress={() => {
              if (task.feedback_url) {
                // Open URL
                Alert.alert('Feedback URL', task.feedback_url);
              } else if (task.feedback_type === 'Questions') {
                // Navigate to quiz
                navigation.navigate('Quiz', { taskId: task.id });
              } else {
                Alert.alert('No Feedback', 'No feedback method configured');
              }
            }}
          >
            <Text style={styles.likeIcon}>📝</Text>
          </TouchableOpacity>
        </View>
        
        {questions.length > 0 && (
          <View style={styles.questionsSection}>
            <Text style={styles.questionsTitle}>Questions</Text>
            {questions.map((question, index) => (
              <View key={question.id} style={styles.questionCard}>
                <Text style={styles.questionText}>{question.question_text}</Text>
                
                {question.question_type === 'multiple_choice' ? (
                  question.options.map((option: string, optionIndex: number) => (
                    <TouchableOpacity
                      key={`${question.id}-${optionIndex}`}
                      style={[styles.option, answers[index] === optionIndex && styles.selectedOption]}
                      onPress={() => {
                        const newAnswers = [...answers];
                        newAnswers[index] = optionIndex;
                        setAnswers(newAnswers);
                        
                        // Update ref as well
                        const newAnswersRef = [...answersRef.current];
                        newAnswersRef[index] = optionIndex;
                        answersRef.current = newAnswersRef;
                      }}
                    >
                      <Text style={styles.optionText}>{option}</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <TextInput
                    style={styles.textInput}
                    value={textAnswers[index] || ''}
                    onChangeText={(text) => {
                      const newTextAnswers = [...textAnswers];
                      newTextAnswers[index] = text;
                      setTextAnswers(newTextAnswers);
                      
                      // Update ref as well
                      const newTextAnswersRef = [...textAnswersRef.current];
                      newTextAnswersRef[index] = text;
                      textAnswersRef.current = newTextAnswersRef;
                    }}
                    placeholder="Enter your answer..."
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={3}
                  />
                )}
              </View>
            ))}
          </View>
        )}
        
        <View style={styles.feedbackSection}>
          <Text style={styles.commentsTitle}>Comments</Text>
          <View style={styles.commentsSection}>
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add your comments..."
                placeholderTextColor="#000"
                value={comment}
                onChangeText={(text) => {
                  setComment(text);
                  commentRef.current = text;
                }}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity 
                style={styles.sendButton}
                onPress={handleCommentSubmit}
              >
                <Text style={styles.sendIcon}>➤</Text>
              </TouchableOpacity>
            </View>
            
            {comments.map((commentItem, index) => (
              <View key={`comment-${commentItem.id}-${index}`} style={styles.commentItem}>
                <View style={styles.commentProfilePic}>
                  <Text style={styles.commentInitial}>{commentItem.user_name?.[0]?.toUpperCase() || 'U'}</Text>
                </View>
                <View style={styles.commentContent}>
                  <Text style={styles.commentUserName}>{commentItem.user_name || 'User'}</Text>
                  {editingComment === commentItem.id ? (
                    <TextInput
                      style={styles.editInput}
                      value={editText}
                      onChangeText={setEditText}
                      placeholderTextColor="#000"
                      multiline
                      autoFocus
                    />
                  ) : (
                    <Text style={styles.commentText}>{commentItem.comment_text}</Text>
                  )}
                </View>
                {commentItem.user_id === profile?.user_id && (
                  <View style={styles.commentActions}>
                    <TouchableOpacity 
                      style={styles.editButton}
                      onPress={() => {
                        if (editingComment === commentItem.id) {
                          // Save edit
                          if (editText.trim()) {
                            updateComment(commentItem.id, editText.trim());
                          }
                          setEditingComment(null);
                        } else {
                          // Start editing
                          setEditingComment(commentItem.id);
                          setEditText(commentItem.comment_text);
                        }
                      }}
                    >
                      <Text style={styles.actionText}>{editingComment === commentItem.id ? '✅' : '✏️'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => {
                        Alert.alert(
                          'Delete Comment',
                          'Are you sure you want to delete this comment?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Delete', style: 'destructive', onPress: () => deleteComment(commentItem.id) }
                          ]
                        );
                      }}
                    >
                      <Text style={styles.actionText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
        

      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  mediaContainer: {
    marginBottom: 10,
    paddingHorizontal: 15,
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: 10,
    marginBottom: 10,
  },
  content: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  brandName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  question: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
    lineHeight: 24,
  },
  rewardSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  reward: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
    marginRight: 50,
  },
  feedbackSection: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 20,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  commentsSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  commentProfilePic: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#6c5ce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  commentInitial: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  commentContent: {
    flex: 1,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  likeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    marginRight: 10,
  },
  likeButtonActive: {
    backgroundColor: '#28a745',
  },
  dislikeButtonActive: {
    backgroundColor: '#dc3545',
  },
  likeIcon: {
    fontSize: 20,
  },
  feedbackIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6c5ce7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    marginLeft: 10,
  },
  commentInputContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  commentInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    paddingRight: 45,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 80,
    color: '#000',
  },
  sendButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    color: '#6c5ce7',
    fontSize: 20,
  },
  previewModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
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
  commentActions: {
    flexDirection: 'row',
    marginLeft: 10,
  },
  editButton: {
    padding: 5,
    marginRight: 5,
  },
  deleteButton: {
    padding: 5,
  },
  actionText: {
    fontSize: 16,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 8,
    borderRadius: 5,
    marginTop: 5,
    minHeight: 40,
    color: '#000',
  },
  submitButton: {
    backgroundColor: '#6c5ce7',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  questionsSection: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 20,
    marginBottom: 20,
  },
  questionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  questionCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  questionText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  option: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    backgroundColor: '#6c5ce7',
    borderColor: '#6c5ce7',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    minHeight: 80,
    textAlignVertical: 'top',
    color: '#000',
  },
  headerButton: {
    marginRight: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#6c5ce7',
    borderRadius: 6,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerButtonDisabled: {
    color: '#ccc',
  },
});