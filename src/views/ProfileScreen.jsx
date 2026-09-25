import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator, Platform, TextInput, RefreshControl, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import {
  User, LogOut, Mail, Phone, ChevronRight, Edit2
} from 'lucide-react-native';
import { COLORS, FONTS } from '../config/theme';
import Svg, { Path } from 'react-native-svg';
import { base_url, profile, submit_profile } from '../config/constant';
import { retrieveEncryptedData, storeEncryptedData, removeEncryptedData, getInitials } from '../config/storage';
import axios from 'axios';
import { showToast } from '../utils/toast';
import Skeleton from '../components/Skeleton';

export default function ProfileScreen({ navigation }) {
  const isFocused = useIsFocused();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const fetchProfile = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const token = await retrieveEncryptedData('token');
      console.log(base_url + profile);
      const response = await axios.get(base_url + profile, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data && response.data.success) {
        const userData = response.data.data.user;
        setUser(userData);
        setFullName(userData.fullName);
        setMobileNo(userData.mobileNo);
        await storeEncryptedData('user', JSON.stringify(userData));
        await storeEncryptedData('fullName', userData.fullName);
        await storeEncryptedData('mobileNo', userData.mobileNo);
      } else {
        showToast('Failed to fetch profile details');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      showToast('Error loading profile details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!fullName.trim()) {
      showToast('Full Name is required');
      return;
    }
    if (!mobileNo.trim()) {
      setPhoneError('Mobile Number is required.');
      return;
    }
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(mobileNo.trim())) {
      setPhoneError('Invalid phone number.');
      return;
    }
    setPhoneError('');
    try {
      setUpdating(true);
      const token = await retrieveEncryptedData('token');
      const response = await axios.put(base_url + submit_profile, {
        fullName: fullName.trim(),
        emailId: user?.emailId,
        mobileNo: mobileNo.trim()
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data && response.data.success) {
        showToast('Profile updated successfully');
        const updatedUser = response.data.data.user;
        setUser(updatedUser);
        setFullName(updatedUser.fullName || '');
        setMobileNo(updatedUser.mobileNo || '');
        await storeEncryptedData('user', JSON.stringify(updatedUser));
        await storeEncryptedData('fullName', updatedUser.fullName);
        await storeEncryptedData('mobileNo', updatedUser.mobileNo || '');
        setIsEditing(false);
      } else {
        showToast(response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      const errMsg = error.response?.data?.message || 'Error updating profile details';
      showToast(errMsg);
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    setLogoutLoading(true);
    try {
      await removeEncryptedData('token');
      await removeEncryptedData('user');
      await removeEncryptedData('fullName');
      await removeEncryptedData('emailId');
      await removeEncryptedData('mobileNo');
      showToast('Logged out successfully');
      setLogoutModalVisible(false);
      navigation.replace('Login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLogoutLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchProfile(true);
    } else {
      setIsEditing(false);
      setFullName(user?.fullName || '');
      setMobileNo(user?.mobileNo || '');
      setPhoneError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProfile(false);
    setRefreshing(false);
  };

  const [currentName, setCurrentName] = useState('');
  useEffect(() => {
    if (user?.fullName) {
      setCurrentName(user.fullName);
    } else {
      retrieveEncryptedData('user').then(userStr => {
        if (userStr) {
          try {
            const userObj = JSON.parse(userStr);
            if (userObj?.fullName) {
              setCurrentName(userObj.fullName);
              return;
            }
          } catch (e) { }
        }
        retrieveEncryptedData('fullName').then(name => {
          if (name) setCurrentName(name || '');
        });
      });
    }
  }, [user]);

  const initials = getInitials(currentName);

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['left', 'right', 'bottom']}>
        {isFocused && <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={true} />}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scrollContainer}
        >
          {/* Header Hero Section Skeleton */}
          <View style={s.headerHero}>
            <View style={s.skeletonHeaderBg} />

            <Skeleton style={s.skeletonHeroName} />
            <Skeleton style={s.skeletonHeroRole} />

            {/* Avatar container overlapping the wave */}
            <View style={s.avatarWrapper}>
              <View style={s.skeletonAvatarContainer}>
                <View style={s.skeletonAvatarBg}>
                  <Skeleton style={s.skeletonAvatar} />
                </View>
              </View>
            </View>
          </View>

          <View style={s.body}>
            <Skeleton style={s.skeletonSectionTitle} />

            {[1, 2, 3].map((key) => (
              <View key={key} style={s.skeletonDetailsCard}>
                <View style={s.infoRow}>
                  <Skeleton style={s.skeletonIconBox} />
                  <View style={s.infoContent}>
                    <Skeleton style={s.skeletonLabel} />
                    <Skeleton style={s.skeletonValue} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['left', 'right', 'bottom']}>
      {isFocused && <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={true} />}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
          />
        }
      >

        {/* Header Hero Section */}
        <View style={s.headerHero}>
          {/* Svg Wave Background */}
          <View style={s.headerBg}>
            <Svg height="100%" width="100%" viewBox="0 0 1440 240" preserveAspectRatio="none">
              {/* Main Wave */}
              <Path
                fill={COLORS.primary}
                d="M0,0 L0,180 C360,290 1080,70 1440,190 L1440,0 Z"
              />
              {/* Topographical Contour lines */}
              <Path
                fill="none"
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth="3"
                d="M0,130 C360,240 1080,20 1440,140"
              />
              <Path
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="3"
                d="M0,80 C360,190 1080,-30 1440,90"
              />
            </Svg>
          </View>

          {/* User info inside the dark blue wave area */}
          <Text style={s.heroName}>{currentName}</Text>
          <Text style={s.heroRole}>{user?.role?.name || 'Gate Security'}</Text>

          {/* Avatar container overlapping the wave */}
          <View style={s.avatarWrapper}>
            <View style={s.avatarContainer}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{initials}</Text>
              </View>
              <View style={s.onlineDot} />
            </View>
          </View>
        </View>

        <View style={s.body}>
          {/* Section 1: Contact Details */}
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Security Identity</Text>
            {!isEditing && (
              <TouchableOpacity
                onPress={() => {
                  setIsEditing(true);
                  setPhoneError('');
                }}
                style={s.editButtonHeader}
                activeOpacity={0.7}
              >
                <Edit2 size={16} color={COLORS.primary} strokeWidth={2.2} />
              </TouchableOpacity>
            )}
          </View>

          {/* Card 1: Full Name */}
          <View style={s.detailsCard}>
            <View style={s.infoRow}>
              <View style={[s.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.08)' }]}>
                <User size={18} color={COLORS.primary} strokeWidth={2.2} />
              </View>
              <View style={s.infoContent}>
                <Text style={s.infoLabel}>Full Name</Text>
                {isEditing ? (
                  <TextInput
                    style={s.input}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Enter full name"
                    placeholderTextColor={COLORS.muted}
                  />
                ) : (
                  <Text style={s.infoValue}>{currentName}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Card 2: Email Address */}
          <View style={s.detailsCard}>
            <View style={s.infoRow}>
              <View style={[s.iconBox, { backgroundColor: 'rgba(34, 197, 94, 0.08)' }]}>
                <Mail size={18} color="#22C55E" strokeWidth={2.2} />
              </View>
              <View style={s.infoContent}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={s.infoLabel}>Email Address</Text>
                  <Text style={s.readOnlyTag}> (Read-Only)</Text>
                </View>
                <Text style={[s.infoValue, { color: COLORS.muted }]}>{user?.emailId || 'Not Configured'}</Text>
              </View>
            </View>
          </View>

          {/* Card 3: Mobile Number */}
          <View style={[s.detailsCard, phoneError ? s.errorCardBorder : null]}>
            <View style={s.infoRow}>
              <View style={[s.iconBox, { backgroundColor: 'rgba(239, 68, 68, 0.08)' }]}>
                <Phone size={18} color="#EF4444" strokeWidth={2.2} />
              </View>
              <View style={s.infoContent}>
                <Text style={s.infoLabel}>Mobile Number</Text>
                {isEditing ? (
                  <>
                    <TextInput
                      style={[s.input, phoneError ? s.errorInput : null]}
                      value={mobileNo}
                      onChangeText={(text) => {
                        setMobileNo(text);
                        if (phoneError) setPhoneError('');
                      }}
                      placeholder="Enter mobile number"
                      placeholderTextColor={COLORS.muted}
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                    {!!phoneError && (
                      <Text style={s.errorText}>{phoneError}</Text>
                    )}
                  </>
                ) : (
                  <Text style={s.infoValue}>{user?.mobileNo || 'Not Configured'}</Text>
                )}
              </View>
            </View>
          </View>

          {isEditing && (
            <View style={s.buttonRow}>
              <TouchableOpacity
                style={s.cancelButtonEdit}
                activeOpacity={0.7}
                onPress={() => {
                  setIsEditing(false);
                  setFullName(user?.fullName || '');
                  setMobileNo(user?.mobileNo || '');
                  setPhoneError('');
                }}
                disabled={updating}
              >
                <Text style={s.cancelButtonEditText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.saveButton, { flex: 1, marginBottom: 0 }, updating && { opacity: 0.8 }]}
                activeOpacity={0.85}
                onPress={handleUpdateProfile}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={s.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Logout Section */}
          {!isEditing && (
            <TouchableOpacity
              style={s.logoutButton}
              activeOpacity={0.85}
              onPress={handleLogout}
            >
              <View style={s.logoutIconBox}>
                <LogOut size={18} color="#EF4444" strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.logoutText}>Logout</Text>
              </View>
              <ChevronRight size={16} color="#EF4444" opacity={0.6} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={logoutModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          if (!logoutLoading) {
            setLogoutModalVisible(false);
          }
        }}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Confirm Logout</Text>
            <Text style={s.modalSubtitle}>Are you sure you want to logout?</Text>
            <View style={s.modalButtons}>
              <TouchableOpacity
                style={[s.modalButton, s.cancelButton]}
                onPress={() => setLogoutModalVisible(false)}
                disabled={logoutLoading}
                activeOpacity={0.7}
              >
                <Text style={s.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalButton, s.logoutConfirmButton, logoutLoading && { opacity: 0.8 }]}
                onPress={confirmLogout}
                disabled={logoutLoading}
                activeOpacity={0.7}
              >
                {logoutLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={s.logoutButtonText}>Logout</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, fontFamily: FONTS.inter, color: COLORS.muted },
  scrollContainer: { paddingBottom: 110 },

  /* Hero Section */
  headerHero: {
    height: 270,
    backgroundColor: '#F8FAFC',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 0,
    marginBottom: 10,
  },
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
  },
  heroName: {
    color: '#ffffff',
    fontSize: 24,
    fontFamily: FONTS.inter,
    zIndex: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: -85,
  },
  heroRole: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontFamily: FONTS.inter,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
    zIndex: 2,
  },
  avatarWrapper: {
    position: 'absolute',
    bottom: 45,
    zIndex: 3,
  },
  avatarContainer: {
    position: 'relative',
    padding: 4,
    borderRadius: 44,
    backgroundColor: '#ffffff',
    elevation: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 32,
    fontFamily: FONTS.inter,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    borderWidth: 3,
    borderColor: '#ffffff',
  },

  /* Body Content */
  body: {
    paddingHorizontal: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    color: COLORS.muted,
    fontSize: 12,
    fontFamily: FONTS.inter,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 0,
    marginLeft: 4,
  },
  detailsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontFamily: FONTS.inter,
    marginBottom: 1,
  },
  infoValue: {
    color: COLORS.secondary,
    fontSize: 15,
    fontFamily: FONTS.inter,
  },
  /* Logout Button */
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    marginTop: 4,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  logoutIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FFECEC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 15,
    fontFamily: FONTS.inter,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingRight: 4,
  },
  editButtonHeader: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: COLORS.secondary,
    fontSize: 15,
    fontFamily: FONTS.inter,
    marginTop: 6,
    backgroundColor: '#FAFAFA',
  },
  readOnlyTag: {
    fontSize: 10,
    fontFamily: FONTS.inter,
    color: COLORS.muted,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 22,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: FONTS.inter,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    marginTop: 8,
  },
  cancelButtonEdit: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 22,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelButtonEditText: {
    color: COLORS.muted,
    fontSize: 15,
    fontFamily: FONTS.inter,
    // fontWeight: '600',
  },
  valueWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 6,
  },
  fieldEditButton: {
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: FONTS.inter,
    // fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: FONTS.inter,
    color: COLORS.muted,
    marginBottom: 20,
    lineHeight: 18,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
    gap: 12,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  logoutConfirmButton: {
    backgroundColor: '#EF4444',
  },
  cancelButtonText: {
    color: COLORS.muted,
    fontFamily: FONTS.inter,
    // fontWeight: '600',
    fontSize: 14,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontFamily: FONTS.inter,
    // fontWeight: '600',
    fontSize: 14,
  },
  skeletonHeaderBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    backgroundColor: COLORS.primary,
  },
  skeletonHeroName: {
    width: 160,
    height: 24,
    borderRadius: 6,
    marginTop: -85,
  },
  skeletonHeroRole: {
    width: 100,
    height: 14,
    borderRadius: 4,
    marginTop: 8,
  },
  skeletonAvatarBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  skeletonSectionTitle: {
    width: 120,
    height: 16,
    borderRadius: 4,
    marginBottom: 12,
    marginLeft: 4,
  },
  skeletonDetailsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  skeletonIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    marginRight: 14,
  },
  skeletonLabel: {
    width: 80,
    height: 12,
    borderRadius: 3,
    marginBottom: 6,
  },
  skeletonValue: {
    width: 160,
    height: 16,
    borderRadius: 4,
  },
  skeletonAvatarContainer: {
    position: 'relative',
    padding: 4,
    borderRadius: 44,
    backgroundColor: '#ffffff',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontFamily: FONTS.inter,
    marginTop: 4,
    marginLeft: 2,
  },
  errorInput: {
    borderColor: '#EF4444',
  },
  errorCardBorder: {
    borderColor: '#EF4444',
  },
});

