import { useState, useEffect, useMemo } from 'react';
import { useWaterLogs } from './useWaterLogs';
import { useWaterGoal } from './useWaterGoal';

/**
 * Interface for water intake statistics
 */
export interface WaterStats {
  currentStreak: number;
  longestStreak: number;
  completedDays: number;
  todayProgress: number;
  weeklyAverage: number;
  monthlyAverage: number;
}

/**
 * Hook for calculating water intake statistics
 * @returns Object containing water intake statistics and loading state
 */
export const useWaterStats = () => {
  const { logs, isLoading: logsLoading, error: logsError } = useWaterLogs();
  const { waterGoal, isLoading: goalLoading, error: goalError } = useWaterGoal();
  const [stats, setStats] = useState<WaterStats>({
    currentStreak: 0,
    longestStreak: 0,
    completedDays: 0,
    todayProgress: 0,
    weeklyAverage: 0,
    monthlyAverage: 0,
  });

  /**
   * Calculate statistics based on logs and goal
   */
  useEffect(() => {
    if (logsLoading || goalLoading) return;

    const today = new Date().toISOString().split('T')[0];
    const todayLog = logs.find(log => log.date === today);
    const todayProgress = todayLog ? (todayLog.amount / waterGoal) * 100 : 0;

    // Calculate streaks and completed days
    let currentStreak = 0;
    let longestStreak = 0;
    let completedDays = 0;
    let tempStreak = 0;

    // Sort logs by date in ascending order
    const sortedLogs = [...logs].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    for (let i = 0; i < sortedLogs.length; i++) {
      const log = sortedLogs[i];
      const isCompleted = log.amount >= waterGoal;

      if (isCompleted) {
        completedDays++;
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);

        // Check if this is part of the current streak
        if (i === sortedLogs.length - 1) {
          const lastDate = new Date(log.date);
          const diffDays = Math.floor((new Date().getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays <= 1) {
            currentStreak = tempStreak;
          }
        }
      } else {
        tempStreak = 0;
      }
    }

    // Calculate averages
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const weeklyLogs = logs.filter(log => new Date(log.date) >= weekAgo);
    const monthlyLogs = logs.filter(log => new Date(log.date) >= monthAgo);

    const weeklyAverage = weeklyLogs.length > 0
      ? weeklyLogs.reduce((sum, log) => sum + log.amount, 0) / weeklyLogs.length
      : 0;

    const monthlyAverage = monthlyLogs.length > 0
      ? monthlyLogs.reduce((sum, log) => sum + log.amount, 0) / monthlyLogs.length
      : 0;

    setStats({
      currentStreak,
      longestStreak,
      completedDays,
      todayProgress,
      weeklyAverage,
      monthlyAverage,
    });
  }, [logs, waterGoal, logsLoading, goalLoading]);

  const isLoading = logsLoading || goalLoading;
  const error = logsError || goalError;

  return {
    stats,
    isLoading,
    error,
  };
}; 