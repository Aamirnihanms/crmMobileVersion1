import { View, StyleSheet, Pressable } from 'react-native';
import AppText from '@/src/components/common/AppText';
import { spacing } from '@/src/theme';
import { NativeStackNavigationProp} from '@react-navigation/native-stack';
import type { StudentsStackParamList } from '../../navigation/StudentsStack';
import { useNavigation } from '@react-navigation/native';



export default function StudentEnrollmentsSection({
  enrollments,
}: any) {
  if (!enrollments?.length) return null;

  const navigation =
    useNavigation<
      NativeStackNavigationProp<StudentsStackParamList>
    >();

   const handlePress = (e: any) => {
    console.log('Pressed enrollment:', e); // ✅ console log
    navigation.navigate('EnrollmentDetails', {
      id: e.uid,
    });
  };

  return (
    <View style={styles.card}>
      <AppText variant="subtitle">Enrollments</AppText>

      {enrollments.map((e: any) => (
        <View key={e.uid} style={styles.item}>
          <Pressable onPress={() => handlePress(e)}>
            <AppText>
              {e.batch?.course_name}
            </AppText>
          </Pressable>

          <AppText variant="caption">
            {e.batch?.batch_name}
          </AppText>

          <AppText variant="caption">
            Status: {e.status_object?.name}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: spacing.lg,
    borderRadius: 12,
  },

  item: {
    marginTop: spacing.sm,
  },
});