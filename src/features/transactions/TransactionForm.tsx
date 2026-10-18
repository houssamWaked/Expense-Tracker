import { Alert, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { useEffect, useState } from 'react';

import { currencySymbols } from '@/config/currency';
import { translateCategory } from '@/i18n/messages';
import { useAppPreferences } from '@/providers/AppPreferencesProvider';
import type { Category, ExpensePlan, TxType } from '@/lib/store';
import { FastPressable, Glyph } from '@/components/AppComponents';
import { DatePickerField } from '@/components/DatePickerField';

export type TransactionDraft = {
  title: string;
  amount: number;
  kind: TxType;
  category: string;
  note: string;
  reminderAt: Date | null;
  planId: number | null;
};

function localDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function localTime(value: Date) {
  return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
}

function parseReminder(date: string, time: string) {
  const dateParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  const timeParts = /^(\d{2}):(\d{2})$/.exec(time.trim());
  if (!dateParts || !timeParts) return null;
  const [, year, month, day] = dateParts;
  const [, hour, minute] = timeParts;
  const result = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  if (result.getFullYear() !== Number(year) || result.getMonth() !== Number(month) - 1 || result.getDate() !== Number(day)) return null;
  if (Number(hour) > 23 || Number(minute) > 59 || result.getTime() <= Date.now()) return null;
  return result;
}

function CategoryChip({ category, active, onPress }: { category: Category; active: boolean; onPress: () => void }) {
  const { styles, colors, language } = useAppPreferences();
  return <FastPressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: active }} style={[styles.categoryChoice, active && styles.categoryChoiceActive]}>
    <View style={[styles.categoryChoiceGlyph, { backgroundColor: active ? category.color : colors.paper }]}><Glyph name={category.icon as never} size={17} color={active ? colors.white : colors.ink} /></View>
    <Text numberOfLines={1} style={[styles.categoryChoiceText, active && styles.categoryChoiceTextActive]}>{translateCategory(language, category.name)}</Text>
  </FastPressable>;
}

export function TransactionForm({ currency, categories, plans = [], initialKind = 'expense', onSave, onCancel }: {
  currency: string;
  categories: Category[];
  plans?: ExpensePlan[];
  initialKind?: TxType;
  onSave: (data: TransactionDraft) => Promise<void>;
  onCancel: () => void;
}) {
  const { styles, colors, t, language } = useAppPreferences();
  const [kind, setKind] = useState<TxType>(initialKind);
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [planId, setPlanId] = useState<number | null>(null);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const suggested = new Date(Date.now() + 60 * 60 * 1000);
  suggested.setMinutes(Math.ceil(suggested.getMinutes() / 5) * 5, 0, 0);
  const [reminderDate, setReminderDate] = useState(localDate(suggested));
  const [reminderTime, setReminderTime] = useState(localTime(suggested));
  const available = categories.filter((item) => item.kind === kind);

  useEffect(() => {
    if (!available.some((item) => item.name === category)) setCategory(available[0]?.name ?? '');
  }, [available, category]);

  const submit = () => {
    const parsedAmount = Number(amount.replace(',', '.'));
    if (!title.trim()) return Alert.alert(t('addName'), t('shortName'));
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return Alert.alert(t('checkAmount'), t('positiveAmount'));
    if (!category) return Alert.alert(t('chooseCategory'), t('chooseCategory'));
    let reminderAt: Date | null = null;
    if (kind === 'expense' && reminderEnabled) {
      reminderAt = parseReminder(reminderDate, reminderTime);
      if (!reminderAt) return Alert.alert(t('invalidReminder'), t('futureReminder'));
    }
    void onSave({ title: title.trim(), amount: parsedAmount, kind, category, note: note.trim(), reminderAt, planId: kind === 'expense' ? planId : null });
  };

  return <ScrollView style={styles.formScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
    <View style={styles.kindSwitch}>{(['expense', 'income'] as TxType[]).map((value) => <FastPressable key={value} onPress={() => setKind(value)} style={[styles.kindOption, kind === value && styles.kindOptionActive]}><Text style={[styles.kindOptionText, kind === value && styles.kindOptionTextActive]}>{value === 'expense' ? t('expense') : t('incomeType')}</Text></FastPressable>)}</View>
    <Text style={styles.fieldLabel}>{t('amount')}  /  {currency}</Text><View style={styles.amountField}><Text style={styles.amountCurrency}>{currencySymbols[currency]}</Text><TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={colors.placeholder} style={styles.amountInput} /></View>
    <Text style={styles.fieldLabel}>{t('whatWasIt')}</Text><TextInput value={title} onChangeText={setTitle} placeholder={kind === 'income' ? t('catSalary') : t('catFood')} placeholderTextColor={colors.muted} style={styles.textField} maxLength={50} />
    {kind === 'expense' && plans.length > 0 && <>
      <Text style={styles.fieldLabel}>{t('tripOptional')}</Text>
      <View style={styles.categoryGrid}>
        <FastPressable onPress={() => setPlanId(null)} style={[styles.categoryChoice, planId === null && styles.categoryChoiceActive]}><Text style={[styles.categoryChoiceText, planId === null && styles.categoryChoiceTextActive]}>{t('noTrip')}</Text></FastPressable>
        {plans.map((plan) => <FastPressable key={plan.id} onPress={() => setPlanId(plan.id)} style={[styles.categoryChoice, planId === plan.id && styles.categoryChoiceActive]}><Text numberOfLines={1} style={[styles.categoryChoiceText, planId === plan.id && styles.categoryChoiceTextActive]}>{plan.title}</Text></FastPressable>)}
      </View>
    </>}
    <Text style={styles.fieldLabel}>{t('chooseCategory')}</Text>
    <View style={styles.categoryGrid}>{available.map((item) => <CategoryChip key={item.id} category={item} active={category === item.name} onPress={() => setCategory(item.name)} />)}</View>
    {kind === 'expense' && <View style={styles.reminderToggle}><Text style={styles.settingTitle}>{t('reminder')}</Text><Switch value={reminderEnabled} onValueChange={setReminderEnabled} trackColor={{ false: colors.line, true: colors.ink }} thumbColor={reminderEnabled ? colors.acid : colors.white} /></View>}
    {kind === 'expense' && reminderEnabled && <View style={styles.reminderFields}>
      <View style={styles.reminderField}><Text style={styles.fieldLabel}>{t('reminderDate')}</Text><DatePickerField value={reminderDate} onChange={setReminderDate} minimumDate={localDate(new Date())} /></View>
      <View style={styles.reminderField}><Text style={styles.fieldLabel}>{t('reminderTime')}</Text><TextInput value={reminderTime} onChangeText={setReminderTime} keyboardType="numbers-and-punctuation" placeholder="HH:MM" placeholderTextColor={colors.placeholder} style={styles.textField} /></View>
    </View>}
    <Text style={styles.fieldLabel}>{t('noteOptional')}</Text><TextInput value={note} onChangeText={setNote} placeholder="" placeholderTextColor={colors.muted} style={styles.textField} maxLength={100} />
    <FastPressable style={styles.submitButton} onPress={submit}><Text style={styles.submitButtonText}>{t('saveEntry')}</Text><Glyph name="arrow-forward" size={17} color={colors.ink} /></FastPressable><FastPressable onPress={onCancel} style={styles.cancelButton}><Text style={styles.cancelText}>{t('cancel')}</Text></FastPressable>
  </ScrollView>;
}

