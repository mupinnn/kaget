import { useContext, useState, createContext } from "react";

type HidableBalanceProviderProps = {
  children: React.ReactNode;
  defaultHidden?: boolean;
  storageKey?: string;
};

type HidableBalanceContextState = {
  hidden: boolean;
  toggleHidable: () => void;
};

const HidableBalanceContext = createContext<HidableBalanceContextState | null>(null);

export function HidableBalanceProvider({
  children,
  defaultHidden = false,
  storageKey = "kaget-ui-balance-hidden",
}: HidableBalanceProviderProps) {
  const [hidden, setHidden] = useState<boolean>(() => {
    const storedValue = localStorage.getItem(storageKey);

    if (storedValue) {
      return JSON.parse(storedValue) as boolean;
    }

    return defaultHidden;
  });

  const value: HidableBalanceContextState = {
    hidden,
    toggleHidable: () => {
      localStorage.setItem(storageKey, JSON.stringify(!hidden));
      setHidden(prev => !prev);
    },
  };

  return <HidableBalanceContext.Provider value={value}>{children}</HidableBalanceContext.Provider>;
}

export function useHidableBalance() {
  const context = useContext(HidableBalanceContext);

  if (!context) throw new Error("useHidableBalance must be used within a HidableBalanceProvider");

  return context;
}
