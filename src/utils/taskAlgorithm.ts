import { BrandTask } from '../types';

interface UserProfile {
  interests: string[];
  user_id: string;
}

interface TaskWithScore extends BrandTask {
  relevanceScore: number;
  priorityScore: number;
}

export class TaskRecommendationEngine {
  private static getRelevanceScore(task: BrandTask, userInterests: string[]): number {
    if (!task.tags || !userInterests.length) return 0.5;
    
    const matchingTags = task.tags.filter(tag => 
      userInterests.some(interest => 
        interest.toLowerCase().includes(tag.toLowerCase()) ||
        tag.toLowerCase().includes(interest.toLowerCase())
      )
    );
    
    return Math.min(1, 0.3 + (matchingTags.length / task.tags.length) * 0.7);
  }

  private static calculateLocationScore(task: BrandTask, userLocation?: string): number {
    // If no location data, assume global task
    if (!userLocation) return 0.5;
    
    // For now, assume all tasks are global (can be enhanced with task.country field)
    return 0.5; // Global tasks get 0.5, local would get 1.0
  }

  private static calculateFreshnessScore(task: BrandTask): number {
    const now = new Date();
    const taskStart = new Date(task.active_from);
    const daysSinceStart = (now.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24);
    
    // Fresher tasks get higher scores (decay over 30 days)
    return Math.max(0.1, 1 - (daysSinceStart / 30));
  }

  private static calculateEngagementScore(task: BrandTask): number {
    // Simulate engagement boost for tasks with fewer responses
    // In real implementation, this would query task_responses table
    const simulatedResponseCount = Math.floor(Math.random() * 50);
    return Math.max(0.1, 1 - (simulatedResponseCount / 100));
  }

  private static filterActiveTasks(tasks: BrandTask[]): BrandTask[] {
    const now = new Date();
    return tasks.filter(task => 
      new Date(task.active_to) > now &&
      new Date(task.active_from) <= now
    );
  }

  private static getTaskWeight(task: BrandTask, brandWeights: { [key: string]: number }): number {
    const brandName = task.brand_name.toLowerCase();
    return brandWeights[brandName] || 1;
  }

  private static weightedRandomSelect(tasks: TaskWithScore[], count: number, brandWeights: { [key: string]: number }): BrandTask[] {
    const weighted: { task: BrandTask; weight: number }[] = tasks.map(task => ({
      task,
      weight: this.getTaskWeight(task, brandWeights) * ((task.relevanceScore * 0.6) + (task.priorityScore * 0.4))
    }));

    const selected: BrandTask[] = [];
    const available = [...weighted];

    for (let i = 0; i < count && available.length > 0; i++) {
      const totalWeight = available.reduce((sum, item) => sum + item.weight, 0);
      let random = Math.random() * totalWeight;
      
      for (let j = 0; j < available.length; j++) {
        random -= available[j].weight;
        if (random <= 0) {
          selected.push(available[j].task);
          available.splice(j, 1);
          break;
        }
      }
    }

    return selected;
  }

  static getRecommendedTasks(
    allTasks: BrandTask[], 
    userProfile: UserProfile & { location?: string },
    brandWeights: { [key: string]: number } = {},
    limit: number = 10
  ): BrandTask[] {
    // 1. Filter active tasks
    const activeTasks = this.filterActiveTasks(allTasks);
    
    // 2. Multi-factor scoring
    const scoredTasks = activeTasks.map(task => {
      let score = 0;
      
      // Interest Match (40%)
      const interestScore = this.getRelevanceScore(task, userProfile.interests);
      score += interestScore * 0.4;
      
      // Location Relevance (20%)
      const locationScore = this.calculateLocationScore(task, userProfile.location);
      score += locationScore * 0.2;
      
      // Task Freshness (20%)
      const freshnessScore = this.calculateFreshnessScore(task);
      score += freshnessScore * 0.2;
      
      // Brand Priority + Reward (15%)
      const brandWeight = brandWeights[task.brand_name.toLowerCase()] || 1;
      const priorityScore = (brandWeight / 5) + (task.reward_amount / 100);
      score += priorityScore * 0.15;
      
      // Engagement Boost (5%)
      const engagementScore = this.calculateEngagementScore(task);
      score += engagementScore * 0.05;
      
      return { ...task, relevanceScore: score, priorityScore: score };
    });

    // 3. Sort by score and apply diversity
    return scoredTasks
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  static getRotatingPromo(allTasks: BrandTask[], userProfile: UserProfile, brandWeights: { [key: string]: number } = {}): BrandTask | null {
    const recommended = this.getRecommendedTasks(allTasks, userProfile, brandWeights, 5);
    return recommended.length > 0 ? recommended[Math.floor(Math.random() * recommended.length)] : null;
  }
}