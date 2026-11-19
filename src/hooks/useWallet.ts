import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  getAdminEarnings,
  getWalletMe,
  getWalletTransactions,
} from '@/lib/walletApi';

interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

interface WalletTransaction {
  id: string;
  wallet_id: string;
  user_id: string;
  amount: number | string;
  transaction_type: string;
  description: string | null;
  ride_id: string | null;
  created_at: string;
}

interface AdminEarning {
  id: string;
  ride_id: string | null;
  driver_id: string;
  fare_amount: number;
  platform_fee: number;
  driver_earnings: number;
  created_at: string;
}

export const useWallet = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const request = useRef(0);
  const [result, setResult] = useState<{
    userId: string;
    wallet: Wallet | null;
    transactions: WalletTransaction[];
    error: string | null;
  } | null>(null);

  const fetchWallet = useCallback(async () => {
    if (!userId) return;

    const requestId = ++request.current;
    setResult(null);

    try {
      const wallet = await getWalletMe();
      if (requestId !== request.current) return;
      const transactions = wallet ? await getWalletTransactions(50) : [];
      if (requestId === request.current) {
        setResult({ userId, wallet, transactions: transactions || [], error: null });
      }
    } catch (error: unknown) {
      if (requestId === request.current) {
        setResult({
          userId,
          wallet: null,
          transactions: [],
          error: error instanceof Error ? error.message : 'Unable to load wallet.',
        });
      }
    }
  }, [userId]);

  useEffect(() => {
    void fetchWallet();
    return () => {
      request.current++;
    };
  }, [fetchWallet]);

  const current = result?.userId === userId ? result : null;

  return {
    wallet: current?.wallet ?? null,
    transactions: current?.transactions ?? [],
    loading: Boolean(userId && !current),
    error: current?.error ?? null,
    refresh: fetchWallet,
    balance: current?.wallet ? Number(current.wallet.balance) : 0,
  };
};

export const useAdminEarnings = () => {
  const [earnings, setEarnings] = useState<AdminEarning[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalPlatformFees, setTotalPlatformFees] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEarnings = useCallback(async () => {
    try {
      setError(null);
      
      const data = await getAdminEarnings(100);
      setEarnings(data || []);
      
      // Calculate totals
      const totals = (data || []).reduce(
        (acc, e) => ({
          total: acc.total + Number(e.fare_amount),
          fees: acc.fees + Number(e.platform_fee),
        }),
        { total: 0, fees: 0 }
      );
      
      setTotalEarnings(totals.total);
      setTotalPlatformFees(totals.fees);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  return {
    earnings,
    totalEarnings,
    totalPlatformFees,
    loading,
    error,
    refresh: fetchEarnings,
  };
};
