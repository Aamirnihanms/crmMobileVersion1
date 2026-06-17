# Fix: Keyboard hides input fields in EvaluationMarkingDetailScreen (Revised)

## Problem

The previous plan used `KeyboardAvoidingView` from `react-native`, which doesn't work well on Android (`behavior: undefined` = no avoidance). Last inputs remain hidden behind the keyboard.

## Root cause

The project already has `KeyboardProvider` in `App.tsx` (line 384) from `react-native-keyboard-controller`. The correct pattern is to use `KeyboardAwareScrollView` from that library — used in `NewEnrollmentScreen`, `RejoinStudentScreen`, `AddDiscountScreen`, `BatchChangeScreen`, etc.

## File to change

### `src/screens/more/EvaluationMarkingDetailScreen.tsx`

**Edit 1 — Add import (line 4–11)**

Add `KeyboardAwareScrollView` import alongside existing `react-native` imports:

```tsx
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';  // ADD
```

Note: Keep the `ScrollView` import — it's still used for the grade bands horizontal scroll at line 277.

**Edit 2 — Replace outer ScrollView with KeyboardAwareScrollView (lines 166–364)**

Before:

```tsx
    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* ... all content (lines 168–362) ... */}
        </ScrollView>
    );
```

After:

```tsx
    return (
        <KeyboardAwareScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bottomOffset={80}
        >
            {/* ... all content (lines 168–362) ... */}
        </KeyboardAwareScrollView>
    );
```

**Edit 3 — Add `scrollContent` style to StyleSheet (after line 371, near `container`)**

```js
container: {
    flex: 1,
    backgroundColor: colors.background,
},
scrollContent: {
    paddingBottom: spacing.xl,    // extra bottom padding so last inputs scroll above keyboard
},
```

## Why `KeyboardAwareScrollView` works

- Automatically adjusts scroll position when keyboard opens/closes on both platforms
- `bottomOffset={80}` reserves extra space below the last focused input
- No need for `behavior` or `keyboardVerticalOffset` — the library handles everything
- Works with the existing `KeyboardProvider` wrapper in `App.tsx`
- Identical pattern to 5+ other screens in the codebase
