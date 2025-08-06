import { supabase } from '../config/supabase';

export const createNotification = async (userId: string, title: string, body: string, taskId?: string) => {
  try {
    console.log('Attempting to create notification:', { userId, title, body });
    
    const { data, error } = await supabase.from('notifications').insert({
      user_id: userId,
      title,
      message: body,
      type: 'task',
      task_id: taskId || null,
      read: false
    });
    
    if (error) {
      console.error('Notification insert error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    } else {
      console.log('Notification created successfully:', data);
    }
  } catch (error) {
    console.error('Notification creation error:', error);
  }
};

export const notifyNewTask = async (userId: string, brandName: string) => {
  await createNotification(
    userId,
    '📋 New Task Available',
    `${brandName} has a new product for your feedback!`
  );
};

export const notifyTargetedUsers = async (taskTags: string[], targetCountries: string[], brandName: string, taskId?: string) => {
  try {
    console.log('Fetching users for notification...');
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('user_id, interests, country')
      .not('interests', 'is', null);
    
    if (error) {
      console.error('Error fetching users:', error);
      return;
    }
    
    console.log('Found users:', users?.length || 0);
    
    if (users) {
      let notificationCount = 0;
      for (const user of users) {
        console.log('User interests:', user.interests);
        console.log('Task tags:', taskTags);
        
        // Check if user has matching interests
        const hasMatchingInterest = user.interests?.some((interest: string) => 
          taskTags.some(tag => tag.toLowerCase().includes(interest.toLowerCase()))
        );
        
        console.log('Has matching interest:', hasMatchingInterest);
        
        if (hasMatchingInterest) {
          console.log('Creating notification for user:', user.user_id);
          await createNotification(
            user.user_id,
            '🎯 New Task Available',
            `New ${brandName} task matches your interests!`,
            taskId
          );
          notificationCount++;
        }
      }
      console.log('Created notifications for', notificationCount, 'users');
    }
  } catch (error) {
    console.error('Targeted notification error:', error);
  }
};

export const notifyTaskCompleted = async (userId: string, brandName: string, reward: number) => {
  await createNotification(
    userId,
    '✅ Task Completed',
    `Thank you for your feedback on ${brandName}! You earned ₹${reward}.`
  );
};

export const notifyWalletUpdate = async (userId: string, amount: number) => {
  await createNotification(
    userId,
    '💰 Wallet Updated',
    `₹${amount} has been added to your wallet balance.`
  );
};

export const notifyWithdrawal = async (userId: string, amount: number) => {
  await createNotification(
    userId,
    '💸 Withdrawal Processed',
    `₹${amount} has been withdrawn from your wallet.`
  );
};