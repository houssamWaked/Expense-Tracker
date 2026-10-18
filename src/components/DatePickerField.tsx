import DateTimePicker from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { Platform, Text, View } from 'react-native';

import { FastPressable, Glyph } from '@/components/AppComponents';
import { useAppPreferences } from '@/providers/AppPreferencesProvider';

function parseLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatLocalDate(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

export function DatePickerField({ value, onChange, minimumDate }: {
  value: string;
  onChange: (value: string) => void;
  minimumDate?: string;
}) {
  const { styles, colors, language } = useAppPreferences();
  const [open, setOpen] = useState(false);
  const selected = parseLocalDate(value || formatLocalDate(new Date()));

  return <View>
    <FastPressable onPress={() => setOpen(true)} accessibilityRole="button" style={[styles.textField, styles.dateField]}>
      <Text style={styles.dateFieldValue}>{selected.toLocaleDateString(language === 'ar' ? 'ar' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</Text>
      <Glyph name="calendar-outline" size={17} color={colors.muted} />
    </FastPressable>
    {open && <DateTimePicker
      value={selected}
      mode="date"
      display={Platform.OS === 'ios' ? 'inline' : 'default'}
      presentation={Platform.OS === 'android' ? 'dialog' : 'inline'}
      minimumDate={minimumDate ? parseLocalDate(minimumDate) : undefined}
      accentColor={colors.ink}
      locale={language === 'ar' ? 'ar' : 'en_US'}
      onValueChange={(_event, date) => {
        onChange(formatLocalDate(date));
        setOpen(false);
      }}
      onDismiss={() => setOpen(false)}
    />}
  </View>;
}
