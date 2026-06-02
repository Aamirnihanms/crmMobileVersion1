# luminar-staff CRM Mobile

## Stack

- **Framework**: Expo SDK 54, React 19.1, RN 0.81.5
- **Navigation**: React Navigation (native-stack, bottom-tabs, material-top-tabs) + expo-router typed routes
- **State**: Zustand (auth/chat), TanStack React Query (server state)
- **API**: Axios with interceptors — JWT Bearer from SecureStore, 401 triggers auto-logout, non-GET failures show alert
- **Auth**: expo-secure-store (token + user profile), zustand memory cache with SecureStore fallback
- **Push**: @react-native-firebase/messaging (FCM), foreground notification shown via expo-notifications
- **Path alias**: `@/*` → project root (tsconfig)

## Commands

| Command | Action |
|---------|--------|
| `npm start` | Expo dev server |
| `npm run android` | `expo run:android` (native build) |
| `npm run ios` | `expo run:ios` (native build) |
| `npm run web` | Expo dev server + web |
| `npm run lint` | `expo lint` (eslint-config-expo) |
| `npx tsc --noEmit` | TypeScript check (no script in package.json) |
| `npx expo start --tunnel` | Dev server with tunnel for physical devices |

## Key Architecture

- **Entrypoint**: `index.js` (registers FCM background handler, then `App.tsx`)
- **Auth bootstrap**: `RootNavigator.tsx` — reads SecureStore token, fetches profile, sets `isLoggedIn`. Splash screen with 8s failsafe.
- **API config**: `src/config/api.config.ts` — hardcoded `BASE_URL`, not env-var driven. Toggle comments for production/dev/localhost.
- **Store pattern**: Zustand stores live in `src/store/`; React Query hooks live in `src/queries/`; API calls live in `src/api/`.
- **Theme**: `src/theme/` exports `colors`, `spacing`, `typography` as flat objects (use `colors.primary`, `spacing.md`, `typography.title`).
- **Plugins**: `plugins/withModularHeaders.js` — custom Expo config plugin to add `use_modular_headers!` to iOS Podfile (required by @react-native-firebase).

## Known Issues (from PROJECT_DEBUG_REPORT.md)

- `src/components/students/StudentEnrollmentsSection.tsx:13-18` — hook-order bug (early return before `useNavigation()`)
- `src/api/payments.api.ts:138` — receipt endpoint missing leading `/`
- `src/api/enrollment.api.ts:153-155` — unverified assumed endpoint
- `src/screens/dashboard/DashboardScreen.tsx:718-719` — superadmin double-fetches dashboard
- Unread count API storm pattern across chat-related files
- `ConvertLeadModal` fetches courses/batches even when hidden
- `src/queries/masters/batches.query.ts` — no `enabled` guard (`!!courseId`)
- Chat cache key mismatch between `chat.query.ts:158` and `ChatThreadScreen.tsx:1077`
- Follow-up create/update importance enums inconsistent
- Lint: 5 errors, 38 warnings (including unescaped entities, hook rule violations)

## Conventions

- **Editor**: VS Code with `expo.vscode-expo-tools`. Settings enforce `source.fixAll` + `source.organizeImports` on save.
- **`.gitignore`** excludes `.expo/`, `dist/`, `web-build/`, `expo-env.d.ts`, `/ios`, `/android`, `.env`, `.env*.local`
- **EAS build**: 3 profiles — `development` (dev client, APK), `preview` (internal APK), `production` (app-bundle/remote creds, auto-increment)
- **No test framework** is configured in this project.
- **Firebase**: google-services.json + GoogleService-Info.plist checked in at root.
