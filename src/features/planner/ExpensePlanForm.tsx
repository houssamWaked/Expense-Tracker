import { Alert, ScrollView, Text, TextInput, View } from 'react-native';
import { useState } from 'react';

import { currencySymbols } from '@/config/currency';
import { FastPressable, Glyph } from '@/components/AppComponents';
import { DatePickerField } from '@/components/DatePickerField';
import { translateCategory } from '@/i18n/messages';
import type { Category, ExpensePlan, ExpensePlanKind } from '@/lib/store';
import { useAppPreferences } from '@/providers/AppPreferencesProvider';

// One-off purchases are recorded as regular expenses; plans are for recurring
// commitments and trip budgets.
const kinds: ExpensePlanKind[] = ['daily', 'weekly', 'trip'];
const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export function ExpensePlanForm({ categories, currency, onSave, onCancel }: {
  categories: Category[];
  currency: string;
  onSave: (plan: Omit<ExpensePlan, 'id'>) => Promise<void>;
  onCancel: () => void;
}) {
  const { styles, colors, t, language } = useAppPreferences();
  const [kind, setKind] = useState<ExpensePlanKind>('daily');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0]?.name ?? '');
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState(today());
  const [destination, setDestination] = useState('');
  const [note, setNote] = useState('');

  const submit = () => {
    const parsed = Number(amount.replace(',', '.'));
    if (!title.trim()) return Alert.alert(t('addName'), t('shortName'));
    if (!Number.isFinite(parsed) || parsed <= 0) return Alert.alert(t('checkAmount'), t('positiveAmount'));
    if (!category) return Alert.alert(t('chooseCategory'), t('chooseCategory'));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate) || endDate < startDate) return Alert.alert(t('planDates'), t('planEndAfterStart'));
    if (kind === 'trip' && !destination.trim()) return Alert.alert(t('tripDestination'), t('tripDestinationRequired'));
    void onSave({ title: title.trim(), amount: parsed, currencyCode: currency, category, kind, startDate, endDate, destination: destination.trim(), note: note.trim() });
  };

  return <ScrollView style={styles.formScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
    <Text style={styles.fieldLabel}>{t('planType')}</Text>
    <View style={styles.planKindGrid}>{kinds.map((value) => <FastPressable key={value} onPress={() => setKind(value)} style={[styles.planKindOption, kind === value && styles.planKindOptionActive]}><Text style={[styles.settingOptionText, kind === value && styles.settingOptionTextActive]}>{t(value)}</Text></FastPressable>)}</View>
    <Text style={styles.fieldLabel}>{t('planName')}</Text><TextInput value={title} onChangeText={setTitle} placeholder={kind === 'trip' ? t('tripNamePlaceholder') : t('planNamePlaceholder')} placeholderTextColor={colors.muted} style={styles.textField} maxLength={50} />
    <Text style={styles.fieldLabel}>{kind === 'trip' ? t('planBudget') : t('amountPerPeriod')}  /  {currency}</Text><View style={styles.amountField}><Text style={styles.amountCurrency}>{currencySymbols[currency]}</Text><TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={colors.placeholder} style={styles.amountInput} /></View>
    <Text style={styles.fieldLabel}>{t('chooseCategory')}</Text><View style={styles.categoryGrid}>{categories.map((item) => <FastPressable key={item.id} onPress={() => setCategory(item.name)} style={[styles.categoryChoice, category === item.name && styles.categoryChoiceActive]}><View style={[styles.categoryChoiceGlyph, { backgroundColor: category === item.name ? item.color : colors.paper }]}><Glyph name={item.icon as never} size={17} color={category === item.name ? colors.white : colors.ink} /></View><Text numberOfLines={1} style={[styles.categoryChoiceText, category === item.name && styles.categoryChoiceTextActive]}>{translateCategory(language, item.name)}</Text></FastPressable>)}</View>
    {kind === 'trip' && <><Text style={styles.fieldLabel}>{t('tripDestination')}</Text><TextInput value={destination} onChangeText={setDestination} placeholder={t('tripDestinationPlaceholder')} placeholderTextColor={colors.muted} style={styles.textField} maxLength={60} /></>}
    <Text style={styles.fieldLabel}>{t('planStartDate')}</Text><DatePickerField value={startDate} onChange={(value) => { setStartDate(value); if (endDate < value) setEndDate(value); }} />
    <Text style={styles.fieldLabel}>{t('planEndDate')}</Text><DatePickerField value={endDate} onChange={setEndDate} minimumDate={startDate} />
    <Text style={styles.fieldLabel}>{t('noteOptional')}</Text><TextInput value={note} onChangeText={setNote} placeholder="" placeholderTextColor={colors.muted} style={styles.textField} maxLength={100} />
    <FastPressable style={styles.submitButton} onPress={submit}><Text style={styles.submitButtonText}>{t('savePlan')}</Text><Glyph name="arrow-forward" size={17} color={colors.ink} /></FastPressable><FastPressable onPress={onCancel} style={styles.cancelButton}><Text style={styles.cancelText}>{t('cancel')}</Text></FastPressable>
  </ScrollView>;
}

export function planOccurrences(plan: Pick<ExpensePlan, 'kind' | 'startDate' | 'endDate'>) {
  if (plan.kind === 'once' || plan.kind === 'trip') return 1;
  if (!plan.endDate) return 1;
  const start = new Date(`${plan.startDate}T00:00:00`);
  const end = new Date(`${plan.endDate}T00:00:00`);
  const days = Math.max(1, Math.floor((end.getTime() - start.getTime()) / 86400000) + 1);
  return plan.kind === 'daily' ? days : Math.floor((days - 1) / 7) + 1;
}
