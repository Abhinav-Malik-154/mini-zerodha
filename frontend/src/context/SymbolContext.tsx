'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type SymbolType = 'BTC/USD' | 'ETH/USD' | 'SOL/USD';

interface SymbolContextType {
  selectedSymbol: SymbolType;
  setSelectedSymbol: (symbol: SymbolType) => void;
  availableSymbols: SymbolType[];
}

const SymbolContext = createContext<SymbolContextType | undefined>(undefined);

export function SymbolProvider({ children }: { children: ReactNode }) {
  const [selectedSymbol, setSelectedSymbol] = useState<SymbolType>('BTC/USD');
  const availableSymbols: SymbolType[] = ['BTC/USD', 'ETH/USD', 'SOL/USD'];

  return (
    <SymbolContext.Provider value={{ selectedSymbol, setSelectedSymbol, availableSymbols }}>
      {children}
    </SymbolContext.Provider>
  );
}

export const useSymbol = () => {
  const context = useContext(SymbolContext);
  if (!context) {
    throw new Error('useSymbol must be used within SymbolProvider');
  }
  return context;
};