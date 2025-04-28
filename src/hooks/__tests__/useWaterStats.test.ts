import { renderHook } from '@testing-library/react-hooks';
import { useWaterStats } from '../useWaterStats';
import { useWaterLogs } from '../useWaterLogs';
import { useWaterGoal } from '../useWaterGoal';

// Mock dependencies
jest.mock('../useWaterLogs', () => ({
  useWaterLogs: jest.fn(),
}));

jest.mock('../useWaterGoal', () => ({
  useWaterGoal: jest.fn(),
}));

describe('useWaterStats', () => {
  const mockLogs = [
    {
      id: '1',
      amount: 3000,
      date: '2024-03-20',
      created_at: '2024-03-20T10:00:00Z',
      updated_at: '2024-03-20T10:00:00Z',
    },
    {
      id: '2',
      amount: 3500,
      date: '2024-03-19',
      created_at: '2024-03-19T10:00:00Z',
      updated_at: '2024-03-19T10:00:00Z',
    },
    {
      id: '3',
      amount: 2000,
      date: '2024-03-18',
      created_at: '2024-03-18T10:00:00Z',
      updated_at: '2024-03-18T10:00:00Z',
    },
  ];

  const mockWaterGoal = 3000;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock useWaterLogs
    (useWaterLogs as jest.Mock).mockReturnValue({
      logs: mockLogs,
      isLoading: false,
      error: null,
    });
    
    // Mock useWaterGoal
    (useWaterGoal as jest.Mock).mockReturnValue({
      waterGoal: mockWaterGoal,
      isLoading: false,
      error: null,
    });

    // Mock Date.now() to return a fixed date
    const mockDate = new Date('2024-03-20T12:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should calculate correct stats', () => {
    const { result } = renderHook(() => useWaterStats());

    expect(result.current.stats).toEqual({
      currentStreak: 2,
      longestStreak: 2,
      completedDays: 2,
      todayProgress: 100,
      weeklyAverage: 2833.33,
      monthlyAverage: 2833.33,
    });
  });

  it('should handle loading state', () => {
    (useWaterLogs as jest.Mock).mockReturnValue({
      logs: [],
      isLoading: true,
      error: null,
    });

    const { result } = renderHook(() => useWaterStats());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.stats).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      completedDays: 0,
      todayProgress: 0,
      weeklyAverage: 0,
      monthlyAverage: 0,
    });
  });

  it('should handle errors', () => {
    const mockError = 'Failed to load data';
    (useWaterLogs as jest.Mock).mockReturnValue({
      logs: [],
      isLoading: false,
      error: mockError,
    });

    const { result } = renderHook(() => useWaterStats());

    expect(result.current.error).toBe(mockError);
  });

  it('should calculate streak correctly with gaps', () => {
    const logsWithGap = [
      {
        id: '1',
        amount: 3000,
        date: '2024-03-20',
        created_at: '2024-03-20T10:00:00Z',
        updated_at: '2024-03-20T10:00:00Z',
      },
      {
        id: '2',
        amount: 2000,
        date: '2024-03-19',
        created_at: '2024-03-19T10:00:00Z',
        updated_at: '2024-03-19T10:00:00Z',
      },
      {
        id: '3',
        amount: 3000,
        date: '2024-03-17',
        created_at: '2024-03-17T10:00:00Z',
        updated_at: '2024-03-17T10:00:00Z',
      },
      {
        id: '4',
        amount: 3000,
        date: '2024-03-16',
        created_at: '2024-03-16T10:00:00Z',
        updated_at: '2024-03-16T10:00:00Z',
      },
    ];

    (useWaterLogs as jest.Mock).mockReturnValue({
      logs: logsWithGap,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useWaterStats());

    expect(result.current.stats.currentStreak).toBe(1);
    expect(result.current.stats.longestStreak).toBe(2);
  });
}); 