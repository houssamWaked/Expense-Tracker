import type { SQLiteDatabase } from 'expo-sqlite';

export type TxType = 'expense' | 'income';
export type Transaction = {
  id: number;
  title: string;
  amount: number;
  kind: TxType;
  category: string;
  date: string;
  note: string;
  currencyCode: string;
  planId?: number | null;
  reminderAt?: string | null;
  reminderId?: string | null;
};
export type Budget = { id: number; category: string; limit: number; emoji: string; color: string; currencyCode: string };
export type ExpensePlanKind = 'once' | 'daily' | 'weekly' | 'trip';
export type ExpensePlan = { id: number; title: string; amount: number; currencyCode: string; category: string; kind: ExpensePlanKind; startDate: string; endDate: string | null; destination: string; note: string };
export type CategoryKind = TxType;
export type Category = { id: number; name: string; kind: CategoryKind; emoji: string; color: string; icon: string; custom: boolean };

export const builtInCategories: Array<Omit<Category, 'id' | 'custom'>> = [
  { name: 'Food & Drinks', kind: 'expense', emoji: '', color: '#D67856', icon: 'restaurant-outline' },
  { name: 'Shopping', kind: 'expense', emoji: '', color: '#897FAD', icon: 'bag-handle-outline' },
  { name: 'Transport', kind: 'expense', emoji: '', color: '#648C87', icon: 'train-outline' },
  { name: 'Home', kind: 'expense', emoji: '', color: '#728999', icon: 'home-outline' },
  { name: 'Health', kind: 'expense', emoji: '', color: '#A86E79', icon: 'medkit-outline' },
  { name: 'Entertainment', kind: 'expense', emoji: '', color: '#B78F43', icon: 'ticket-outline' },
  { name: 'Travel', kind: 'expense', emoji: '', color: '#5F8A72', icon: 'airplane-outline' },
  { name: 'Bills', kind: 'expense', emoji: '', color: '#737B83', icon: 'receipt-outline' },
  { name: 'Other', kind: 'expense', emoji: '', color: '#90816D', icon: 'ellipsis-horizontal-outline' },
  { name: 'Income', kind: 'income', emoji: '', color: '#4E806C', icon: 'arrow-down-outline' },
  { name: 'Salary', kind: 'income', emoji: '', color: '#4E806C', icon: 'briefcase-outline' },
  { name: 'Freelance', kind: 'income', emoji: '', color: '#648C87', icon: 'laptop-outline' },
  { name: 'Investment', kind: 'income', emoji: '', color: '#897FAD', icon: 'trending-up-outline' },
  { name: 'Gift', kind: 'income', emoji: '', color: '#B78F43', icon: 'gift-outline' },
  { name: 'Other income', kind: 'income', emoji: '', color: '#737B83', icon: 'add-outline' },
];

export async function initializeDatabase(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      kind TEXT NOT NULL CHECK(kind IN ('expense', 'income')),
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL UNIQUE,
      limit_amount REAL NOT NULL,
      emoji TEXT NOT NULL,
      color TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS preferences (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS expense_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      currency_code TEXT NOT NULL,
      category TEXT NOT NULL,
      kind TEXT NOT NULL CHECK(kind IN ('once', 'daily', 'weekly', 'trip')),
      start_date TEXT NOT NULL,
      end_date TEXT,
      destination TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL COLLATE NOCASE,
      kind TEXT NOT NULL CHECK(kind IN ('expense', 'income')),
      emoji TEXT NOT NULL DEFAULT '',
      color TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT 'ellipse-outline',
      custom INTEGER NOT NULL DEFAULT 0,
      UNIQUE(name, kind)
    );
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC, id DESC);
  `);
  const transactionColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(transactions)');
  if (!transactionColumns.some((column) => column.name === 'currency_code')) await db.execAsync('ALTER TABLE transactions ADD COLUMN currency_code TEXT');
  if (!transactionColumns.some((column) => column.name === 'plan_id')) await db.execAsync('ALTER TABLE transactions ADD COLUMN plan_id INTEGER');
  if (!transactionColumns.some((column) => column.name === 'reminder_at')) await db.execAsync('ALTER TABLE transactions ADD COLUMN reminder_at TEXT');
  if (!transactionColumns.some((column) => column.name === 'reminder_id')) await db.execAsync('ALTER TABLE transactions ADD COLUMN reminder_id TEXT');
  const budgetColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(budgets)');
  if (!budgetColumns.some((column) => column.name === 'currency_code')) await db.execAsync('ALTER TABLE budgets ADD COLUMN currency_code TEXT');
  for (const category of builtInCategories) {
    await db.runAsync('INSERT OR IGNORE INTO categories (name, kind, emoji, color, icon, custom) VALUES (?, ?, ?, ?, ?, 0)', category.name, category.kind, category.emoji, category.color, category.icon);
  }
  const cleanupComplete = await getPreference(db, 'removeSeededDemoData', 'false');
  if (cleanupComplete !== 'true') {
    const oldDemoTransactions: Array<[string, number, TxType, string]> = [
      ['Monthly salary', 4500, 'income', 'Income'],
      ['Market & coffee', 340.5, 'expense', 'Food & Drinks'],
      ['Metro card', 160, 'expense', 'Transport'],
      ['New headphones', 189, 'expense', 'Shopping'],
      ['Internet bill', 55, 'expense', 'Bills'],
      ['Sunday brunch', 105.5, 'expense', 'Food & Drinks'],
      ['Rent payment', 450, 'expense', 'Home'],
      ['Weekend trip', 120, 'expense', 'Travel'],
      ['Movie night', 80, 'expense', 'Entertainment'],
    ];
    for (const [title, amount, kind, category] of oldDemoTransactions) {
      await db.runAsync('DELETE FROM transactions WHERE title = ? AND amount = ? AND kind = ? AND category = ? AND note = \'\'', title, amount, kind, category);
    }
    const oldDemoBudgets: Array<[string, number, string, string]> = [
      ['Food & Drinks', 450, '🥑', '#FFAA72'],
      ['Shopping', 350, '🛍️', '#8870FF'],
      ['Transport', 180, '🚕', '#61C7C0'],
      ['Home', 700, '🏠', '#4E97F7'],
    ];
    for (const [category, limit, emoji, color] of oldDemoBudgets) {
      await db.runAsync('DELETE FROM budgets WHERE category = ? AND limit_amount = ? AND emoji = ? AND color = ?', category, limit, emoji, color);
    }
    await setPreference(db, 'removeSeededDemoData', 'true');
  }
  await db.runAsync("INSERT OR IGNORE INTO preferences (key, value) VALUES ('currency', 'USD')");
  const existingCurrency = await getPreference(db, 'currency', 'USD');
  await db.runAsync('UPDATE transactions SET currency_code = ? WHERE currency_code IS NULL OR currency_code = \'\'', existingCurrency);
  await db.runAsync('UPDATE budgets SET currency_code = ? WHERE currency_code IS NULL OR currency_code = \'\'', existingCurrency);
  await db.runAsync("INSERT OR IGNORE INTO preferences (key, value) VALUES ('dailyReminder', 'false')");
  await db.runAsync("INSERT OR IGNORE INTO preferences (key, value) VALUES ('reminderHour', '20')");
  await db.runAsync("INSERT OR IGNORE INTO preferences (key, value) VALUES ('billReminder', 'false')");
  await db.runAsync("INSERT OR IGNORE INTO preferences (key, value) VALUES ('billDay', '1')");
  await db.runAsync("INSERT OR IGNORE INTO preferences (key, value) VALUES ('theme', 'system')");
  await db.runAsync("INSERT OR IGNORE INTO preferences (key, value) VALUES ('language', 'en')");
}

export async function readTransactions(db: SQLiteDatabase) {
  return db.getAllAsync<Transaction>('SELECT id, title, amount, kind, category, date, note, currency_code AS currencyCode, plan_id AS planId, reminder_at AS reminderAt, reminder_id AS reminderId FROM transactions ORDER BY date DESC, id DESC');
}
export async function readBudgets(db: SQLiteDatabase) {
  return db.getAllAsync<Budget>('SELECT id, category, limit_amount AS "limit", emoji, color, currency_code AS currencyCode FROM budgets ORDER BY id');
}
export async function readExpensePlans(db: SQLiteDatabase) {
  return db.getAllAsync<ExpensePlan>('SELECT id, title, amount, currency_code AS currencyCode, category, kind, start_date AS startDate, end_date AS endDate, destination, note FROM expense_plans ORDER BY start_date, id');
}
export async function readCategories(db: SQLiteDatabase, kind?: CategoryKind) {
  const query = 'SELECT id, name, kind, emoji, color, icon, custom FROM categories';
  if (kind) return db.getAllAsync<Category>(`${query} WHERE kind = ? ORDER BY custom, id`, kind);
  return db.getAllAsync<Category>(`${query} ORDER BY kind, custom, id`);
}
export async function createCategory(db: SQLiteDatabase, category: Omit<Category, 'id' | 'custom'>) {
  await db.runAsync('INSERT INTO categories (name, kind, emoji, color, icon, custom) VALUES (?, ?, ?, ?, ?, 1)', category.name.trim(), category.kind, category.emoji, category.color, category.icon);
}
export async function getPreference(db: SQLiteDatabase, key: string, fallback: string) {
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM preferences WHERE key = ?', key);
  return row?.value ?? fallback;
}
export async function setPreference(db: SQLiteDatabase, key: string, value: string) {
  await db.runAsync('INSERT OR REPLACE INTO preferences (key, value) VALUES (?, ?)', key, value);
}
export async function addTransaction(db: SQLiteDatabase, tx: Omit<Transaction, 'id'>) {
  await db.runAsync('INSERT INTO transactions (title, amount, kind, category, date, note, currency_code, plan_id, reminder_at, reminder_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', tx.title, tx.amount, tx.kind, tx.category, tx.date, tx.note, tx.currencyCode, tx.planId ?? null, tx.reminderAt ?? null, tx.reminderId ?? null);
}
export async function removeTransaction(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM transactions WHERE id = ?', id);
}
export async function saveBudget(db: SQLiteDatabase, category: string, limit: number, emoji: string, color: string, currencyCode: string) {
  await db.runAsync('INSERT INTO budgets (category, limit_amount, emoji, color, currency_code) VALUES (?, ?, ?, ?, ?) ON CONFLICT(category) DO UPDATE SET limit_amount = excluded.limit_amount, currency_code = excluded.currency_code', category, limit, emoji, color, currencyCode);
}
export async function createExpensePlan(db: SQLiteDatabase, plan: Omit<ExpensePlan, 'id'>) {
  await db.runAsync('INSERT INTO expense_plans (title, amount, currency_code, category, kind, start_date, end_date, destination, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', plan.title, plan.amount, plan.currencyCode, plan.category, plan.kind, plan.startDate, plan.endDate, plan.destination, plan.note);
}
export async function removeExpensePlan(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM expense_plans WHERE id = ?', id);
}
