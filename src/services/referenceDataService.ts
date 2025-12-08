import api from './api';
import type { ApiResponse } from '../types';

export interface Country {
  id: number;
  name: string;
  code: string;
  important: boolean;
}

export interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  symbolNative: string;
  decimalDigits: number;
  rounding: number;
  namePlural: string;
  important: boolean;
}

export interface Language {
  id: number;
  code: string;
  name: string;
  important: boolean;
}

export const referenceDataService = {
  async getCountries(important?: boolean): Promise<{ countries: Country[] }> {
    const params = important !== undefined ? { important: important.toString() } : {};
    const response = await api.get<ApiResponse & { countries: Country[] }>('/admin/countries', { params });
    return { countries: response.data.countries };
  },

  async getCurrencies(important?: boolean): Promise<{ currencies: Currency[] }> {
    const params = important !== undefined ? { important: important.toString() } : {};
    const response = await api.get<ApiResponse & { currencies: Currency[] }>('/admin/currencies', { params });
    return { currencies: response.data.currencies };
  },

  async getLanguages(important?: boolean): Promise<{ languages: Language[] }> {
    const params = important !== undefined ? { important: important.toString() } : {};
    const response = await api.get<ApiResponse & { languages: Language[] }>('/admin/languages', { params });
    return { languages: response.data.languages };
  },

  async updateCountryImportant(id: number, important: boolean): Promise<{ country: Country }> {
    const response = await api.put<ApiResponse & { country: Country }>(`/admin/countries/${id}/important`, { important });
    return { country: response.data.country };
  },

  async updateCurrencyImportant(id: number, important: boolean): Promise<{ currency: Currency }> {
    const response = await api.put<ApiResponse & { currency: Currency }>(`/admin/currencies/${id}/important`, { important });
    return { currency: response.data.currency };
  },

  async updateLanguageImportant(id: number, important: boolean): Promise<{ language: Language }> {
    const response = await api.put<ApiResponse & { language: Language }>(`/admin/languages/${id}/important`, { important });
    return { language: response.data.language };
  }
};

