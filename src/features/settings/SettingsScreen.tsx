import { Switch, Text, View } from 'react-native';

import { currencies, currencySymbols } from '@/config/currency';
import { FastPressable, Glyph, SectionHeading, ScreenTop } from '@/components/AppComponents';
import { translateCategory, type Language } from '@/i18n/messages';
import type { Category } from '@/lib/store';
import { useAppPreferences } from '@/providers/AppPreferencesProvider';
import { themes, type ResolvedTheme } from '@/theme/tokens';

type Props = {
  categories: Category[];
  currency: string;
  reminderOn: boolean;
  reminderHour: number;
  billReminderOn: boolean;
  billDay: number;
  onBack: () => void;
  onAddCategory: () => void;
  onCurrency: (currency: string) => void;
  onDailyReminder: (enabled: boolean) => void;
  onReminderHour: (hour: number) => void;
  onBillReminder: (enabled: boolean) => void;
  onBillDay: (day: number) => void;
};

export function SettingsScreen(props: Props) {
  const { styles, colors, t, language, theme, setTheme, setLanguage } = useAppPreferences();
  const categoriesOf = (kind: Category['kind']) => props.categories.filter((item) => item.kind === kind);
  return <>
    <ScreenTop settings onSettings={props.onBack} />
    <View style={styles.pageHeader}><Text style={styles.pageTitle}>{t('settings')}</Text></View>
    <Text style={styles.settingHeading}>{t('appearance')}</Text>
    <View style={styles.settingOptions}><PreferenceOption label={t('systemTheme')} active={theme === 'system'} onPress={() => setTheme('system')} /></View>
    <Text style={styles.settingHeading}>{t('lightThemes')}</Text>
    <View style={styles.settingOptions}><ThemeOption name="light" label={t('light')} active={theme === 'light'} onPress={() => setTheme('light')} /><ThemeOption name="sand" label={t('sandTheme')} active={theme === 'sand'} onPress={() => setTheme('sand')} /><ThemeOption name="sage" label={t('sageTheme')} active={theme === 'sage'} onPress={() => setTheme('sage')} /></View>
    <Text style={styles.settingHeading}>{t('darkThemes')}</Text>
    <View style={styles.settingOptions}><ThemeOption name="dark" label={t('dark')} active={theme === 'dark'} onPress={() => setTheme('dark')} /><ThemeOption name="midnight" label={t('midnightTheme')} active={theme === 'midnight'} onPress={() => setTheme('midnight')} /><ThemeOption name="ocean" label={t('oceanTheme')} active={theme === 'ocean'} onPress={() => setTheme('ocean')} /></View>
    <Text style={styles.settingHeading}>{t('language')}</Text>
    <View style={styles.settingOptions}><PreferenceOption label={t('english')} active={language === 'en'} onPress={() => setLanguage('en')} /><PreferenceOption label={t('arabic')} active={language === 'ar'} onPress={() => setLanguage('ar')} /></View>
    <Text style={styles.settingHeading}>{t('displayCurrency')}</Text>
    <View style={styles.currencyGrid}>{currencies.map((code) => <FastPressable key={code} onPress={() => props.onCurrency(code)} style={[styles.currencyOption, props.currency === code && styles.currencyOptionActive]}><Text style={[styles.currencySymbol, props.currency === code && styles.currencyActiveText]}>{currencySymbols[code]}</Text><Text style={[styles.currencyCode, props.currency === code && styles.currencyActiveText]}>{code}</Text></FastPressable>)}</View>
    <Text style={styles.exchangeAttribution}>{t('exchangeRateAttribution')}</Text>
    <SectionHeading title={t('expenseCategories')} action={`＋ ${t('addCategory')}`} onAction={props.onAddCategory} />
    <CategoryList categories={categoriesOf('expense')} language={language} />
    <SectionHeading title={t('incomeCategories')} action={`＋ ${t('addCategory')}`} onAction={props.onAddCategory} />
    <CategoryList categories={categoriesOf('income')} language={language} />
    <Text style={styles.settingHeading}>{t('reminders')}</Text>
    <View style={styles.settingPanel}><View style={styles.settingRow}><View style={styles.settingGlyph}><Glyph name="notifications-outline" size={17} color={colors.ink} /></View><View style={styles.settingCopy}><Text style={styles.settingTitle}>{t('dailyReminder')}</Text></View><Switch value={props.reminderOn} onValueChange={props.onDailyReminder} trackColor={{ false: colors.line, true: colors.ink }} thumbColor={props.reminderOn ? colors.acid : colors.white} /></View>
      <View style={styles.settingRule} /><Text style={styles.settingDescriptionWide}>{t('chooseTime')}</Text><View style={styles.choiceRail}>{[9, 13, 18, 20, 21].map((hour) => { const label = hour < 12 ? `${hour} AM` : `${hour - 12} PM`; return <FastPressable key={hour} onPress={() => props.onReminderHour(hour)} style={[styles.timeOption, props.reminderHour === hour && styles.timeOptionActive]}><Text style={[styles.timeOptionText, props.reminderHour === hour && styles.timeOptionTextActive]}>{label}</Text></FastPressable>; })}</View>
    </View>
    <View style={styles.settingPanel}><View style={styles.settingRow}><View style={styles.settingGlyph}><Glyph name="receipt-outline" size={17} color={colors.ink} /></View><View style={styles.settingCopy}><Text style={styles.settingTitle}>{t('billReminder')}</Text></View><Switch value={props.billReminderOn} onValueChange={props.onBillReminder} trackColor={{ false: colors.line, true: colors.ink }} thumbColor={props.billReminderOn ? colors.acid : colors.white} /></View>
      <View style={styles.settingRule} /><Text style={styles.settingDescriptionWide}>{t('remindOn')}</Text><View style={styles.choiceRail}>{[1, 5, 15, 25].map((day) => <FastPressable key={day} onPress={() => props.onBillDay(day)} style={[styles.timeOption, props.billDay === day && styles.timeOptionActive]}><Text style={[styles.timeOptionText, props.billDay === day && styles.timeOptionTextActive]}>{day}</Text></FastPressable>)}</View>
    </View>
  </>;
}

function PreferenceOption({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { styles } = useAppPreferences();
  return <FastPressable onPress={onPress} style={[styles.settingOption, active && styles.settingOptionActive]}><Text style={[styles.settingOptionText, active && styles.settingOptionTextActive]}>{label}</Text></FastPressable>;
}

function ThemeOption({ name, label, active, onPress }: { name: ResolvedTheme; label: string; active: boolean; onPress: () => void }) {
  const { styles } = useAppPreferences();
  const sample = themes[name];
  return <FastPressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: active }} style={[styles.themeOption, active && styles.themeOptionActive]}>
    <View style={styles.themeSwatches}><View style={[styles.themeSwatchPaper, { backgroundColor: sample.paper }]} /><View style={[styles.themeSwatchPanel, { backgroundColor: sample.panel }]} /><View style={[styles.themeSwatchAccent, { backgroundColor: sample.acid }]} /></View>
    <Text numberOfLines={1} style={[styles.themeOptionText, active && styles.themeOptionTextActive]}>{label}</Text>
  </FastPressable>;
}

function CategoryList({ categories, language }: { categories: Category[]; language: Language }) {
  const { styles } = useAppPreferences();
  return <View style={styles.categoryLedger}>{categories.map((category) => <View key={category.id} style={styles.categorySettingRow}><View style={[styles.budgetMarker, { backgroundColor: category.color }]} /><Text style={styles.categorySettingName}>{translateCategory(language, category.name)}</Text></View>)}</View>;
}


