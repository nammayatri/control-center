import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';

interface DashboardContextType {
  merchantId: string | null;
  cityId: string | null;
  merchantShortId: string | null;
  cityName: string | null;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

interface DashboardProviderProps {
  children: React.ReactNode;
}

export function DashboardProvider({ children }: DashboardProviderProps) {
  const { currentMerchant, currentCity } = useAuth();

  return (
    <DashboardContext.Provider
      value={{
        merchantId: currentMerchant?.id || null,
        cityId: currentCity?.id || null,
        merchantShortId: currentMerchant?.shortId || null,
        cityName: currentCity?.name || null,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext(): DashboardContextType {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboardContext must be used within a DashboardProvider');
  }
  return context;
}
