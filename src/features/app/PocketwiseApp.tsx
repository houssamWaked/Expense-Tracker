import { useFonts } from 'expo-font';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Alert, Easing, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { currencySymbols } from '@/config/currency';
import { Bar, EmptyLedger, Glyph, MonthRail, NavItem, ScreenTop, SectionHeading, Tactile, transactionIcon, type TabKey } from '@/components/AppComponents';
import { BudgetForm } from '@/features/budgets/BudgetForm';
import { CategoryForm } from '@/features/settings/CategoryForm';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen';
import { TransactionForm, type TransactionDraft } from '@/features/transactions/TransactionForm';
import { useAppPreferences } from '@/providers/AppPreferencesProvider';
import { addTransaction, createCategory, createExpensePlan, getPreference, readBudgets, readCategories, readExpensePlans, readTransactions, removeExpensePlan, removeTransaction, saveBudget, setPreference, type Budget, type Category, type ExpensePlan, type Transaction, type TxType } from '@/lib/store';
import { cancelExpenseReminder, disableBillReminder, disableDailyReminder, enableBillReminder, enableDailyReminder, scheduleExpenseReminder } from '@/lib/reminders';
import { translateCategory, type Language } from '@/i18n/messages';
import { balanceCardStyles, categoryColors } from '@/theme/tokens';
import { BalanceCardStylePicker } from '@/features/settings/BalanceCardStylePicker';
import { convertAmount, loadExchangeRates, type ExchangeRates } from '@/lib/exchangeRates';
import { ExpensePlanForm, planOccurrences } from '@/features/planner/ExpensePlanForm';

type Tab = TabKey;
type ModalKind = 'transaction' | 'budget' | 'category' | 'plan' | 'cardStyle' | null;

function money(amount: number, currency: string, compact = false, language: Language = 'en') {
  const digits = currency === 'LBP' ? 0 : 2;
  try {
    return new Intl.NumberFormat(language === 'ar' ? 'ar' : 'en-US', { style: 'currency', currency, maximumFractionDigits: digits, notation: compact && Math.abs(amount) >= 10000 ? 'compact' : 'standard' }).format(amount);
  } catch {
    return `${currencySymbols[currency] ?? '$'}${amount.toFixed(digits)}`;
  }
}

function safeConvert(amount: number, source: string, target: string, rates: ExchangeRates | null) {
  try { return convertAmount(amount, source, target, rates); }
  catch { return amount; }
}

function monthLabel(offset: number, language: Language) {
  const date = new Date();
  date.setMonth(date.getMonth() + offset);
  return date.toLocaleDateString(language === 'ar' ? 'ar' : 'en-US', { month: 'long', year: 'numeric' });
}

function isInMonth(iso: string, offset: number) {
  const date = new Date();
  date.setMonth(date.getMonth() + offset);
  const target = new Date(iso);
  return target.getMonth() === date.getMonth() && target.getFullYear() === date.getFullYear();
}

function PocketwiseContent() {
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();
  const { colors: T, styles, t, isRTL, language, balanceCardStyle, setBalanceCardStyle } = useAppPreferences();
  const formatMoney = (amount: number, compact = false) => money(amount, currency, compact, language);
  const activeCard = balanceCardStyles[balanceCardStyle];
  const cardForeground = activeCard.text ?? T.onPanel;
  const cardMuted = activeCard.muted ?? T.panelMuted;
  const cardAccent = balanceCardStyle === 'classic' ? T.acid : activeCard.accent;
  const [fontsLoaded] = useFonts({ Geist: require('../../../assets/fonts/Geist-Variable.ttf') });
  const [tab, setTab] = useState<Tab>('Home');
  const [modal, setModal] = useState<ModalKind>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expensePlans, setExpensePlans] = useState<ExpensePlan[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null);
  const [onboardingStep, setOnboardingStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [onboardingReady, setOnboardingReady] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [reminderOn, setReminderOn] = useState(false);
  const [reminderHour, setReminderHour] = useState(20);
  const [billReminderOn, setBillReminderOn] = useState(false);
  const [billDay, setBillDay] = useState(1);
  const [monthOffset, setMonthOffset] = useState(0);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const screenOpacity = useRef(new Animated.Value(1)).current;

  const switchTab = useCallback((next: Tab) => {
    if (next === tab) return;
    screenOpacity.stopAnimation();
    screenOpacity.setValue(0.97);
    setTab(next);
    Animated.timing(screenOpacity, { toValue: 1, duration: 90, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [screenOpacity, tab]);

  const reload = useCallback(async () => {
    const [tx, b, c, plans, currencyPref, reminderPref, hourPref, billPref, dayPref, onboardingPref] = await Promise.all([
      readTransactions(db), readBudgets(db), readCategories(db), readExpensePlans(db), getPreference(db, 'currency', 'USD'),
      getPreference(db, 'dailyReminder', 'false'), getPreference(db, 'reminderHour', '20'),
      getPreference(db, 'billReminder', 'false'), getPreference(db, 'billDay', '1'), getPreference(db, 'onboardingComplete', ''),
    ]);
    setTransactions(tx);
    setBudgets(b);
    setCategories(c);
    setExpensePlans(plans);
    setCurrency(currencyPref);
    setReminderOn(reminderPref === 'true');
    setReminderHour(Number(hourPref) || 20);
    setBillReminderOn(billPref === 'true');
    setBillDay(Number(dayPref) || 1);
    const hasExistingEntries = tx.length > 0;
    const onboardingComplete = onboardingPref === 'true' || hasExistingEntries;
    setOnboardingStep(onboardingComplete ? 4 : 0);
    if (hasExistingEntries && onboardingPref !== 'true') await setPreference(db, 'onboardingComplete', 'true');
    setOnboardingReady(true);
    void loadExchangeRates(db).then(setExchangeRates).catch(() => undefined);
  }, [db]);

  useEffect(() => { void reload(); }, [reload]);

  const displayTransactions = useMemo(() => transactions.map((tx) => ({ ...tx, amount: safeConvert(tx.amount, tx.currencyCode, currency, exchangeRates) })), [transactions, currency, exchangeRates]);
  const displayBudgets = useMemo(() => budgets.map((budget) => ({ ...budget, limit: safeConvert(budget.limit, budget.currencyCode, currency, exchangeRates) })), [budgets, currency, exchangeRates]);
  const inMonth = useMemo(() => displayTransactions.filter((tx) => isInMonth(tx.date, monthOffset)), [displayTransactions, monthOffset]);
  const filteredTransactions = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    if (!query) return inMonth;
    return inMonth.filter((tx) => `${tx.title} ${tx.category} ${tx.note}`.toLowerCase().includes(query));
  }, [deferredSearch, inMonth]);
  const { income, expense, balance } = useMemo(() => {
    let income = 0;
    let expense = 0;
    let balance = 0;
    for (const tx of displayTransactions) balance += tx.kind === 'income' ? tx.amount : -tx.amount;
    for (const tx of inMonth) {
      if (tx.kind === 'income') income += tx.amount;
      else expense += tx.amount;
    }
    return { income, expense, balance };
  }, [inMonth, displayTransactions]);
  const spending = useMemo(() => inMonth.filter((tx) => tx.kind === 'expense').reduce<Record<string, number>>((result, tx) => {
    result[tx.category] = (result[tx.category] ?? 0) + tx.amount;
    return result;
  }, {}), [inMonth]);
  const insightTotals = useMemo(() => {
    const now = new Date();
    const selected = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const previous = new Date(selected.getFullYear(), selected.getMonth() - 1, 1);
    let previousExpense = 0;
    for (const tx of displayTransactions) {
      if (tx.kind !== 'expense') continue;
      const date = new Date(tx.date);
      if (date.getFullYear() === previous.getFullYear() && date.getMonth() === previous.getMonth()) previousExpense += tx.amount;
    }
    const elapsed = monthOffset === 0 ? now.getDate() : new Date(selected.getFullYear(), selected.getMonth() + 1, 0).getDate();
    const days = new Date(selected.getFullYear(), selected.getMonth() + 1, 0).getDate();
    const topCategory = Object.entries(spending).sort((left, right) => right[1] - left[1])[0];
    return { previousExpense, elapsed, days, topCategory };
  }, [monthOffset, spending, displayTransactions]);
  const dailyAverage = insightTotals.elapsed ? expense / insightTotals.elapsed : 0;
  const monthProjection = monthOffset === 0 ? dailyAverage * insightTotals.days : expense;
  const spendChange = insightTotals.previousExpense > 0 ? Math.round(((expense - insightTotals.previousExpense) / insightTotals.previousExpense) * 100) : null;

  const dailyExpense = useMemo(() => {
    const totals = new Map<string, number>();
    for (const tx of inMonth) {
      if (tx.kind !== 'expense') continue;
      const key = new Date(tx.date).toDateString();
      totals.set(key, (totals.get(key) ?? 0) + tx.amount);
    }
    return totals;
  }, [inMonth]);
  const chartWeek = useMemo(() => {
    const monthDate = new Date();
    monthDate.setMonth(monthDate.getMonth() + monthOffset);
    const endDay = monthOffset === 0 ? new Date().getDate() : new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
    const startDay = Math.max(1, endDay - 6);
    return Array.from({ length: endDay - startDay + 1 }, (_, index) => {
      const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), startDay + index);
      const total = dailyExpense.get(date.toDateString()) ?? 0;
      return { day: date.toLocaleDateString(language === 'ar' ? 'ar' : 'en-US', { weekday: 'short' }).slice(0, 1), total };
    });
  }, [dailyExpense, language, monthOffset]);
  const chartMax = Math.max(...chartWeek.map((entry) => entry.total), 1);

  const handleSaveTransaction = async (data: TransactionDraft) => {
    let reminderId: string | null = null;
    try {
      if (data.reminderAt) reminderId = await scheduleExpenseReminder({ title: data.title, category: translateCategory(language, data.category), date: data.reminderAt, language });
      await addTransaction(db, { ...data, currencyCode: currency, reminderAt: data.reminderAt?.toISOString() ?? null, reminderId, date: new Date().toISOString() });
    } catch (error) {
      await cancelExpenseReminder(reminderId);
      Alert.alert(t('notificationsUnavailable'), error instanceof Error ? error.message : t('notificationsUnavailable'));
      return;
    }
    setModal(null);
    void readTransactions(db).then(setTransactions);
    if (onboardingStep === 1 && data.kind === 'income') setOnboardingStep(2);
    if (onboardingStep === 2 && data.kind === 'expense') setOnboardingStep(3);
    if (data.kind === 'expense') {
      const budget = displayBudgets.find((item) => item.category === data.category);
      const priorSpend = spending[data.category] ?? 0;
      const total = priorSpend + data.amount;
      if (budget && total >= budget.limit && priorSpend < budget.limit) {
        const { scheduleBudgetAlert } = await import('@/lib/reminders');
        await scheduleBudgetAlert(data.category, total).catch(() => undefined);
      }
    }
  };

  const handleSaveBudget = async (category: string, limit: number) => {
    const meta = categories.find((item) => item.name === category);
    if (!meta) return;
    await saveBudget(db, category, limit, meta.emoji, meta.color, currency);
    setModal(null);
    void readBudgets(db).then(setBudgets);
  };

  const handleCreateCategory = async (category: Omit<Category, 'id' | 'custom'>) => {
    if (categories.some((item) => item.kind === category.kind && item.name.trim().toLowerCase() === category.name.trim().toLowerCase())) {
      Alert.alert(t('addCategory'), t('categoryExists'));
      return;
    }
    try {
      await createCategory(db, category);
      setCategories(await readCategories(db));
      setModal(null);
    } catch {
      Alert.alert(t('addCategory'), t('categoryError'));
    }
  };

  const toggleReminder = async (enabled: boolean) => {
    if (enabled) {
      try { await enableDailyReminder(reminderHour); await setPreference(db, 'dailyReminder', 'true'); setReminderOn(true); }
      catch (error) { Alert.alert(t('notificationsUnavailable'), error instanceof Error ? error.message : t('notificationsUnavailable')); }
    } else { await disableDailyReminder(); await setPreference(db, 'dailyReminder', 'false'); setReminderOn(false); }
  };
  const changeReminderHour = async (hour: number) => {
    setReminderHour(hour);
    await setPreference(db, 'reminderHour', String(hour));
    if (reminderOn) await enableDailyReminder(hour).catch(() => undefined);
    if (billReminderOn) await enableBillReminder(billDay, hour).catch(() => undefined);
  };
  const toggleBillReminder = async (enabled: boolean) => {
    if (enabled) {
      try { await enableBillReminder(billDay, reminderHour); await setPreference(db, 'billReminder', 'true'); setBillReminderOn(true); }
      catch (error) { Alert.alert(t('notificationsUnavailable'), error instanceof Error ? error.message : t('notificationsUnavailable')); }
    } else { await disableBillReminder(); await setPreference(db, 'billReminder', 'false'); setBillReminderOn(false); }
  };
  const changeBillDay = async (day: number) => {
    setBillDay(day);
    await setPreference(db, 'billDay', String(day));
    if (billReminderOn) await enableBillReminder(day, reminderHour).catch(() => undefined);
  };
  const changeCurrency = async (value: string) => {
    if (value === currency) return;
    try {
      const rates = exchangeRates ?? await loadExchangeRates(db);
      convertAmount(1, currency, value, rates);
      setExchangeRates(rates);
      setCurrency(value);
      await setPreference(db, 'currency', value);
    } catch {
      Alert.alert(t('conversionUnavailable'), t('conversionUnavailableBody'));
    }
  };
  const handleCreateExpensePlan = async (plan: Omit<ExpensePlan, 'id'>) => {
    await createExpensePlan(db, plan);
    setExpensePlans(await readExpensePlans(db));
    setModal(null);
  };
  const deleteExpensePlan = (plan: ExpensePlan) => Alert.alert(t('deletePlan'), t('deletePlanConfirm', { title: plan.title }), [
    { text: t('cancel'), style: 'cancel' },
    { text: t('delete'), style: 'destructive', onPress: () => { void removeExpensePlan(db, plan.id).then(() => readExpensePlans(db)).then(setExpensePlans); } },
  ]);
  const deleteTx = (tx: Transaction) => Alert.alert(t('removeTransaction'), t('deleteTransaction', { title: tx.title }), [
    { text: t('keep'), style: 'cancel' },
    { text: t('delete'), style: 'destructive', onPress: () => { void cancelExpenseReminder(tx.reminderId).then(() => removeTransaction(db, tx.id)).then(() => readTransactions(db)).then(setTransactions); } },
  ]);

  const addAction = () => setModal('transaction');
  const finishOnboarding = async () => {
    await setPreference(db, 'onboardingComplete', 'true');
    setOnboardingStep(4);
  };
  const renderTransaction = (tx: Transaction) => {
    const metadata = categories.find((category) => category.name === tx.category);
    const color = metadata?.color ?? (tx.kind === 'income' ? T.green : T.blue);
    const glyph = transactionIcon(metadata, tx.kind);
    return (
      <Tactile key={tx.id} onLongPress={() => deleteTx(tx)} style={styles.txTactile} accessibilityLabel={`${tx.title}, ${formatMoney(tx.amount)}`}>
        <View style={styles.txRow}>
          <View style={[styles.txGlyph, { backgroundColor: color }]}><Glyph name={glyph} size={17} color={tx.kind === 'income' ? T.ink : T.white} /></View>
          <View style={styles.txCopy}><Text numberOfLines={1} style={styles.txName}>{tx.title}</Text><Text style={styles.txMeta}>{translateCategory(language, tx.category)}  /  {new Date(tx.date).toLocaleDateString(language === 'ar' ? 'ar' : 'en-US', { month: 'short', day: 'numeric' })}</Text></View>
          <Text style={[styles.txMoney, tx.kind === 'income' && styles.incomeText]}>{tx.kind === 'income' ? '+' : '−'}{formatMoney(tx.amount)}</Text>
        </View>
      </Tactile>
    );
  };

  const renderBudget = (budget: Budget, index: number) => {
    const used = spending[budget.category] ?? 0;
    const ratio = budget.limit <= 0 ? 0 : Math.min(1, used / budget.limit);
    const color = categories.find((category) => category.name === budget.category)?.color ?? budget.color ?? T.blue;
    return (
      <View key={budget.id} style={[styles.budgetItem, index > 0 && styles.rowDivider]}>
        <View style={styles.budgetHeading}><View style={styles.budgetNameBlock}><View style={[styles.budgetMarker, { backgroundColor: color }]} /><Text style={styles.budgetName}>{translateCategory(language, budget.category)}</Text></View><Text style={styles.budgetFigures}>{formatMoney(used)} <Text style={styles.budgetOf}>/ {formatMoney(budget.limit)}</Text></Text></View>
        <View style={styles.track}><View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: used > budget.limit ? T.coral : color }]} /></View>
        <Text style={styles.budgetRemaining}>{used >= budget.limit ? t('limitReached') : t('remaining', { amount: formatMoney(Math.max(0, budget.limit - used)) })}</Text>
      </View>
    );
  };

  const renderExpensePlan = (plan: ExpensePlan, index: number) => {
    const planAmount = safeConvert(plan.amount, plan.currencyCode, currency, exchangeRates);
    const total = planAmount * planOccurrences(plan);
    const tripSpent = plan.kind === 'trip' ? displayTransactions.filter((tx) => tx.kind === 'expense' && tx.planId === plan.id).reduce((sum, tx) => sum + tx.amount, 0) : 0;
    const ratio = plan.kind === 'trip' && total > 0 ? Math.min(1, tripSpent / total) : 0;
    return <Tactile key={plan.id} onLongPress={() => deleteExpensePlan(plan)} style={styles.txTactile} accessibilityLabel={plan.title}>
      <View style={styles.planRow}>
        <View style={styles.planMarker}><Glyph name={plan.kind === 'trip' ? 'airplane-outline' : 'repeat-outline'} size={17} color={T.ink} /></View>
        <View style={styles.planCopy}><Text numberOfLines={1} style={styles.txName}>{plan.title}</Text><Text style={styles.txMeta}>{t(plan.kind === 'once' ? 'once' : plan.kind === 'daily' ? 'daily' : plan.kind === 'weekly' ? 'weekly' : 'trip')}{plan.destination ? ` · ${plan.destination}` : ''}{plan.endDate ? ` · ${plan.startDate} – ${plan.endDate}` : ''}</Text>{plan.kind === 'trip' && <View style={styles.planProgress}><View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: ratio >= 1 ? T.coral : T.green }]} /></View>}</View>
        <View style={styles.planMoney}><Text style={styles.txMoney}>{formatMoney(total, true)}</Text>{plan.kind === 'trip' && <Text style={styles.txMeta}>{formatMoney(tripSpent, true)} / {t('spent')}</Text>}</View>
      </View>
    </Tactile>;
  };

  const prevMonth = () => setMonthOffset((current) => current - 1);
  const nextMonth = () => setMonthOffset((current) => Math.min(0, current + 1));
  const monthControl = <MonthRail month={monthLabel(monthOffset, language)} onPrevious={prevMonth} onNext={nextMonth} canGoNext={monthOffset < 0} />;

  const home = () => (
    <>
      <ScreenTop onSettings={() => switchTab('Settings')} />
      <View style={styles.heroHeading}><Text style={styles.pageTitle}>{t('overview')}</Text></View>
      {monthControl}
      <View style={[styles.balancePanel, { backgroundColor: activeCard.panel ?? T.panel }]}>
        {balanceCardStyle === 'visa' && <View pointerEvents="none" style={styles.visaCardBands}><View style={styles.visaCardBand} /><View style={styles.visaCardBand} /><View style={styles.visaCardBand} /></View>}
        {balanceCardStyle === 'mastercard' && <View pointerEvents="none" style={styles.mastercardCircles}><View style={[styles.mastercardCircle, { backgroundColor: '#F05A43' }]} /><View style={[styles.mastercardCircle, { backgroundColor: '#F5A623', marginLeft: -17 }]} /></View>}
        {balanceCardStyle === 'amex' && <View pointerEvents="none" style={styles.amexCardGrid}>{Array.from({ length: 12 }, (_, index) => <View key={index} style={styles.amexCardGridCell} />)}</View>}
        <View style={styles.balanceTopline}><Text style={[styles.balanceLabel, { color: cardMuted }]}>{t('balance')}</Text><Text style={[styles.balanceBrand, { color: cardForeground }]}>{activeCard.mark}</Text></View>
        <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.balanceValue, { color: cardForeground }]}>{formatMoney(balance)}</Text>
        <View style={[styles.balanceBottom, { borderTopColor: balanceCardStyle === 'classic' ? T.darkLine : 'rgba(255,255,255,0.25)' }]}>
          <View><Text style={[styles.darkMetricLabel, { color: cardMuted }]}>{t('income')}</Text><Text style={[styles.darkMetricValue, { color: cardForeground }]}>+ {formatMoney(income, true)}</Text></View>
          <View style={styles.balanceRule} />
          <View><Text style={[styles.darkMetricLabel, { color: cardMuted }]}>{t('outgoing')}</Text><Text style={[styles.darkMetricValue, { color: cardForeground }]}>− {formatMoney(expense, true)}</Text></View>
          <Tactile onPress={() => setModal('cardStyle')} style={[styles.balanceSignal, { backgroundColor: cardAccent }]} accessibilityLabel={t('changeCardDesign')}><Glyph name="color-palette-outline" size={18} color={T.ink} /></Tactile>
        </View>
      </View>

      <SectionHeading title={t('spending')} action={t('insights')} onAction={() => switchTab('Insights')} />
      <View style={styles.spendingPanel}>
        <View style={styles.spendingHeader}><View><Text style={styles.panelOverline}>{t('netThisMonth')}</Text><Text style={styles.netValue}>{formatMoney(income - expense)}</Text></View><View style={styles.ratioMark}><Text style={styles.ratioNumber}>{income ? Math.round((expense / income) * 100) : 0}%</Text><Text style={styles.ratioCaption}>{t('ofIncome')}</Text></View></View>
        <View style={styles.chartFrame}>
          <View style={styles.chartRules}><View style={styles.chartRule} /><View style={styles.chartRule} /><View style={styles.chartRule} /></View>
          <View style={styles.chartColumns}>{chartWeek.map((entry, index) => {
            const height = Math.max(5, Math.round((entry.total / chartMax) * 82));
            return <View key={`${entry.day}-${index}`} style={styles.barSlot}><View style={styles.barBase}><Bar height={height} color={index === chartWeek.length - 1 ? T.ink : T.chart} /></View><Text style={styles.chartDay}>{entry.day}</Text></View>;
          })}</View>
        </View>
        <View style={styles.chartFoot}><Text style={styles.chartFootText}>{t('dailySpend')}</Text></View>
      </View>

      <SectionHeading title={t('latestEntries')} action={t('fullLedger')} onAction={() => switchTab('Activity')} />
      <View style={styles.ledger}>{inMonth.slice(0, 4).map(renderTransaction)}{!inMonth.length && <EmptyLedger title={t('noEntries')} body={t('addFirstEntry')} onAdd={addAction} />}</View>

      <SectionHeading title={t('budgetPlan')} action={t('allBudgets')} onAction={() => switchTab('Budgets')} />
      <View style={styles.budgetLedger}>{displayBudgets.slice(0, 3).map(renderBudget)}{!displayBudgets.length && <EmptyLedger title={t('setLimit')} body={t('monthlyLimit')} onAdd={() => setModal('budget')} />}</View>
    </>
  );

  const activityHeader = (
    <>
      <ScreenTop onSettings={() => switchTab('Settings')} />
      <View style={styles.pageHeader}><Text style={styles.pageTitle}>{t('ledger')}</Text></View>
      {monthControl}
      <View style={styles.searchWrap}><Glyph name="search-outline" size={17} color={T.muted} /><TextInput value={search} onChangeText={setSearch} placeholder={t('searchLedger')} placeholderTextColor={T.muted} style={styles.searchInput} /></View>
      <View style={styles.ledgerSummary}><View><Text style={styles.summaryLabel}>{t('in')}</Text><Text style={[styles.summaryValue, { color: T.green }]}>{formatMoney(income, true)}</Text></View><View style={styles.summaryRule} /><View><Text style={styles.summaryLabel}>{t('out')}</Text><Text style={styles.summaryValue}>{formatMoney(expense, true)}</Text></View><View style={styles.summaryRule} /><View><Text style={styles.summaryLabel}>{t('net')}</Text><Text style={[styles.summaryValue, { color: income >= expense ? T.green : T.coral }]}>{formatMoney(income - expense, true)}</Text></View></View>
      <SectionHeading title={t('entries', { count: filteredTransactions.length })} action={`＋ ${t('add')}`} onAction={addAction} />
    </>
  );

  const insightCategories = categories.filter((category) => category.kind === 'expense' && spending[category.name]).sort((a, b) => (spending[b.name] ?? 0) - (spending[a.name] ?? 0));
  const insights = () => (
    <>
      <ScreenTop onSettings={() => switchTab('Settings')} />
      <View style={styles.pageHeader}><Text style={styles.pageTitle}>{t('insights')}</Text></View>
      {monthControl}
      <View style={styles.insightPanel}>
        <Text style={styles.panelOverline}>{t('netCashFlow')}</Text><Text style={styles.insightValue}>{formatMoney(income - expense)}</Text>
        <View style={styles.insightChart}>{chartWeek.map((entry, index) => {
          const height = Math.max(5, Math.round((entry.total / chartMax) * 104));
          return <View key={`${entry.day}-${index}`} style={styles.insightBarSlot}><View style={styles.insightBarBase}><Bar height={height} color={index === chartWeek.length - 1 ? T.acid : T.chart} /></View><Text style={styles.insightDay}>{entry.day}</Text></View>;
        })}</View>
        <View style={styles.chartFoot}><Text style={styles.darkChartFoot}>{t('dailySpend')}</Text></View>
      </View>
      <View style={styles.insightMetrics}>
        <View style={styles.insightMetric}><Text style={styles.insightMetricLabel}>{t('comparedWithLastMonth')}</Text><Text style={styles.insightMetricValue}>{spendChange === null ? t('noComparison') : spendChange === 0 ? '0%' : t(spendChange > 0 ? 'compareUp' : 'compareDown', { value: Math.abs(spendChange) })}</Text></View>
        <View style={styles.insightMetric}><Text style={styles.insightMetricLabel}>{t('avgPerDay')}</Text><Text style={styles.insightMetricValue}>{formatMoney(dailyAverage)}</Text></View>
        <View style={styles.insightMetric}><Text style={styles.insightMetricLabel}>{t('projectedMonth')}</Text><Text style={styles.insightMetricValue}>{formatMoney(monthProjection)}</Text></View>
        <View style={styles.insightMetric}><Text style={styles.insightMetricLabel}>{t('topCategory')}</Text><Text style={styles.insightMetricValue} numberOfLines={1}>{insightTotals.topCategory ? translateCategory(language, insightTotals.topCategory[0]) : t('noCategorySpend')}</Text></View>
      </View>
      <SectionHeading title={t('whereItWent')} />
      <View style={styles.categoryLedger}>
        {insightCategories.map((category, index) => {
          const value = spending[category.name] ?? 0;
          const share = expense ? Math.round(value / expense * 100) : 0;
          const color = category.color ?? categoryColors[category.name] ?? T.blue;
          return <View key={category.name} style={[styles.categoryLine, index > 0 && styles.rowDivider]}>
            <View style={[styles.categoryGlyph, { backgroundColor: color }]}><Glyph name={transactionIcon(category, 'expense')} size={15} color={T.white} /></View>
            <View style={styles.categoryLineMain}><View style={styles.categoryLineHead}><Text style={styles.categoryName}>{translateCategory(language, category.name)}</Text><Text style={styles.categoryAmount}>{formatMoney(value)}</Text></View><View style={styles.categoryProgressRow}><View style={styles.track}><View style={[styles.fill, { width: `${Math.min(100, share)}%`, backgroundColor: color }]} /></View><Text style={styles.share}>{share}%</Text></View></View>
          </View>;
        })}
        {!insightCategories.length && <EmptyLedger title={t('noPatterns')} body={t('addExpenses')} onAdd={addAction} />}
      </View>
    </>
  );

  const planned = displayBudgets.reduce((sum, budget) => sum + budget.limit, 0);
  const budgetsPage = () => (
    <>
      <ScreenTop onSettings={() => switchTab('Settings')} />
      <View style={styles.pageHeader}><Text style={styles.pageTitle}>{t('budgets')}</Text></View>
      {monthControl}
      <View style={styles.budgetOverview}><View><Text style={styles.panelOverline}>{t('plannedThisMonth')}</Text><Text style={styles.budgetOverviewAmount}>{formatMoney(planned)}</Text></View><View style={styles.overviewDivider} /><View><Text style={styles.panelOverline}>{t('usedSoFar')}</Text><Text style={styles.budgetOverviewUsed}>{formatMoney(expense)}</Text></View></View>
      <SectionHeading title={t('expensePlans')} action={`＋ ${t('newPlan')}`} onAction={() => setModal('plan')} />
      <View style={styles.budgetLedger}>{expensePlans.map(renderExpensePlan)}{!expensePlans.length && <EmptyLedger title={t('noExpensePlans')} body={t('createExpensePlan')} onAdd={() => setModal('plan')} />}</View>
      <SectionHeading title={t('categoryLimits')} action={`＋ ${t('newLimit')}`} onAction={() => setModal('budget')} />
      <View style={styles.budgetLedger}>{displayBudgets.map(renderBudget)}{!displayBudgets.length && <EmptyLedger title={t('setLimit')} body={t('monthlyLimit')} onAdd={() => setModal('budget')} />}</View>
      <Tactile onPress={() => setModal('budget')} style={styles.addBudgetTactile}><View style={styles.addBudgetButton}><Glyph name="add" size={18} color={T.ink} /><Text style={styles.addBudgetText}>{t('newLimit')}</Text></View></Tactile>
    </>
  );

  const settings = () => <SettingsScreen categories={categories} currency={currency} reminderOn={reminderOn} reminderHour={reminderHour} billReminderOn={billReminderOn} billDay={billDay} onBack={() => switchTab('Home')} onAddCategory={() => setModal('category')} onCurrency={(value) => void changeCurrency(value)} onDailyReminder={(value) => void toggleReminder(value)} onReminderHour={(value) => void changeReminderHour(value)} onBillReminder={(value) => void toggleBillReminder(value)} onBillDay={(value) => void changeBillDay(value)} />;

  if (!fontsLoaded || !onboardingReady) return <SafeAreaView style={styles.safe} />;
  if (onboardingStep < 4) return <SafeAreaView style={[styles.safe, { direction: isRTL ? 'rtl' : 'ltr' }]} edges={['top', 'bottom']}>
    <OnboardingScreen step={onboardingStep as 0 | 1 | 2 | 3} currency={currency} onCurrency={(value) => void changeCurrency(value)} onContinue={() => setOnboardingStep(1)} onIncome={() => setModal('transaction')} onExpense={() => setModal('transaction')} onFinish={() => void finishOnboarding()} onSkip={() => void finishOnboarding()} />
    <Modal visible={modal === 'transaction'} transparent animationType="fade" onRequestClose={() => setModal(null)}>
      <Pressable style={styles.modalScrim} onPress={() => setModal(null)} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalDock}><View style={[styles.sheet, styles.sheetTall, { direction: isRTL ? 'rtl' : 'ltr', paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.sheetHandle} /><View style={styles.sheetHeader}><Text style={styles.sheetTitle}>{t('newEntry')}</Text><Pressable onPress={() => setModal(null)} style={styles.closeButton}><Glyph name="close" size={18} color={T.ink} /></Pressable></View>
        <TransactionForm key={onboardingStep} currency={currency} categories={categories} plans={expensePlans.filter((plan) => plan.kind === 'trip')} initialKind={onboardingStep === 1 ? 'income' : 'expense'} onSave={handleSaveTransaction} onCancel={() => setModal(null)} />
      </View></KeyboardAvoidingView>
    </Modal>
  </SafeAreaView>;
  const body = tab === 'Home' ? home() : tab === 'Activity' ? null : tab === 'Insights' ? insights() : tab === 'Budgets' ? budgetsPage() : settings();

  return (
    <SafeAreaView style={[styles.safe, { direction: isRTL ? 'rtl' : 'ltr' }]} edges={['top', 'bottom']}>
      <View style={styles.appCanvas}>
        <Animated.View style={[styles.screenContent, { opacity: screenOpacity }]}>
        {tab === 'Activity' ? (
          <FlatList
            contentContainerStyle={[styles.pageContent, { direction: isRTL ? 'rtl' : 'ltr' }]}
            data={filteredTransactions}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => renderTransaction(item)}
            ListHeaderComponent={activityHeader}
            ListEmptyComponent={<EmptyLedger title={search ? t('noMatches') : t('noEntries')} body={search ? t('tryAnotherSearch') : t('addFirstEntry')} onAdd={search ? undefined : addAction} />}
            ListFooterComponent={<Text style={styles.longPressHint}>{t('holdToDelete')}</Text>}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            initialNumToRender={12}
            maxToRenderPerBatch={8}
            windowSize={7}
            removeClippedSubviews
          />
        ) : <ScrollView contentContainerStyle={[styles.pageContent, { direction: isRTL ? 'rtl' : 'ltr' }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">{body}</ScrollView>}
        </Animated.View>
        <View style={styles.navDock}>
          {(['Home', 'Activity'] as const).map((item) => <NavItem key={item} item={item} active={tab === item} onPress={() => switchTab(item)} />)}
          <Tactile onPress={addAction} style={styles.navAddTactile} accessibilityLabel="Add transaction"><View style={styles.navAdd}><Glyph name="add" size={24} color={T.ink} /></View></Tactile>
          {(['Insights', 'Budgets'] as const).map((item) => <NavItem key={item} item={item} active={tab === item} onPress={() => switchTab(item)} />)}
        </View>
        <Modal visible={!!modal} transparent animationType="fade" onRequestClose={() => setModal(null)}>
          <Pressable style={styles.modalScrim} onPress={() => setModal(null)} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalDock}>
            <View style={[styles.sheet, (modal === 'transaction' || modal === 'plan' || modal === 'budget') && styles.sheetTall, { paddingBottom: Math.max(insets.bottom, 12) }]}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeader}><Text style={styles.sheetTitle}>{modal === 'budget' ? t('setLimit') : modal === 'category' ? t('addCategory') : modal === 'plan' ? t('newPlan') : modal === 'cardStyle' ? t('cardDesign') : t('newEntry')}</Text><Pressable onPress={() => setModal(null)} style={styles.closeButton}><Glyph name="close" size={18} color={T.ink} /></Pressable></View>
              {modal === 'transaction' ? <TransactionForm currency={currency} categories={categories} plans={expensePlans.filter((plan) => plan.kind === 'trip')} onSave={handleSaveTransaction} onCancel={() => setModal(null)} /> : modal === 'budget' ? <BudgetForm budgets={displayBudgets} categories={categories.filter((item) => item.kind === 'expense')} currency={currency} onSave={handleSaveBudget} onCancel={() => setModal(null)} /> : modal === 'plan' ? <ExpensePlanForm categories={categories.filter((item) => item.kind === 'expense')} currency={currency} onSave={handleCreateExpensePlan} onCancel={() => setModal(null)} /> : modal === 'cardStyle' ? <BalanceCardStylePicker selected={balanceCardStyle} onSelect={(value) => { setBalanceCardStyle(value); setModal(null); }} /> : <CategoryForm onSave={handleCreateCategory} onCancel={() => setModal(null)} />}
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

export default function PocketwiseApp() {
  return <PocketwiseContent />;
}

