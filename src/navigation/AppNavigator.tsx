import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { LoginScreen } from '../screens/LoginScreen';
import { SignUpScreen } from '../screens/SignUpScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { TaskDetailScreen } from '../screens/TaskDetailScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { LeaderboardScreen } from '../screens/LeaderboardScreen';
import { WalletScreen } from '../screens/WalletScreen';
import { PromotionScreen } from '../screens/PromotionScreen';
import { NotificationScreen } from '../screens/NotificationScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { OTPVerificationScreen } from '../screens/OTPVerificationScreen';
import { InterestSelectionScreen } from '../screens/InterestSelectionScreen';
import { PasswordResetOTPScreen } from '../screens/PasswordResetOTPScreen';
import { AddTaskScreen } from '../screens/AddTaskScreen';
import { AddQuestionsScreen } from '../screens/AddQuestionsScreen';
import { QuizScreen } from '../screens/QuizScreen';
import { PrivacyPolicyScreen } from '../screens/PrivacyPolicyScreen';
import { TermsAndConditionsScreen } from '../screens/TermsAndConditionsScreen';
import { FAQScreen } from '../screens/FAQScreen';
import { ContactSupportScreen } from '../screens/ContactSupportScreen';
import { NotificationSettingsScreen } from '../screens/NotificationSettingsScreen';
import { AddPromotionScreen } from '../screens/AddPromotionScreen';
import { AuthWrapper } from '../components/AuthWrapper';
import { NetworkChecker } from '../components/NetworkChecker';
import { useAuthStore } from '../store/authStore';

const Stack = createStackNavigator();

export const AppNavigator = () => {
  const { user, profile } = useAuthStore();

  return (
    <NetworkChecker>
      <AuthWrapper>
        <NavigationContainer>
        <Stack.Navigator>
          {user ? (
            <>
              <Stack.Screen 
                name="Home" 
                component={HomeScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="InterestSelection" 
                component={InterestSelectionScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="TaskDetail" 
                component={TaskDetailScreen}
                options={{ title: 'Task Details' }}
              />
              <Stack.Screen 
                name="Profile" 
                component={ProfileScreen}
                options={{ title: 'Profile' }}
              />
              <Stack.Screen 
                name="Leaderboard" 
                component={LeaderboardScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Wallet" 
                component={WalletScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Promotion" 
                component={PromotionScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Notification" 
                component={NotificationScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Quiz" 
                component={QuizScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="PrivacyPolicy" 
                component={PrivacyPolicyScreen}
                options={{ title: 'Privacy Policy' }}
              />
              <Stack.Screen 
                name="TermsAndConditions" 
                component={TermsAndConditionsScreen}
                options={{ title: 'Terms & Conditions' }}
              />
              <Stack.Screen 
                name="FAQ" 
                component={FAQScreen}
                options={{ title: 'FAQ' }}
              />
              <Stack.Screen 
                name="ContactSupport" 
                component={ContactSupportScreen}
                options={{ title: 'Contact Support' }}
              />
              <Stack.Screen 
                name="NotificationSettings" 
                component={NotificationSettingsScreen}
                options={{ title: 'Notification Settings' }}
              />
              <Stack.Screen 
                name="AddPromotion" 
                component={AddPromotionScreen}
                options={{ title: 'Add Promotion' }}
              />
              {profile?.user_type === 'Admin' && (
                <>
                  <Stack.Screen 
                    name="AddTask" 
                    component={AddTaskScreen}
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen 
                    name="AddQuestions" 
                    component={AddQuestionsScreen}
                    options={{ headerShown: false }}
                  />
                </>
              )}
            </>
          ) : (
            <>
              <Stack.Screen 
                name="Login" 
                component={LoginScreen} 
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="SignUp" 
                component={SignUpScreen} 
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="ForgotPassword" 
                component={ForgotPasswordScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="PasswordResetOTP" 
                component={PasswordResetOTPScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="OTPVerification" 
                component={OTPVerificationScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="InterestSelection" 
                component={InterestSelectionScreen}
                options={{ headerShown: false }}
              />
            </>
          )}
        </Stack.Navigator>
        </NavigationContainer>
      </AuthWrapper>
    </NetworkChecker>
  );
};