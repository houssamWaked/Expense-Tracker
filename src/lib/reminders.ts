import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const DAILY_ID = 'daily-money-check-in';
const BILL_ID = 'monthly-bill-check-in';

export async function enableDailyReminder(hour: number) {
  const current = await Notifications.getPermissionsAsync();
  let granted = current.granted;
  if (!granted) granted = (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) throw new Error('Notifications are disabled in Android settings.');
  await Notifications.cancelScheduledNotificationAsync(DAILY_ID).catch(() => undefined);
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('money-nudges', {
      name: 'Money reminders',
      description: 'Daily budget check-ins and bill reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 180, 100, 180],
      lightColor: '#D8F36A',
    });
  }
  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_ID,
    content: {
      title: 'A quick money check-in 💜',
      body: 'Log today’s spending and keep your budget on track.',
      sound: true,
      data: { type: 'daily-check-in' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: 0,
      channelId: 'money-nudges',
    },
  });
}

export async function disableDailyReminder() {
  await Notifications.cancelScheduledNotificationAsync(DAILY_ID).catch(() => undefined);
}

export async function enableBillReminder(day: number, hour: number) {
  const current = await Notifications.getPermissionsAsync();
  let granted = current.granted;
  if (!granted) granted = (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) throw new Error('Notifications are disabled in Android settings.');
  await Notifications.cancelScheduledNotificationAsync(BILL_ID).catch(() => undefined);
  await Notifications.scheduleNotificationAsync({
    identifier: BILL_ID,
    content: {
      title: 'Bills check-in 🧾',
      body: 'Take a moment to review upcoming bills and recurring payments.',
      sound: true,
      data: { type: 'monthly-bills-check-in' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
      day,
      hour,
      minute: 0,
      channelId: 'money-nudges',
    },
  });
}

export async function disableBillReminder() {
  await Notifications.cancelScheduledNotificationAsync(BILL_ID).catch(() => undefined);
}

export async function scheduleBudgetAlert(category: string, amount: number) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${category} budget reached`,
      body: `You’ve logged ${amount.toFixed(2)} in this category. Take a look at your spending.`,
      sound: true,
      data: { type: 'budget-alert', category },
    },
    trigger: null,
  });
}

export async function scheduleExpenseReminder(input: {
  title: string;
  category: string;
  date: Date;
  language: 'en' | 'ar';
}) {
  const permission = await Notifications.getPermissionsAsync();
  const granted = permission.granted || (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) throw new Error(input.language === 'ar' ? 'الإشعارات غير مفعّلة.' : 'Notifications are disabled.');
  if (input.date.getTime() <= Date.now()) throw new Error(input.language === 'ar' ? 'اختر وقتاً في المستقبل.' : 'Choose a future time.');
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('money-nudges', {
      name: input.language === 'ar' ? 'تذكيرات المصروفات' : 'Expense reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 180, 100, 180],
      lightColor: '#D8F36A',
    });
  }
  return Notifications.scheduleNotificationAsync({
    content: {
      title: input.language === 'ar' ? `تذكير: ${input.title}` : `Expense reminder: ${input.title}`,
      body: input.language === 'ar' ? `الفئة: ${input.category}` : `Category: ${input.category}`,
      sound: true,
      data: { type: 'expense-reminder', title: input.title, category: input.category },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: input.date, channelId: 'money-nudges' },
  });
}

export async function cancelExpenseReminder(identifier?: string | null) {
  if (identifier) await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => undefined);
}
