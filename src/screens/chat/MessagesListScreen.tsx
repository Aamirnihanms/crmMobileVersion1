import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import AppText from '@/src/components/common/AppText';
import type { DashboardStackParamList } from '@/src/navigation/DashboardStack';
import { colors, spacing } from '@/src/theme';

type Nav = NativeStackNavigationProp<
  DashboardStackParamList,
  'MessagesList'
>;

type ChatPreview = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  online?: boolean;
  muted?: boolean;
  avatarColor: string;
};

const chats: ChatPreview[] = [
  {
    id: 'c1',
    name: 'Riya Sharma',
    lastMessage: 'Sent the batch details, please check.',
    time: '11:24',
    unread: 2,
    online: true,
    avatarColor: '#D7F5E2',
  },
  {
    id: 'c2',
    name: 'Aman Verma',
    lastMessage: 'Can we reschedule the demo call?',
    time: '10:05',
    unread: 0,
    avatarColor: '#E2F2FF',
  },
  {
    id: 'c3',
    name: 'Priya (Parent)',
    lastMessage: 'Thank you for the quick update.',
    time: 'Yesterday',
    unread: 1,
    muted: true,
    avatarColor: '#FFE8D8',
  },
  {
    id: 'c4',
    name: 'Design Team',
    lastMessage: 'New brochure is ready for review.',
    time: 'Yesterday',
    unread: 0,
    avatarColor: '#F0E6FF',
  },
  {
    id: 'c5',
    name: 'Karan Singh',
    lastMessage: 'I will complete payment by evening.',
    time: 'Mon',
    unread: 0,
    avatarColor: '#F1F5F9',
  },
];

function Avatar({
  label,
  color,
  online,
}: {
  label: string;
  color: string;
  online?: boolean;
}) {
  const initial = label?.trim()?.charAt(0)?.toUpperCase() || 'U';

  return (
    <View style={styles.avatarOuter}>
      <View style={[styles.avatar, { backgroundColor: color }]}>
        <AppText variant="subtitle">{initial}</AppText>
      </View>
      {online ? <View style={styles.onlineDot} /> : null}
    </View>
  );
}

export default function MessagesListScreen() {
  const navigation = useNavigation<Nav>();
  const [search, setSearch] = useState('');

  const filteredChats = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return chats;
    return chats.filter(
      (chat) =>
        chat.name.toLowerCase().includes(s) ||
        chat.lastMessage.toLowerCase().includes(s)
    );
  }, [search]);

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <View style={styles.searchRow}>
          <Ionicons
            name="search"
            size={18}
            color={colors.textSecondary}
          />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search or start new chat"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />
        </View>
      </View>

      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={styles.chatRow}
            onPress={() =>
              navigation.navigate('ChatThread', {
                chatId: item.id,
                name: item.name,
                avatarColor: item.avatarColor,
                online: item.online,
              })
            }
          >
            <Avatar
              label={item.name}
              color={item.avatarColor}
              online={item.online}
            />

            <View style={styles.chatMiddle}>
              <AppText variant="subtitle" numberOfLines={1}>
                {item.name}
              </AppText>
              <AppText
                color={colors.textSecondary}
                numberOfLines={1}
                style={styles.lastMessage}
              >
                {item.lastMessage}
              </AppText>
            </View>

            <View style={styles.chatRight}>
              <AppText
                variant="caption"
                color={
                  item.unread > 0 ? '#1F8E5D' : colors.textSecondary
                }
              >
                {item.time}
              </AppText>

              {item.unread > 0 ? (
                <View style={styles.unreadBadge}>
                  <AppText variant="caption" color="#FFFFFF">
                    {item.unread}
                  </AppText>
                </View>
              ) : item.muted ? (
                <Ionicons
                  name="volume-mute-outline"
                  size={14}
                  color={colors.textMuted}
                />
              ) : null}
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <AppText color={colors.textSecondary}>
              No chats found
            </AppText>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  searchWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: '#FFFFFF',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    paddingVertical: spacing.sm + 2,
    marginLeft: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF1F7',
  },
  avatarOuter: {
    marginRight: spacing.md,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#22C55E',
  },
  chatMiddle: {
    flex: 1,
    marginRight: spacing.md,
  },
  lastMessage: {
    marginTop: 2,
  },
  chatRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 58,
    gap: spacing.xs,
  },
  unreadBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F8E5D',
  },
  emptyState: {
    paddingTop: spacing.xl,
    alignItems: 'center',
  },
});
