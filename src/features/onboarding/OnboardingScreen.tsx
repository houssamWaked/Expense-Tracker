import { ScrollView, Text, View } from 'react-native';

import { currencies } from '@/config/currency';
import { FastPressable, Glyph } from '@/components/AppComponents';
import { useAppPreferences } from '@/providers/AppPreferencesProvider';

type Step = 0 | 1 | 2 | 3;
type Props = {
  step: Step;
  currency: string;
  onCurrency: (currency: string) => void;
  onContinue: () => void;
  onIncome: () => void;
  onExpense: () => void;
  onFinish: () => void;
  onSkip: () => void;
};

export function OnboardingScreen({ step, currency, onCurrency, onContinue, onIncome, onExpense, onFinish, onSkip }: Props) {
  const { styles, colors, t, isRTL, theme, setTheme, language, setLanguage } = useAppPreferences();
  if (step === 0) return <View style={[styles.onboarding, { direction: isRTL ? 'rtl' : 'ltr' }]}>
    <View style={styles.onboardingBrand}><View style={styles.onboardingMark}><Text style={styles.onboardingMarkText}>p</Text></View><Text style={styles.onboardingBrandName}>pocketwise</Text></View>
    <View style={styles.onboardingMain}>
      <View><Text style={styles.onboardingKicker}>01 / 03</Text><Text style={styles.onboardingTitle}>{t('welcomeTitle')}</Text><Text style={styles.onboardingBody}>{t('welcomeBody')}</Text></View>
      <View style={styles.onboardingPreferences}>
        <View style={styles.onboardingPreferenceGroup}><Text style={styles.onboardingPreferenceLabel}>{t('chooseLanguage')}</Text><View style={styles.onboardingPreferenceChoices}>
          <Choice label={t('english')} active={language === 'en'} onPress={() => setLanguage('en')} /><Choice label={t('arabic')} active={language === 'ar'} onPress={() => setLanguage('ar')} />
        </View></View>
        <View style={styles.onboardingPreferenceGroup}><Text style={styles.onboardingPreferenceLabel}>{t('chooseCurrency')}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.onboardingPreferenceChoices} style={styles.onboardingCurrencyScroll}>
          {currencies.map((code) => <Choice key={code} label={code} active={currency === code} onPress={() => onCurrency(code)} />)}
        </ScrollView></View>
        <View style={styles.onboardingPreferenceGroup}><Text style={styles.onboardingPreferenceLabel}>{t('chooseTheme')}</Text><View style={styles.onboardingPreferenceChoices}>
          <Choice label={t('systemTheme')} active={theme === 'system'} onPress={() => setTheme('system')} /><Choice label={t('light')} active={theme === 'light'} onPress={() => setTheme('light')} /><Choice label={t('dark')} active={theme === 'dark'} onPress={() => setTheme('dark')} />
        </View></View>
      </View>
    </View>
    <View style={styles.onboardingActions}><FastPressable onPress={onContinue} style={styles.onboardingButton}><Text style={styles.onboardingButtonText}>{t('onboardingContinue')}</Text><Glyph name={isRTL ? 'arrow-back' : 'arrow-forward'} size={17} color={colors.ink} /></FastPressable><FastPressable onPress={onSkip} style={styles.onboardingSkip}><Text style={styles.onboardingSkipText}>{t('skipSetup')}</Text></FastPressable></View>
  </View>;

  const title = step === 1 ? t('onboardingIncomeTitle') : step === 2 ? t('onboardingExpenseTitle') : t('onboardingDoneTitle');
  const body = step === 1 ? t('onboardingIncomeBody') : step === 2 ? t('onboardingExpenseBody') : t('onboardingDoneBody');
  const action = step === 1 ? t('onboardingIncomeAction') : step === 2 ? t('onboardingExpenseAction') : t('onboardingDoneAction');
  const onAction = step === 1 ? onIncome : step === 2 ? onExpense : onFinish;
  return <View style={[styles.onboarding, { direction: isRTL ? 'rtl' : 'ltr' }]}>
    <View style={styles.onboardingBrand}><View style={styles.onboardingMark}><Text style={styles.onboardingMarkText}>p</Text></View><Text style={styles.onboardingBrandName}>pocketwise</Text></View>
    <View style={styles.onboardingMain}>
      <View><Text style={styles.onboardingKicker}>{step < 3 ? `0${step + 1} / 03` : 'POCKETWISE'}</Text><Text style={styles.onboardingTitle}>{title}</Text><Text style={styles.onboardingBody}>{body}</Text></View>
      {step < 3 && <View style={styles.onboardingSteps}>
        <View style={styles.onboardingStepRow}><Text style={styles.onboardingStepNumber}>{step > 1 ? '✓' : '01'}</Text><Text style={styles.onboardingStepLabel}>{t('onboardingIncomeTitle')}</Text></View>
        <View style={styles.onboardingStepRow}><Text style={styles.onboardingStepNumber}>{step > 2 ? '✓' : '02'}</Text><Text style={styles.onboardingStepLabel}>{t('onboardingExpenseTitle')}</Text></View>
      </View>}
    </View>
    <View style={styles.onboardingActions}><FastPressable onPress={onAction} style={styles.onboardingButton}><Text style={styles.onboardingButtonText}>{action}</Text><Glyph name={isRTL ? 'arrow-back' : 'arrow-forward'} size={17} color={colors.ink} /></FastPressable><FastPressable onPress={onSkip} style={styles.onboardingSkip}><Text style={styles.onboardingSkipText}>{t('skipSetup')}</Text></FastPressable></View>
  </View>;
}

function Choice({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { styles } = useAppPreferences();
  return <FastPressable onPress={onPress} style={[styles.onboardingPreferenceOption, active && styles.onboardingPreferenceOptionActive]}><Text style={[styles.onboardingPreferenceText, active && styles.onboardingPreferenceTextActive]}>{label}</Text></FastPressable>;
}
