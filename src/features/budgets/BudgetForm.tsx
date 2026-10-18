import { Alert, ScrollView, Text, TextInput, View } from 'react-native';
import { useState } from 'react';

import { currencySymbols } from '@/config/currency';
import { translateCategory } from '@/i18n/messages';
import { useAppPreferences } from '@/providers/AppPreferencesProvider';
import type { Budget, Category } from '@/lib/store';
import { FastPressable, Glyph } from '@/components/AppComponents';

function CategoryOption({ item, active, onPress }: { item: Category; active: boolean; onPress: () => void }) {
  const { styles, colors, language } = useAppPreferences();
  return <FastPressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: active }} style={[styles.categoryChoice, active && styles.categoryChoiceActive]}>
    <View style={[styles.categoryChoiceGlyph, { backgroundColor: active ? item.color : colors.paper }]}><Glyph name="pricetag-outline" size={17} color={active ? colors.white : colors.ink} /></View>
    <Text numberOfLines={1} style={[styles.categoryChoiceText, active && styles.categoryChoiceTextActive]}>{translateCategory(language, item.name)}</Text>
  </FastPressable>;
}

export function BudgetForm({ budgets, categories, currency, onSave, onCancel }: {
  budgets: Budget[];
  categories: Category[];
  currency: string;
  onSave: (category: string, limit: number) => Promise<void>;
  onCancel: () => void;
}) {
  const { styles, colors, t, language } = useAppPreferences();
  const initial = categories.find((item) => !budgets.some((budget) => budget.category === item.name))?.name ?? categories[0]?.name ?? '';
  const [category, setCategory] = useState(initial);
  const [amount, setAmount] = useState('');
  const submit = () => {
    const parsed = Number(amount.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) return Alert.alert(t('checkAmount'), t('positiveAmount'));
    if (!category) return Alert.alert(t('chooseCategory'), t('chooseCategory'));
    void onSave(category, parsed);
  };
  return <ScrollView style={styles.formScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
    <Text style={styles.fieldLabel}>{t('chooseCategory')}</Text>
    <View style={styles.categoryGrid}>{categories.map((item) => <CategoryOption key={item.id} item={item} active={category === item.name} onPress={() => setCategory(item.name)} />)}</View>
    <Text style={styles.fieldLabel}>{t('monthlyLimit')}  /  {currency}</Text><View style={styles.amountField}><Text style={styles.amountCurrency}>{currencySymbols[currency]}</Text><TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="300.00" placeholderTextColor={colors.placeholder} style={styles.amountInput} /></View>
    {budgets.some((budget) => budget.category === category) && <Text style={styles.existingHint}>{translateCategory(language, category)}</Text>}
    <FastPressable style={styles.submitButton} onPress={submit}><Text style={styles.submitButtonText}>{t('saveLimit')}</Text><Glyph name="arrow-forward" size={17} color={colors.ink} /></FastPressable><FastPressable onPress={onCancel} style={styles.cancelButton}><Text style={styles.cancelText}>{t('cancel')}</Text></FastPressable>
  </ScrollView>;
}

