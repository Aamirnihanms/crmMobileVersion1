import { colors } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable } from 'react-native';
import BatchCreateScreen from '../screens/more/BatchCreateScreen';
import BatchListScreen from '../screens/more/BatchListScreen';
import ChangePasswordScreen from '../screens/more/ChangePasswordScreen';
import EditProfileScreen from '../screens/more/EditProfileScreen';
import MoreListScreen from '../screens/more/MoreListScreen';
import ProfileScreen from '../screens/more/ProfileScreen';


import LeadDetailsScreen from '../screens/leads/LeadDetailsScreen';
import EnrollmentDetailsScreen from '../screens/students/EnrollmentDetailsScreen';
import StudentDetailsScreen from '../screens/students/StudentDetailsScreen';
import EditStudentScreen from '../screens/students/EditStudentScreen';
import AddDiscountScreen from '../screens/students/AddDiscountScreen';
import NewEnrollmentScreen from '../screens/students/NewEnrollmentScreen';
import ConvertedLeadHistoryScreen from '../screens/students/ConvertedLeadHistoryScreen';
import SetPaymentModeScreen from '../screens/students/SetPaymentModeScreen';
import BatchChangeScreen from '../screens/students/BatchChangeScreen';

export type MoreStackParamList = {
  MoreList: undefined;
  Profile: undefined;
  EditProfile: { user: any };
  BatchList: undefined;
  BatchDetail: { uid: string };
  BatchSessionDetail: { uid: string; batchUid: string };
  ChangePassword: undefined;
  StudentDetails: { id: string; is_active?: boolean };
  EnrollmentDetails: { id: string; studentId: string };
  EditStudent: { id: string };
  AddDiscount: { enrollmentId: string; studentId: string };
  NewEnrollment: { studentId: string; studentName?: string };
  ConvertedLeadHistory: { leadId: string };
  SetPaymentMode: { enrollmentId: string };
  BatchChange: { enrollmentId: string; studentId: string };
  BatchChangeRequestList: undefined;
  BatchChangeRequestDetail: { uid: string };
  BatchCreate: undefined;
  BatchEdit: { uid: string };
  FollowUps: undefined;
  LeadDetails: { id: string };
  GalleryList: undefined;
  CreateGallery: { gallery?: any } | undefined;
  GalleryDetail: { uid: string };
  FolderDetail: { uid: string; gallery_uid: string };
  CreateFolder: { gallery_uid: string; parent_folder_uid?: string; folder?: any };
  AddVideo: { gallery_uid: string; folder_uid?: string; video?: any };
  DroppedStudents: undefined;
  RejoinStudent: { student: any };
  EvaluationTemplates: undefined;
  EvaluationTemplateDetail: { uid: string };
  ExamSessions: { batch?: any } | undefined;
  Marking: { sessionUid: string };
  EvaluationMarkingDetail: { attemptUid: string };
  JobsList: undefined;
  JobDetail: { uid: string };
  CompaniesList: undefined;
  CompanyDetail: { uid: string };
  CreateCompany: undefined;
  EditCompany: { uid: string };
  FieldTemplateDetail: { companyUid: string; templateUid: string };
  CreateEditFieldTemplate: { companyUid: string; templateUid?: string };
};


const Stack = createNativeStackNavigator<MoreStackParamList>();

export default function MoreStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShadowVisible: false,
        headerTransparent: false,
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 18,
          color: colors.textPrimary,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.primary,
      }}
    >
      <Stack.Screen
        name="MoreList"
        component={MoreListScreen}
        options={{ title: 'Account & Settings' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'My Profile' }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Edit Profile' }}
      />
      <Stack.Screen
        name="BatchList"
        component={BatchListScreen}
        options={{ title: 'Batches' }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: 'Change Password' }}
      />
      <Stack.Screen
        name="BatchDetail"
        getComponent={() => require('../screens/more/BatchDetailScreen').default}
        options={{ title: 'Batch Details' }}
      />
      <Stack.Screen
        name="BatchSessionDetail"
        getComponent={() => require('../screens/more/BatchSessionDetailScreen').default}
        options={{ title: 'Session Details' }}
      />
      <Stack.Screen
        name="StudentDetails"
        component={StudentDetailsScreen}
        options={{ title: 'Student Profile' }}
      />
      <Stack.Screen
        name="EnrollmentDetails"
        component={EnrollmentDetailsScreen}
        options={{ title: 'Enrollment' }}
      />
      <Stack.Screen
        name="BatchChangeRequestList"
        getComponent={() => require('../screens/more/BatchChangeRequestListScreen').default}
        options={{ title: 'Batch Change Requests' }}
      />
      <Stack.Screen
        name="BatchChangeRequestDetail"
        getComponent={() => require('../screens/more/BatchChangeRequestDetailScreen').default}
        options={{ title: 'Batch Change Detail' }}
      />
      <Stack.Screen
        name="BatchCreate"
        component={BatchCreateScreen}
        options={{ title: 'Create Batch' }}
      />
      <Stack.Screen
        name="BatchEdit"
        getComponent={() => require('../screens/more/BatchEditScreen').default}
        options={{ title: 'Edit Batch' }}
      />
      <Stack.Screen
        name="FollowUps"
        getComponent={() => require('../screens/more/FollowUpsScreen').default}
        options={{ title: 'My Follow Ups' }}
      />
      <Stack.Screen
        name="LeadDetails"
        component={LeadDetailsScreen}
        options={{ title: 'Lead Details' }}
      />
      <Stack.Screen
        name="GalleryList"
        component={require('../screens/more/GalleryListScreen').default}
        options={({ navigation }) => ({
          title: 'Galleries',
          headerRight: () => (
            <Pressable
              onPress={() => navigation.navigate('CreateGallery')}
              style={{ padding: 4 }}
            >
              <Ionicons name="add-circle-outline" size={26} color={colors.primary} />
            </Pressable>
          ),
        })}
      />
      <Stack.Screen
        name="CreateGallery"
        component={require('../screens/more/CreateGalleryScreen').default}
        options={{ title: 'Create Gallery' }}
      />
      <Stack.Screen
        name="GalleryDetail"
        component={require('../navigation/GalleryDetailTabs').default}
        options={{ title: 'Gallery Details' }}
      />
      <Stack.Screen
        name="FolderDetail"
        component={require('../screens/more/FolderDetailScreen').default}
        options={{ title: 'Folder Contents' }}
      />
      <Stack.Screen
        name="CreateFolder"
        component={require('../screens/more/CreateFolderScreen').default}
        options={{ title: 'Create Folder' }}
      />
      <Stack.Screen
        name="AddVideo"
        component={require('../screens/more/AddVideoScreen').default}
        options={{ title: 'Add Video' }}
      />
      <Stack.Screen
        name="DroppedStudents"
        getComponent={() => require('../screens/more/DroppedStudentsScreen').default}
        options={{ title: 'Dropped Students' }}
      />
      <Stack.Screen
        name="RejoinStudent"
        getComponent={() => require('../screens/more/RejoinStudentScreen').default}
        options={{ title: 'Rejoin Student' }}
      />
      <Stack.Screen
        name="EditStudent"
        component={EditStudentScreen}
        options={{ title: 'Edit Student' }}
      />
      <Stack.Screen
        name="AddDiscount"
        component={AddDiscountScreen}
        options={{ title: 'Add Discount' }}
      />
      <Stack.Screen
        name="NewEnrollment"
        component={NewEnrollmentScreen}
        options={{ title: 'New Enrollment' }}
      />
      <Stack.Screen
        name="ConvertedLeadHistory"
        component={ConvertedLeadHistoryScreen}
        options={{ title: 'Lead History' }}
      />
      <Stack.Screen
        name="SetPaymentMode"
        component={SetPaymentModeScreen}
        options={{ title: 'Set Payment Mode' }}
      />
      <Stack.Screen
        name="BatchChange"
        component={BatchChangeScreen}
        options={{ title: 'Batch Change Request' }}
      />
      <Stack.Screen
        name="EvaluationTemplates"
        getComponent={() => require('../screens/more/EvaluationTemplatesScreen').default}
        options={{ title: 'Evaluation Templates' }}
      />
      <Stack.Screen
        name="EvaluationTemplateDetail"
        getComponent={() => require('@/src/screens/more/EvaluationTemplateDetailScreen').default}
        options={{ title: 'Template Details' }}
      />
      <Stack.Screen
        name="ExamSessions"
        getComponent={() => require('../screens/more/ExamSessionsScreen').default}
        options={{ title: 'Exam Sessions' }}
      />
      <Stack.Screen
        name="Marking"
        getComponent={() => require('../screens/more/MarkingScreen').default}
        options={{ title: 'Marking' }}
      />
      <Stack.Screen
        name="EvaluationMarkingDetail"
        getComponent={() => require('../screens/more/EvaluationMarkingDetailScreen').default}
        options={{ title: 'Mark Sheet' }}
      />
      <Stack.Screen
        name="JobsList"
        getComponent={() => require('../screens/more/JobsListScreen').default}
        options={{ title: 'Jobs' }}
      />
      <Stack.Screen
        name="JobDetail"
        getComponent={() => require('../screens/more/JobDetailScreen').default}
        options={{ title: 'Job Details' }}
      />
      <Stack.Screen
        name="CompaniesList"
        getComponent={() => require('../screens/more/CompaniesListScreen').default}
        options={({ navigation }) => ({
          title: 'Companies',
          headerRight: () => (
            <Pressable
              onPress={() => navigation.navigate('CreateCompany')}
              style={{ padding: 4 }}
            >
              <Ionicons name="add-circle-outline" size={26} color={colors.primary} />
            </Pressable>
          ),
        })}
      />
      <Stack.Screen
        name="CompanyDetail"
        getComponent={() => require('../screens/more/CompanyDetailScreen').default}
        options={({ navigation, route }: any) => ({
          title: 'Company Details',
          headerRight: () => (
            <Pressable
              onPress={() => navigation.navigate('EditCompany', { uid: route.params.uid })}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.primaryLight + '15',
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <Ionicons name="pencil" size={20} color={colors.primary} />
            </Pressable>
          ),
        })}
      />
      <Stack.Screen
        name="FieldTemplateDetail"
        getComponent={() => require('../screens/more/FieldTemplateDetailScreen').default}
        options={{ title: 'Template Details' }}
      />
      <Stack.Screen
        name="CreateEditFieldTemplate"
        getComponent={() => require('../screens/more/CreateEditFieldTemplateScreen').default}
        options={({ route }: any) => ({ 
          title: route.params?.templateUid ? 'Edit Template' : 'New Template' 
        })}
      />
      <Stack.Screen
        name="CreateCompany"
        getComponent={() => require('../screens/more/CreateCompanyScreen').default}
        options={{ title: 'New Company' }}
      />
      <Stack.Screen
        name="EditCompany"
        getComponent={() => require('../screens/more/EditCompanyScreen').default}
        options={{ title: 'Edit Company' }}
      />
    </Stack.Navigator>

  );
}
