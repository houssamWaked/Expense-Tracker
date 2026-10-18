import { Alert, ScrollView, Text, TextInput, View } from 'react-native';
import { useState } from 'react';

import { useAppPreferences } from '@/providers/AppPreferencesProvider';
import { categorySwatches } from '@/theme/tokens';
import type { CategoryKind } from '@/lib/store';
import { FastPressable, Glyph } from '@/components/AppComponents';

export function CategoryForm({ onSave, onCancel }: {
  onSave: (category: { name: string; kind: CategoryKind; emoji: string; color: string; icon: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const { styles, colors, t } = useAppPreferences();
  const [kind, setKind] = useState<CategoryKind>('expense');
  const [name, setName] = useState('');
  const [color, setColor] = useState(categorySwatches[0] ?? colors.acid);
  const submit = () => {
    if (!name.trim()) return Alert.alert(t('addCategory'), t('setAName'));
    void onSave({ name: name.trim(), kind, emoji: '', color, icon: kind === 'income' ? 'cash-outline' : 'pricetag-outline' });
  };
  return <ScrollView style={styles.formScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
    <View style={styles.kindSwitch}>{(['expense', 'income'] as CategoryKind[]).map((value) => <FastPressable key={value} onPress={() => setKind(value)} style={[styles.kindOption, kind === value && styles.kindOptionActive]}><Text style={[styles.kindOptionText, kind === value && styles.kindOptionTextActive]}>{value === 'expense' ? t('expense') : t('incomeType')}</Text></FastPressable>)}</View>
    <Text style={styles.fieldLabel}>{t('categoryName')}</Text><TextInput value={name} onChangeText={setName} maxLength={28} placeholder={t('categoryName')} placeholderTextColor={colors.placeholder} style={styles.textField} />
    <Text style={styles.fieldLabel}>{t('appearance')}</Text><View style={styles.colorRail}>{categorySwatches.map((swatch) => <FastPressable key={swatch} onPress={() => setColor(swatch)} accessibilityRole="button" accessibilityState={{ selected: color === swatch }} style={[styles.colorSwatch, { backgroundColor: swatch }, color === swatch && styles.colorSwatchActive]}>{color === swatch && <Glyph name="checkmark" size={15} color={colors.white} />}</FastPressable>)}</View>
    <FastPressable style={styles.submitButton} onPress={submit}><Text style={styles.submitButtonText}>{t('create')}</Text><Glyph name="arrow-forward" size={17} color={colors.ink} /></FastPressable><FastPressable onPress={onCancel} style={styles.cancelButton}><Text style={styles.cancelText}>{t('cancel')}</Text></FastPressable>
  </ScrollView>;
}

