# Pocketwise

Pocketwise is a personal finance app for recording income and expenses, setting spending limits, and understanding where money goes. It is built with Expo, React Native, and SQLite, with a local-first design and support for English and Arabic.

## What it does

- Record income and expenses with dates, notes, categories, and optional expense reminders.
- Edit ledger entries, search transactions, and remove entries you no longer need.
- Create monthly category budgets and review spending insights.
- Plan one-time, daily, and weekly expenses, or organize spending around a trip.
- Add custom categories for income and expenses.
- View and convert transactions across USD, EUR, GBP, AED, LBP, CAD, and AUD.
- Choose light and dark themes, set the interface language, and select a balance-card style.
- Use Arabic with right-to-left layout support.
- Start with an empty ledger and guided first-run setup rather than sample transactions.

## Run locally

Requirements: Node.js and npm. Install dependencies and start Expo:

```bash
npm install
npm start
```

To launch a specific target:

```bash
npm run android
npm run ios
npm run web
```

Expo Go may not support every native feature used by the app. For device development with native modules, create or use an Expo development build.

## Project layout

```text
src/
  app/              Expo Router entry points
  components/       Shared interface components
  config/           Currency and app configuration
  features/         App screens and feature-specific forms
  i18n/             English and Arabic messages
  lib/              SQLite data access, reminders, and exchange rates
  providers/        App preferences and theme state
  theme/            Theme tokens and shared styles
```

The main application flow is assembled in `src/features/app/PocketwiseApp.tsx`. Feature UI is separated into folders such as `transactions`, `budgets`, `planner`, `settings`, `insights`, and `onboarding`.

## Data and currency rates

Transactions, budgets, categories, plans, and preferences are stored in a SQLite database on the device. Pocketwise does not require an account or provide cloud sync. Expense reminders use local device notifications.

Currency rates are fetched from the [ExchangeRate-API endpoint](https://open.er-api.com/v6/latest/USD) when needed and cached locally for up to 20 hours. Previously cached rates are used when the network is unavailable. Rates are informational and may not match a bank or payment provider's rate.

## Android release

The EAS production profile is configured to create an Android App Bundle (`.aab`). Sign in to Expo, then run:

```bash
npx eas-cli login
npx eas-cli build --platform android --profile production
```

The Android application ID is `com.houssamwaked.pocketwise`. Increase `expo.android.versionCode` in `app.json` before each Play Store release.

## Tech stack

- Expo and React Native
- Expo Router
- Expo SQLite
- Expo Notifications
- TypeScript
