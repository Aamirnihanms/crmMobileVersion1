# Fix: Keyboard issues in Chat Group Creation Modal

## Problems

1. **Inputs hidden behind keyboard on Android** — `KeyboardAvoidingView` (from `react-native`) uses `behavior={Platform.OS === 'ios' ? 'padding' : undefined}`, which disables avoidance entirely on Android.
2. **Tapping background doesn't dismiss keyboard** — `modalOverlay` is a plain `View` with no keyboard dismissal handler.
3. **"Create Group" button hidden behind keyboard** — `modalCardTall` has fixed height (`90%`) with no scrollability; the button at the bottom gets covered when keyboard opens.

## Files to change

### `src/screens/chat/MessagesListScreen.tsx`

Both the **"New Chat"** modal (line 1690) and **"Create Group"** modal (line 1819) have the same issues.

---

### Edit 1 — Fix imports (lines 13–27, and new line)

**Before:**
```tsx
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
```

**After:**
```tsx
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
```

Changes:
- Added `Keyboard` (for `Keyboard.dismiss()`)
- Added `TouchableWithoutFeedback` (for wrapping overlay to dismiss keyboard)
- Removed `KeyboardAvoidingView` from `react-native` import (it keeps the same name but now imports from `react-native-keyboard-controller`)

---

### Edit 2 — New Chat modal: KeyboardAvoidingView + overlay (lines 1696–1701)

**Before (lines 1696–1701):**
```tsx
        <KeyboardAvoidingView
          style={styles.modalKeyboard}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <View style={styles.modalOverlay}>
```

**After:**
```tsx
        <KeyboardAvoidingView style={styles.modalKeyboard} behavior="padding">
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.modalOverlay}>
```

---

### Edit 3 — New Chat modal: closing tags (lines 1815–1817)

**Before (lines 1815–1817):**
```tsx
          </View>
        </KeyboardAvoidingView>
      </Modal>
```

**After:**
```tsx
          </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
```

---

### Edit 4 — Create Group modal: KeyboardAvoidingView + overlay (lines 1828–1833)

**Before (lines 1828–1833):**
```tsx
        <KeyboardAvoidingView
          style={styles.modalKeyboard}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <View style={styles.modalOverlay}>
```

**After:**
```tsx
        <KeyboardAvoidingView style={styles.modalKeyboard} behavior="padding">
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.modalOverlay}>
```

---

### Edit 5 — Create Group modal: closing tags (lines 2020–2022)

**Before (lines 2020–2022):**
```tsx
          </View>
        </KeyboardAvoidingView>
      </Modal>
```

**After:**
```tsx
          </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
```

---

## Why this works

- **`KeyboardAvoidingView` from `react-native-keyboard-controller`** handles keyboard avoidance consistently on both iOS and Android with `behavior="padding"`. No Platform check needed.
- **`TouchableWithoutFeedback`** wrapping the overlay with `onPress={Keyboard.dismiss}` lets the user tap any empty area to dismiss the keyboard without interfering with interactions inside the card (buttons, FlatList scrolling, etc.).
- **`keyboardShouldPersistTaps="handled"`** is already set on the FlatLists inside both modals (lines 1771, 1948), so taps on list items work even when the keyboard is open.

This matches the pattern used in `CreateExamSessionSheet.tsx` (lines 188–200) and other modal components in the codebase.
