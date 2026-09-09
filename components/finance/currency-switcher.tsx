"use client";

import { useCurrency, type CurrencyCode } from "@/components/providers/currency-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";

export function CurrencySwitcher() {
  const { currency, setCurrency, rates } = useCurrency();

  // If rates haven't loaded yet, it's fine to still show the switcher, 
  // but it will seamlessly update amounts once loaded.

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground hidden sm:block" />
      <Select value={currency} onValueChange={(v) => setCurrency(v as CurrencyCode)}>
        <SelectTrigger className="w-[110px] h-9">
          <SelectValue placeholder="Currency" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="NGN">🇳🇬 NGN (₦)</SelectItem>
          <SelectItem value="USD">🇺🇸 USD ($)</SelectItem>
          <SelectItem value="CAD">🇨🇦 CAD (CA$)</SelectItem>
          <SelectItem value="GBP">🇬🇧 GBP (£)</SelectItem>
          <SelectItem value="CNY">🇨🇳 CNY (¥)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
