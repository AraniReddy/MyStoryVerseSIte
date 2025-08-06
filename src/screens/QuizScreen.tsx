import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import AlertAsync from 'react-native-alert-async';
import { supabase } from '../config/supabase';
import { useAuthStore } from '../store/authStore';

export const QuizScreen = ({ navigation, route }: any) => {
  const { taskId } = route.params;
  const { profile } = useAuthStore();
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [textAnswers, setTextAnswers] = useState<string[]>([]);
  const [comments, setComments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('task_questions')
        .select('*')
        .eq('task_id', taskId)
        .order('question_order');
      
      if (error) throw error;
      setQuestions(data || []);
      setAnswers(new Array(data?.length || 0).fill(-1));
      setTextAnswers(new Array(data?.length || 0).fill(''));
      setComments(new Array(data?.length || 0).fill(''));
    } catch (error) {
      console.error('Error loading questions:', error);
      await AlertAsync('Error', 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };

  const isCurrentQuestionAnswered = () => {
    const question = questions[currentQuestion];
    if (question?.question_type === 'text_input') {
      return textAnswers[currentQuestion]?.trim().length > 0;
    }
    return answers[currentQuestion] !== -1;
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const submitQuiz = async () => {
    setSubmitting(true);
    try {
      // Save quiz response to task_responses
      await supabase.from('task_responses').insert({
        user_id: profile?.user_id,
        task_id: taskId,
        liked: true,
        reward_status: 'pending'
      });
      
      // Get current task data and update current_responses
      const { data: taskData } = await supabase
        .from('brand_tasks')
        .select('user_target, current_responses')
        .eq('id', taskId)
        .single();
      
      if (taskData) {
        const newResponseCount = (taskData.current_responses || 0) + 1;
        
        await supabase
          .from('brand_tasks')
          .update({ current_responses: newResponseCount })
          .eq('id', taskId);
        
        // Make task inactive if target reached
        if (newResponseCount >= taskData.user_target) {
          await supabase
            .from('brand_tasks')
            .update({ active: false })
            .eq('id', taskId);
          
          console.log(`Task ${taskId} made inactive - target reached`);
        }
      }
      
      // Save individual question responses
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const responseData: any = {
          user_id: profile?.user_id,
          task_id: taskId,
          question_id: question.id,
          is_correct: false
        };
        
        if (question.question_type === 'text_input') {
          responseData.text_response = textAnswers[i];
          responseData.selected_answer = 0; // Default value for text questions
        } else {
          responseData.selected_answer = answers[i];
        }
        
        console.log('Inserting question response:', responseData);
        const { data, error } = await supabase.from('user_question_responses').insert(responseData);
        
        if (error) {
          console.error('Question response error:', error);
        } else {
          console.log('Question response saved:', data);
        }
        
        // Save comments if provided
        if (comments[i]?.trim()) {
          await supabase.from('comments').insert({
            user_id: profile?.user_id,
            task_id: taskId,
            comment_text: comments[i].trim()
          });
        }
      }

      // Create notification for quiz submission
      if (profile?.user_id) {
        await supabase.from('notifications').insert({
          user_id: profile.user_id,
          title: '✅ Quiz Completed',
          message: 'Thank you for completing the quiz! Points will be added soon.',
          type: 'task',
          read: false
        });
      }
      
      await AlertAsync('Feedback Submitted!', 'Thank you for your feedback!', [
        { text: 'OK', onPress: () => navigation.navigate('Home', { refresh: Date.now() }) }
      ]);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      await AlertAsync('Error', 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Text>Loading...</Text>;

  const question = questions[currentQuestion];
  if (!question) return <Text>No questions found</Text>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.progress}>Question {currentQuestion + 1} of {questions.length}</Text>
      </View>
      
      <View style={styles.questionCard}>
        <Text style={styles.questionText}>{question.question_text}</Text>
        
        {question.question_type === 'multiple_choice' ? (
          question.options.map((option: string, index: number) => (
            <TouchableOpacity
              key={`quiz-option-${currentQuestion}-${index}`}
              style={[styles.option, answers[currentQuestion] === index && styles.selectedOption]}
              onPress={() => selectAnswer(index)}
            >
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <TextInput
            style={styles.textInput}
            value={textAnswers[currentQuestion] || ''}
            onChangeText={(text) => {
              const newTextAnswers = [...textAnswers];
              newTextAnswers[currentQuestion] = text;
              setTextAnswers(newTextAnswers);
            }}
            placeholder="Enter your answer..."
            multiline
            numberOfLines={4}
          />
        )}
      </View>

      <View style={styles.buttonContainer}>
        {currentQuestion < questions.length - 1 ? (
          <TouchableOpacity 
            style={[styles.nextButton, !isCurrentQuestionAnswered() && styles.disabledButton]} 
            onPress={nextQuestion}
            disabled={!isCurrentQuestionAnswered()}
          >
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.submitButton, (!isCurrentQuestionAnswered() || submitting) && styles.disabledButton]} 
            onPress={submitQuiz}
            disabled={!isCurrentQuestionAnswered() || submitting}
          >
            <Text style={styles.buttonText}>{submitting ? 'Submitting...' : 'Submit Feedback'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backButton: { fontSize: 16, color: '#6c5ce7', marginRight: 15 },
  progress: { fontSize: 16, color: '#666', flex: 1, textAlign: 'center' },
  questionCard: { backgroundColor: '#fff', padding: 20, borderRadius: 10, marginBottom: 20 },
  questionText: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  option: { backgroundColor: '#f8f9fa', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 2, borderColor: 'transparent' },
  selectedOption: { backgroundColor: '#6c5ce7', borderColor: '#6c5ce7' },
  optionText: { fontSize: 16, color: '#333' },
  buttonContainer: { alignItems: 'center' },
  nextButton: { backgroundColor: '#28a745', padding: 15, borderRadius: 10, width: '100%', alignItems: 'center' },
  submitButton: { backgroundColor: '#6c5ce7', padding: 15, borderRadius: 10, width: '100%', alignItems: 'center' },
  disabledButton: { backgroundColor: '#ccc' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  commentInput: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, marginTop: 15, minHeight: 80, textAlignVertical: 'top' },
  textInput: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 8, minHeight: 100, textAlignVertical: 'top', backgroundColor: '#f8f9fa' },
});