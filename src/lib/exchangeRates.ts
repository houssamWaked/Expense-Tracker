import type { SQLiteDatabase } from 'expo-sqlite';

import { getPreference, setPreference } from '@/lib/store';

export type ExchangeRates = { base: 'USD'; rates: Record<string, number>; updatedAt: number };
const CACHE_KEY = 'exchangeRatesUsd';
const CACHE_TIME_KEY = 'exchangeRatesUpdatedAt';
const CACHE_MAX_AGE = 20 * 60 * 60 * 1000;
const ENDPOINT = 'https://open.er-api.com/v6/latest/USD';

type ApiResponse = { result?: string; base_code?: string; time_last_update_unix?: number; rates?: Record<string, number> };

async function readCached(db: SQLiteDatabase): Promise<ExchangeRates | null> {
  try {
    const [ratesValue, timeValue] = await Promise.all([getPreference(db, CACHE_KEY, ''), getPreference(db, CACHE_TIME_KEY, '')]);
    if (!ratesValue || !timeValue) return null;
    const rates = JSON.parse(ratesValue) as Record<string, number>;
    if (!Number.isFinite(rates.USD) || rates.USD !== 1) return null;
    return { base: 'USD', rates, updatedAt: Number(timeValue) };
  } catch {
    return null;
  }
}

export async function loadExchangeRates(db: SQLiteDatabase): Promise<ExchangeRates> {
  const cached = await readCached(db);
  if (cached && Date.now() - cached.updatedAt < CACHE_MAX_AGE) return cached;

  try {
    const response = await fetch(ENDPOINT);
    if (!response.ok) throw new Error(`Exchange rate request failed (${response.status})`);
    const payload = await response.json() as ApiResponse;
    if (payload.result !== 'success' || payload.base_code !== 'USD' || !payload.rates || payload.rates.USD !== 1) throw new Error('Exchange rate response was invalid');
    const updatedAt = (payload.time_last_update_unix ?? Math.floor(Date.now() / 1000)) * 1000;
    const rates = payload.rates;
    await Promise.all([setPreference(db, CACHE_KEY, JSON.stringify(rates)), setPreference(db, CACHE_TIME_KEY, String(updatedAt))]);
    return { base: 'USD', rates, updatedAt };
  } catch (error) {
    if (cached) return cached;
    throw error;
  }
}

export function convertAmount(amount: number, sourceCurrency: string, targetCurrency: string, rates?: ExchangeRates | null) {
  if (sourceCurrency === targetCurrency) return amount;
  if (!rates) throw new Error('Exchange rates are not loaded');
  const sourceRate = rates.rates[sourceCurrency];
  const targetRate = rates.rates[targetCurrency];
  if (!Number.isFinite(sourceRate) || !Number.isFinite(targetRate) || sourceRate <= 0 || targetRate <= 0) throw new Error(`Missing exchange rate for ${sourceCurrency} or ${targetCurrency}`);
  return amount / sourceRate * targetRate;
}
