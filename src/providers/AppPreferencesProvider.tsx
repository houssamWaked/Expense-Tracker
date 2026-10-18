import { useSQLiteContext } from 'expo-sqlite';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';

import { getPreference, setPreference } from '@/lib/store';
import { translate, type Language, type MessageKey } from '@/i18n/messages';
import { createAppStyles } from '@/theme/appStyles';
import { themes, type BalanceCardStyle, type ResolvedTheme, type ThemeColors, type ThemeName } from '@/theme/tokens';

type PreferencesContextValue = {
  theme: ThemeName;
  balanceCardStyle: BalanceCardStyle;
  resolvedTheme: ResolvedTheme;
  language: Language;
  colors: ThemeColors;
  styles: ReturnType<typeof createAppStyles>;
  isRTL: boolean;
  t: (key: MessageKey, values?: Record<string, string | number>) => string;
  setTheme: (theme: ThemeName) => void;
  setBalanceCardStyle: (style: BalanceCardStyle) => void;
  setLanguage: (language: Language) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function AppPreferencesProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const [theme, setThemeState] = useState<ThemeName>('system');
  const [balanceCardStyle, setBalanceCardStyleState] = useState<BalanceCardStyle>('classic');
  const systemColorScheme = useColorScheme();
  const [language, setLanguageState] = useState<Language>('en');
  const isRTL = language === 'ar';
  const resolvedTheme: ResolvedTheme = theme === 'system' ? (systemColorScheme === 'dark' ? 'dark' : 'light') : theme;
  const colors = themes[resolvedTheme];
  const styles = useMemo(() => createAppStyles(colors, isRTL), [colors, isRTL]);
  const t = useCallback((key: MessageKey, values?: Record<string, string | number>) => translate(language, key, values), [language]);

  useEffect(() => {
    let active = true;
    void Promise.all([getPreference(db, 'theme', 'system'), getPreference(db, 'language', 'en'), getPreference(db, 'balanceCardStyle', 'classic')]).then(([savedTheme, savedLanguage, savedCardStyle]) => {
      if (!active) return;
      if (savedTheme === 'system' || savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'sand' || savedTheme === 'sage' || savedTheme === 'midnight' || savedTheme === 'ocean') setThemeState(savedTheme);
      if (savedLanguage === 'en' || savedLanguage === 'ar') setLanguageState(savedLanguage);
      if (savedCardStyle === 'classic' || savedCardStyle === 'visa' || savedCardStyle === 'mastercard' || savedCardStyle === 'amex') setBalanceCardStyleState(savedCardStyle);
    });
    return () => { active = false; };
  }, [db]);

  const setTheme = useCallback((value: ThemeName) => {
    setThemeState(value);
    void setPreference(db, 'theme', value);
  }, [db]);
  const setBalanceCardStyle = useCallback((value: BalanceCardStyle) => {
    setBalanceCardStyleState(value);
    void setPreference(db, 'balanceCardStyle', value);
  }, [db]);
  const setLanguage = useCallback((value: Language) => {
    setLanguageState(value);
    void setPreference(db, 'language', value);
  }, [db]);

  const value = useMemo(() => ({ theme, balanceCardStyle, resolvedTheme, language, colors, styles, isRTL, t, setTheme, setBalanceCardStyle, setLanguage }), [theme, balanceCardStyle, resolvedTheme, language, colors, styles, isRTL, t, setTheme, setBalanceCardStyle, setLanguage]);
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function useAppPreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error('useAppPreferences must be used within AppPreferencesProvider');
  return value;
}
