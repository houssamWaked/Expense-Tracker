import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable as NativePressable, Text, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import type { MessageKey } from '@/i18n/messages';
import { useAppPreferences } from '@/providers/AppPreferencesProvider';
import type { Category, Transaction } from '@/lib/store';

export type TabKey = 'Home' | 'Activity' | 'Insights' | 'Budgets' | 'Settings';

export function FastPressable({ style, android_ripple, ...props }: PressableProps) {
  return <NativePressable
    {...props}
    android_ripple={android_ripple ?? { color: 'rgba(216,243,106,0.22)', borderless: false, foreground: true }}
    style={(state) => [typeof style === 'function' ? style(state) : style, state.pressed ? { opacity: Platform.OS === 'android' ? 0.86 : 0.72 } : null]}
  />;
}

export function Glyph({ name, size = 18, color }: { name: keyof typeof Ionicons.glyphMap; size?: number; color?: string }) {
  const { colors } = useAppPreferences();
  return <Ionicons name={name} size={size} color={color ?? colors.ink} />;
}

export function Tactile({ children, onPress, onLongPress, style, accessibilityLabel, disabled }: {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  disabled?: boolean;
}) {
  return <View style={style}><FastPressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} disabled={disabled} onPress={onPress} onLongPress={onLongPress}>{children}</FastPressable></View>;
}

export function Bar({ height, color }: { height: number; color: string }) {
  const { styles } = useAppPreferences();
  return <View style={[styles.bar, { height, backgroundColor: color }]} />;
}

export function SectionHeading({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const { styles, colors, isRTL } = useAppPreferences();
  return <View style={styles.sectionHeadingRow}>
    <Text style={styles.sectionHeading}>{title}</Text>
    {action && <FastPressable hitSlop={8} onPress={onAction}><View style={styles.textAction}><Text style={styles.textActionLabel}>{action}</Text><Glyph name={isRTL ? 'arrow-back' : 'arrow-forward'} size={12} color={colors.ink} /></View></FastPressable>}
  </View>;
}

export function MonthRail({ month, onPrevious, onNext, canGoNext }: { month: string; onPrevious: () => void; onNext: () => void; canGoNext: boolean }) {
  const { styles, colors, isRTL } = useAppPreferences();
  return <View style={styles.monthRail}>
    <View style={styles.monthMarker} />
    <Text style={styles.monthValue}>{month}</Text>
    <View style={styles.monthControls}>
      <FastPressable onPress={onPrevious} hitSlop={8} style={styles.monthControl}><Glyph name={isRTL ? 'chevron-forward' : 'chevron-back'} size={16} color={colors.ink} /></FastPressable>
      <FastPressable disabled={!canGoNext} onPress={onNext} hitSlop={8} style={[styles.monthControl, !canGoNext && styles.monthControlDisabled]}><Glyph name={isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color={colors.ink} /></FastPressable>
    </View>
  </View>;
}

export function ScreenTop({ onSettings, settings = false }: { onSettings: () => void; settings?: boolean }) {
  const { styles, colors, t } = useAppPreferences();
  return <View style={styles.topBar}>
    <View style={styles.brandRow}><View style={styles.brandMark}><Text style={styles.brandInitial}>p</Text></View><Text style={styles.brandName}>pocketwise</Text></View>
    <FastPressable onPress={onSettings} style={styles.topIcon} accessibilityRole="button" accessibilityLabel={settings ? t('overview') : t('settings')}>
      <Glyph name={settings ? 'arrow-back' : 'options-outline'} size={19} color={colors.ink} />
    </FastPressable>
  </View>;
}

export function EmptyLedger({ title, body, onAdd }: { title: string; body: string; onAdd?: () => void }) {
  const { styles, colors, t } = useAppPreferences();
  return <View style={styles.emptyState}>
    <View style={styles.emptyGlyph}><Glyph name="add" size={19} color={colors.ink} /></View>
    <View style={styles.emptyCopy}><Text style={styles.emptyTitle}>{title}</Text>{body ? <Text style={styles.emptyBody}>{body}</Text> : null}</View>
    {onAdd && <FastPressable onPress={onAdd} style={styles.emptyAction}><Text style={styles.emptyActionText}>{t('add')}</Text></FastPressable>}
  </View>;
}

export function NavItem({ item, active, onPress }: { item: Exclude<TabKey, 'Settings'>; active: boolean; onPress: () => void }) {
  const { styles, colors, t } = useAppPreferences();
  const glyph: Record<Exclude<TabKey, 'Settings'>, keyof typeof Ionicons.glyphMap> = { Home: 'grid-outline', Activity: 'list-outline', Insights: 'stats-chart-outline', Budgets: 'pie-chart-outline' };
  const labels: Record<Exclude<TabKey, 'Settings'>, MessageKey> = { Home: 'overview', Activity: 'ledger', Insights: 'insights', Budgets: 'budgets' };
  return <FastPressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: active }} style={styles.navItem}>
    <Glyph name={glyph[item]} size={19} color={active ? colors.ink : colors.muted} />
    <Text style={[styles.navLabel, active && styles.navLabelActive]}>{t(labels[item])}</Text>
    {active && <View style={styles.navActiveMark} />}
  </FastPressable>;
}

export function transactionIcon(category: Category | undefined, kind: Transaction['kind']): keyof typeof Ionicons.glyphMap {
  const fallback = kind === 'income' ? 'arrow-down-outline' : 'ellipsis-horizontal-outline';
  const requested = category?.icon ?? fallback;
  return requested in Ionicons.glyphMap ? requested as keyof typeof Ionicons.glyphMap : fallback;
}
