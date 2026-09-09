"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type CurrencyCode = "NGN" | "USD" | "CAD" | "GBP" | "CNY";

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  rates: Record<string, number> | null;
  formatAmount: (amountInNgn: number) => string;
  formatAmountCompact: (amountInNgn: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  NGN: "₦",
  USD: "$",
  CAD: "CA$",
  GBP: "£",
  CNY: "¥",
};

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<CurrencyCode>("NGN");
  const [rates, setRates] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    // Fetch rates using NGN as base
    fetch("https://open.er-api.com/v6/latest/NGN")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.rates) {
          setRates(data.rates);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch exchange rates:", err);
      });
  }, []);

  const formatAmount = (amountInNgn: number): string => {
    const rate = rates ? rates[currency] : 1;
    const converted = amountInNgn * (rate || 1);
    
    return new Intl.NumberFormat(currency === "NGN" ? "en-NG" : "en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: currency === "NGN" ? 0 : 2,
      maximumFractionDigits: currency === "NGN" ? 0 : 2,
    }).format(converted);
  };

  const formatAmountCompact = (amountInNgn: number): string => {
    const rate = rates ? rates[currency] : 1;
    const converted = amountInNgn * (rate || 1);
    const abs = Math.abs(converted);
    const sign = converted < 0 ? "-" : "";
    
    // We append the custom symbol directly for compact because Intl doesn't easily mix compact and currency without M/K truncation issues in some locales
    const symbol = CURRENCY_SYMBOLS[currency];
    
    if (abs >= 1_000_000) return `${sign}${symbol}${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000)     return `${sign}${symbol}${(abs / 1_000).toFixed(1)}K`;
    
    return formatAmount(amountInNgn);
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        rates,
        formatAmount,
        formatAmountCompact,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
