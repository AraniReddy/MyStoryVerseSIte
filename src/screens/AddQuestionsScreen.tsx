import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { supabase } from '../config/supabase';

export const AddQuestionsScreen = ({ navigation, route }: any) => {
  const { taskId } = route.params || {};
  const [questions, setQuestions] = useState([{ question: '', type: 'multiple_choice', options: ['', ''], correctAnswer: 0 }]);
  const [feedbackSummary, setFeedbackSummary] = useState('');

  const addQuestion = () => {
    setQuestions([...questions, { question: '', type: 'multiple_choice', options: ['', ''], correctAnswer: 0 }]);
  };

  const addOption = (qIndex: number) => {
    const updated = [...questions];
    if (updated[qIndex].options.length < 5) {
      updated[qIndex].options.push('');
      setQuestions(updated);
    }
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const updated = [...questions];
    if (updated[qIndex].options.length > 1) {
      updated[qIndex].options.splice(oIndex, 1);
      if (updated[qIndex].correctAnswer >= oIndex && updated[qIndex].correctAnswer > 0) {
        updated[qIndex].correctAnswer--;
      }
      setQuestions(updated);
    }
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const handleSave = async () => {
    console.log('Received taskId:', taskId);
    
    // Validate questions
    const valid = questions.every(q => {
      if (!q.question.trim()) return false;
      if (q.type === 'multiple_choice') {
        return q.options.filter(opt => opt.trim()).length >= 1;
      }
      return true; // Text input questions only need question text
    });
    
    if (!valid) {
      Alert.alert('Error', 'Please fill all questions and options');
      return;
    }

    if (!taskId || taskId === 'temp_task_id') {
      Alert.alert('Error', 'Invalid Task ID. Please create the task first.');
      return;
    }

    try {
      // Insert questions into database
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        
        let insertData = {
          task_id: taskId,
          question_text: q.question,
          question_type: q.type,
          question_order: i + 1
        };
        
        if (q.type === 'multiple_choice') {
          const filledOptions = q.options.filter(opt => opt.trim());
          insertData.options = filledOptions;
        } else {
          insertData.options = [];
          insertData.correct_answer = -1;
        }
        
        console.log('Inserting question data:', insertData);
        const { error } = await supabase.from('task_questions').insert(insertData);
        
        if (error) {
          console.error('Database insert error:', error);
          throw error;
        }
      }

      // Update task with feedback summary
      if (feedbackSummary.trim()) {
        await supabase.from('brand_tasks')
          .update({ feedback_summary: feedbackSummary })
          .eq('id', taskId);
      }

      Alert.alert('Success', 'Questions saved successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error saving questions:', error);
      Alert.alert('Error', `Failed to save questions: ${error.message || error}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add Questions</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Feedback Summary</Text>
        <TextInput
          style={styles.summaryInput}
          value={feedbackSummary}
          onChangeText={setFeedbackSummary}
          placeholder="Enter feedback summary or instructions for users"
          placeholderTextColor="#000"
          multiline
          numberOfLines={3}
        />
      </View>

      {questions.map((q, qIndex) => (
        <View key={`question-card-${qIndex}`} style={styles.questionCard}>
          <Text style={styles.questionLabel}>Question {qIndex + 1}</Text>
          <TextInput
            style={styles.questionInput}
            value={q.question}
            onChangeText={(text) => updateQuestion(qIndex, 'question', text)}
            placeholder="Enter your question"
            placeholderTextColor="#000"
            multiline
          />
          
          <View style={styles.typeSelector}>
            <TouchableOpacity 
              style={[styles.typeButton, q.type === 'multiple_choice' && styles.typeButtonActive]}
              onPress={() => updateQuestion(qIndex, 'type', 'multiple_choice')}
            >
              <Text style={styles.typeButtonText}>Multiple Choice</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.typeButton, q.type === 'text_input' && styles.typeButtonActive]}
              onPress={() => updateQuestion(qIndex, 'type', 'text_input')}
            >
              <Text style={styles.typeButtonText}>Text Input</Text>
            </TouchableOpacity>
          </View>

          {q.type === 'multiple_choice' && q.options.map((option, oIndex) => (
            <View key={`question-${qIndex}-option-${oIndex}`} style={styles.optionRow}>
              <TouchableOpacity
                style={[styles.radioButton, q.correctAnswer === oIndex && styles.radioSelected]}
                onPress={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
              >
                <Text style={styles.radioText}>{oIndex + 1}</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.optionInput}
                value={option}
                onChangeText={(text) => updateOption(qIndex, oIndex, text)}
                placeholder={`Option ${oIndex + 1}`}
                placeholderTextColor="#000"
              />
              {q.options.length > 1 && (
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => removeOption(qIndex, oIndex)}
                >
                  <Text style={styles.removeText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          
          {q.type === 'text_input' && (
            <Text style={styles.textInputNote}>Users will provide text answers for this question</Text>
          )}
          
          {q.type === 'multiple_choice' && (
          <View style={styles.optionControls}>
            {q.options.length < 5 && (
              <TouchableOpacity 
                style={styles.addOptionButton}
                onPress={() => addOption(qIndex)}
              >
                <Text style={styles.addOptionText}>+ Add Option</Text>
              </TouchableOpacity>
            )}
          </View>
          )}
        </View>
      ))}

      <TouchableOpacity style={styles.addButton} onPress={addQuestion}>
        <Text style={styles.addButtonText}>+ Add Question</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Questions</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backButton: { fontSize: 16, color: '#6c5ce7', marginRight: 15 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  questionCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15 },
  questionLabel: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  questionInput: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, marginBottom: 15, minHeight: 60, color: '#000' },
  optionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  radioButton: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: '#ddd', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  radioSelected: { backgroundColor: '#6c5ce7', borderColor: '#6c5ce7' },
  radioText: { color: '#fff', fontWeight: 'bold' },
  optionInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, color: '#000' },
  addButton: { backgroundColor: '#28a745', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  saveButton: { backgroundColor: '#6c5ce7', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 30 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  summaryCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15 },
  summaryLabel: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  summaryInput: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, minHeight: 80, textAlignVertical: 'top', color: '#000' },
  removeButton: { marginLeft: 10, padding: 8, backgroundColor: '#dc3545', borderRadius: 15, width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
  removeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  optionControls: { marginTop: 10, alignItems: 'flex-start' },
  addOptionButton: { backgroundColor: '#28a745', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  addOptionText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  typeSelector: { flexDirection: 'row', marginBottom: 15, gap: 10 },
  typeButton: { flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  typeButtonActive: { backgroundColor: '#6c5ce7', borderColor: '#6c5ce7' },
  typeButtonText: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  textInputNote: { fontSize: 14, color: '#666', fontStyle: 'italic', marginBottom: 15 },
});