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
  const { data: session, update: updateSession } = useSession();
  const [currency, setCurrencyState] = useState<string>("USD");
  const [isSaving, setIsSaving] = useState(false);

  // Initialize and sync currency
  useEffect(() => {
    // 1. Check local storage for instant sync across tabs / page visits
    const cached = typeof window !== "undefined" ? localStorage.getItem("preferred_currency") : null;
    if (cached) {
      setCurrencyState(cached);
    } else if (session?.user?.currency) {
      setCurrencyState(session.user.currency);
      localStorage.setItem("preferred_currency", session.user.currency);
    }

    // 2. Query user currency from DB when user is authenticated
    if (session?.user) {
      getUserCurrency()
        .then((res) => {
          if (res.success && res.currency) {
            setCurrencyState(res.currency);
            localStorage.setItem("preferred_currency", res.currency);
          }
        })
        .catch(() => {});
    }
  }, [session]);

  const setCurrency = useCallback(
    async (newCurrency: string): Promise<boolean> => {
      setCurrencyState(newCurrency);
      if (typeof window !== "undefined") {
        localStorage.setItem("preferred_currency", newCurrency);
      }
      setIsSaving(true);

      try {
        const res = await apiUpdateUserCurrency(newCurrency);
        if (res.success) {
          if (updateSession) {
            try {
              await updateSession({ currency: newCurrency });
            } catch {
              // Ignore session update error if any
            }
          }
          setIsSaving(false);
          return true;
        }
      } catch {
        // Ignore
      }

      setIsSaving(false);
      return false;
    },
    [updateSession]
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
