import { renderHook, act } from '@testing-library/react-hooks';
import { useWaterLogs } from '../useWaterLogs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Mock dependencies
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('useWaterLogs', () => {
  const mockUser = { id: 'test-user-id' };
  const mockLogs = [
    {
      id: '1',
      user_id: mockUser.id,
      intake_amount: 500,
      intake_date: '2024-03-20',
      created_at: '2024-03-20T10:00:00Z',
      updated_at: '2024-03-20T10:00:00Z',
    },
    {
      id: '2',
      user_id: mockUser.id,
      intake_amount: 750,
      intake_date: '2024-03-19',
      created_at: '2024-03-19T10:00:00Z',
      updated_at: '2024-03-19T10:00:00Z',
    },
  ];

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock useAuth
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    
    // Mock Supabase responses
    const mockSupabaseFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    });
    
    (supabase.from as jest.Mock).mockImplementation(mockSupabaseFrom);
  });

  it('should load water logs on mount', async () => {
    const mockSelect = jest.fn().mockResolvedValue({
      data: mockLogs,
      error: null,
    });

    (supabase.from as jest.Mock)().select.mockImplementation(mockSelect);

    const { result, waitForNextUpdate } = renderHook(() => useWaterLogs());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.logs).toEqual([]);

    await waitForNextUpdate();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.logs).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });

  it('should handle load error', async () => {
    const mockError = new Error('Failed to load');
    const mockSelect = jest.fn().mockResolvedValue({
      data: null,
      error: mockError,
    });

    (supabase.from as jest.Mock)().select.mockImplementation(mockSelect);

    const { result, waitForNextUpdate } = renderHook(() => useWaterLogs());

    await waitForNextUpdate();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Failed to load water logs');
    expect(result.current.logs).toEqual([]);
  });

  it('should add new water log', async () => {
    const newLog = {
      id: '3',
      user_id: mockUser.id,
      intake_amount: 1000,
      intake_date: '2024-03-21',
      created_at: '2024-03-21T10:00:00Z',
      updated_at: '2024-03-21T10:00:00Z',
    };

    const mockUpsert = jest.fn().mockResolvedValue({
      data: newLog,
      error: null,
    });

    (supabase.from as jest.Mock)().upsert.mockImplementation(() => ({
      select: () => ({
        single: mockUpsert,
      }),
    }));

    const { result } = renderHook(() => useWaterLogs());

    await act(async () => {
      await result.current.addLog(1000, '2024-03-21');
    });

    expect(result.current.error).toBeNull();
    expect(result.current.logs).toContainEqual(expect.objectContaining({
      id: '3',
      amount: 1000,
      date: '2024-03-21',
    }));
  });

  it('should update existing log', async () => {
    const updatedLog = {
      ...mockLogs[0],
      intake_amount: 800,
      updated_at: '2024-03-20T11:00:00Z',
    };

    const mockUpdate = jest.fn().mockResolvedValue({
      data: updatedLog,
      error: null,
    });

    (supabase.from as jest.Mock)().update.mockImplementation(() => ({
      eq: () => ({
        select: () => ({
          single: mockUpdate,
        }),
      }),
    }));

    const { result } = renderHook(() => useWaterLogs());

    await act(async () => {
      await result.current.updateLog('1', 800);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.logs.find(log => log.id === '1')?.amount).toBe(800);
  });

  it('should delete log', async () => {
    const mockDelete = jest.fn().mockResolvedValue({
      error: null,
    });

    (supabase.from as jest.Mock)().delete.mockImplementation(() => ({
      eq: () => ({
        eq: () => mockDelete,
      }),
    }));

    const { result } = renderHook(() => useWaterLogs());

    await act(async () => {
      await result.current.deleteLog('1');
    });

    expect(result.current.error).toBeNull();
    expect(result.current.logs.find(log => log.id === '1')).toBeUndefined();
  });
}); 