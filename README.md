# Pocketwise

Pocketwise is an Android-first personal finance app built with Expo and React Native. It tracks income and expenses locally and provides budgets, spending insights, reminders, and trip planning.

## Features

- Guided first launch for adding income and expenses. New installs start without sample transactions.
- Income and expense entries with custom categories, notes, and optional expense reminders.
- Monthly category limits and actionable spending insights.
- Daily and weekly expense plans, plus trip budgets linked to trip expenses.
- Currency display and conversion across USD, EUR, GBP, AED, LBP, CAD, and AUD. Exchange rates refresh online and are cached for offline display.
- English and Arabic interface, including right-to-left layout.
- System appearance plus Light, Sand, Sage, Dark, Midnight, and Ocean themes.
- Selectable balance card designs.
- SQLite storage on the device; there is no account or cloud sync.

## Development

```bash
npm install
npx expo start
```

## Android release bundle

The production EAS profile is configured to create an Android App Bundle (AAB):

```bash
npx eas-cli build --platform android --profile production
```

The Android application ID is `com.houssamwaked.pocketwise`.
