import { Text, View } from 'react-native';

import { FastPressable } from '@/components/AppComponents';
import { balanceCardStyles, type BalanceCardStyle } from '@/theme/tokens';
import { useAppPreferences } from '@/providers/AppPreferencesProvider';

const stylesList: BalanceCardStyle[] = ['classic', 'visa', 'mastercard', 'amex'];

export function BalanceCardStylePicker({ selected, onSelect }: { selected: BalanceCardStyle; onSelect: (style: BalanceCardStyle) => void }) {
  const { styles, colors, t } = useAppPreferences();
  return <View style={styles.cardStyleList}>{stylesList.map((key) => {
    const template = balanceCardStyles[key];
    const background = template.panel ?? colors.panel;
    const foreground = template.text ?? colors.onPanel;
    return <FastPressable key={key} onPress={() => onSelect(key)} accessibilityRole="button" accessibilityState={{ selected: selected === key }} style={[styles.cardStyleOption, selected === key && styles.cardStyleOptionSelected]}>
      <View style={[styles.cardStylePreview, { backgroundColor: background }]}>
        {key === 'mastercard' && <View style={styles.cardStyleCircles}><View style={[styles.cardStyleCircle, { backgroundColor: '#F15A43' }]} /><View style={[styles.cardStyleCircle, { backgroundColor: '#F7A928', marginLeft: -13 }]} /></View>}
        {key === 'amex' && <View style={styles.cardStyleGrid}><View style={styles.cardStyleGridCell} /><View style={styles.cardStyleGridCell} /><View style={styles.cardStyleGridCell} /><View style={styles.cardStyleGridCell} /></View>}
        {key !== 'mastercard' && key !== 'amex' && <Text style={[styles.cardStyleMark, { color: foreground }]}>{template.mark}</Text>}
        <View style={styles.cardStyleRule} />
        <View style={[styles.cardStyleRuleShort, { backgroundColor: template.accent }]} />
      </View>
      <Text style={[styles.cardStyleLabel, selected === key && styles.cardStyleLabelSelected]}>{t(template.label)}</Text>
      <View style={[styles.cardStyleSelection, selected === key && { backgroundColor: colors.ink, borderColor: colors.ink }]}>{selected === key && <View style={[styles.cardStyleSelectionDot, { backgroundColor: colors.paper }]} />}</View>
    </FastPressable>;
  })}</View>;
}
