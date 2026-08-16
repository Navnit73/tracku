"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";

interface BillingContextType {
  isPremium: boolean | null;
  canCreate: boolean;
  transactionCount: number;
  freeLimit: number;
  remainingFreeTransactions: number;
  subscription: any;
  isLoading: boolean;
  refreshBilling: () => Promise<void>;
}

const BillingContext = createContext<BillingContextType>({
  isPremium: null,
  canCreate: true,
  transactionCount: 0,
  freeLimit: 40,
  remainingFreeTransactions: 40,
  subscription: null,
  isLoading: true,
  refreshBilling: async () => {},
});

export function BillingProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [billingState, setBillingState] = useState<{
    isPremium: boolean | null;
    canCreate: boolean;
    transactionCount: number;
    freeLimit: number;
    remainingFreeTransactions: number;
    subscription: any;
    isLoading: boolean;
  }>({
    isPremium: null,
    canCreate: true,
    transactionCount: 0,
    freeLimit: 40,
    remainingFreeTransactions: 40,
    subscription: null,
    isLoading: true,
  });

  const fetchBilling = useCallback(async () => {
    if (status !== "authenticated" || !session?.user) {
      if (status === "unauthenticated") {
        setBillingState((prev) => ({ ...prev, isLoading: false }));
      }
      return;
    }

    try {
      const res = await fetch("/api/billing/status");
      const data = await res.json();
      if (data.success) {
        setBillingState({
          isPremium: data.isPremium ?? false,
          canCreate: data.canCreate ?? true,
          transactionCount: data.transactionCount ?? 0,
          freeLimit: data.freeLimit ?? 40,
          remainingFreeTransactions: data.remainingFreeTransactions ?? 40,
          subscription: data.subscription ?? null,
          isLoading: false,
        });
      } else {
        setBillingState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch {
      setBillingState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [status, session?.user]);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  return (
    <BillingContext.Provider
      value={{
        ...billingState,
        refreshBilling: fetchBilling,
      }}
    >
      {children}
    </BillingContext.Provider>
  );
}

export function useBilling() {
  const context = useContext(BillingContext);
  if (!context) {
    throw new Error("useBilling must be used within a BillingProvider");
  }
  return context;
}
