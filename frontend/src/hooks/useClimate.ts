import { useContext } from 'react';
import { ClimateContext } from '../context/ClimateContext';

export function useClimate() {
  const ctx = useContext(ClimateContext);
  if (!ctx) {
    throw new Error('useClimate must be used within ClimateProvider');
  }
  return ctx;
}

export { ClimateProvider } from '../context/ClimateContext';
