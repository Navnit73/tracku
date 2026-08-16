"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { getUserCurrency, updateUserCurrency as apiUpdateUserCurrency } from "@/app/actions/user";
import { formatCurrency as formatCurrencyUtil, getCurrencySymbol } from "@/lib/utils";

interface CurrencyContextType {
  currency: string;
  currencySymbol: string;
  formatCurrency: (amount: number) => string;
  setCurrency: (newCurrency: string) => Promise<boolean>;
  isSaving: boolean;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "USD",
  currencySymbol: "$",
  formatCurrency: (amount: number) => formatCurrencyUtil(amount, "USD"),
  setCurrency: async () => false,
  isSaving: false,
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [currency, setCurrencyState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("preferred_currency");
      if (cached) return cached;
    }
    return "USD";
  });
  const [isSaving, setIsSaving] = useState(false);

  const userId = session?.user?.id;
  const sessionCurrency = session?.user?.currency;

  // Sync currency from session or fallback DB query if not cached
  useEffect(() => {
    const cached = typeof window !== "undefined" ? localStorage.getItem("preferred_currency") : null;
    if (cached) return;

    if (sessionCurrency) {
      setCurrencyState(sessionCurrency);
      localStorage.setItem("preferred_currency", sessionCurrency);
      return;
    }

    if (userId) {
      getUserCurrency()
        .then((res) => {
          if (res.success && res.currency) {
            setCurrencyState(res.currency);
            localStorage.setItem("preferred_currency", res.currency);
          }
        })
        .catch(() => {});
    }
  }, [userId, sessionCurrency]);

  const setCurrency = useCallback(
    async (newCurrency: string): Promise<boolean> => {
      // 1. Instant optimistic local update
      setCurrencyState(newCurrency);
      if (typeof window !== "undefined") {
        localStorage.setItem("preferred_currency", newCurrency);
      }
      setIsSaving(true);

      // 2. Persist to MongoDB in background
      try {
        const res = await apiUpdateUserCurrency(newCurrency);
        setIsSaving(false);
        return !!res.success;
      } catch {
        setIsSaving(false);
        return false;
      }
    },
    []
  );

  const formatCurrency = useCallback(
    (amount: number) => {
      return formatCurrencyUtil(amount, currency);
    },
    [currency]
  );

  const currencySymbol = getCurrencySymbol(currency);

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencySymbol,
        formatCurrency,
        setCurrency,
        isSaving,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
