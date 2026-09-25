import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../styles/theme';
import { Card } from '../components/Card';
import { User, Phone, LogOut, ChevronRight, Mail, Pencil } from 'lucide-react-native';
import { retrieveEncryptedData, removeEncryptedData, storeEncryptedData, getInitials } from '../config/storage';
import axios from 'axios';
import { base_url, profile, submit_profile, delete_fcm_token } from '../config/constant';
import { Button } from '../components/Button';
import Toast from 'react-native-simple-toast';
import styles from '../styles/profileStyles';
import { ProfileSkeleton } from '../../jobcreate/components/loading/ProfileSkeleton';

export function ProfileScreen({ navigation }) {
  const [profileData, setProfileData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      setIsEditing(false);
      setNameError('');
      setPhoneError('');
    });
    return unsubscribe;
  }, [navigation]);

  const fetchProfile = async (showLoading = true) => {
    if (showLoading) {
      setProfileLoading(true);
    }
    try {
      const token = await retrieveEncryptedData('token');
      const response = await axios.get(`${base_url}${profile}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('Profile Response:', response.data);
      if (response.data && response.data.success && response.data.data?.user) {
        setProfileData(response.data.data.user);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile(false);
    setRefreshing(false);
  }, []);

  const handleStartEdit = () => {
    setEditName(profileData?.fullName || '');
    setEditPhone(profileData?.mobileNo || '');
    setNameError('');
    setPhoneError('');
    setIsEditing(true);
  };

  const handleSave = async () => {
    let isValid = true;

    if (!editName.trim()) {
      setNameError('Name is required.');
      isValid = false;
    } else {
      setNameError('');
    }

    if (!editPhone.trim()) {
      setPhoneError('Phone Number is required.');
      isValid = false;
    } else {
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(editPhone.trim())) {
        setPhoneError('Invalid phone number.');
        isValid = false;
      } else {
        setPhoneError('');
      }
    }

    if (!isValid) {
      return;
    }

    setLoading(true);
    try {
      const token = await retrieveEncryptedData('token');
      await axios.put(`${base_url}${submit_profile}`, {
        fullName: editName.trim(),
        emailId: profileData?.emailId || '',
        mobileNo: editPhone.trim()
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      await storeEncryptedData('fullName', editName.trim());
      await storeEncryptedData('mobileNo', editPhone.trim());

      await fetchProfile();
      setIsEditing(false);
      Toast.show('Profile updated successfully!', Toast.SHORT);
    } catch (error) {
      console.error('Error updating profile:', error);
      Toast.show(error?.response?.data?.message || 'Failed to update profile.', Toast.SHORT);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {profileLoading ? (
          <ProfileSkeleton />
        ) : (
          <>
            <Card style={[styles.profileCard, { position: 'relative' }]}>
              {!isEditing && (
                <TouchableOpacity
                  onPress={handleStartEdit}
                  activeOpacity={0.7}
                  style={styles.editProfileButton}
                >
                  <Pencil size={15} color={colors.primary} />
                </TouchableOpacity>
              )}

              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {profileData ? getInitials(profileData.fullName) : ''}
                </Text>
              </View>

              <View style={styles.profileDetails}>
                <Text style={styles.profileName}>
                  {profileData?.fullName ? profileData.fullName.charAt(0).toUpperCase() + profileData.fullName.slice(1) : ''}
                </Text>
                <Text style={styles.profileRole}>
                  {profileData?.role?.name}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.contactInfo}>
                <View style={styles.contactRow}>
                  <View style={styles.contactRowLeft}>
                    <View style={styles.iconCircle}>
                      <User size={18} color={colors.primary} />
                    </View>
                    {isEditing ? (
                      <View style={{ flex: 1 }}>
                        <TextInput
                          value={editName}
                          onChangeText={(text) => {
                            setEditName(text);
                            if (nameError) setNameError('');
                          }}
                          style={[styles.editInput, nameError ? styles.errorBorder : null]}
                        />
                        {!!nameError && (
                          <Text style={styles.errorText}>
                            {nameError}
                          </Text>
                        )}
                      </View>
                    ) : (
                      <View>
                        <Text style={styles.fieldLabel}>Full Name</Text>
                        <Text style={styles.fieldValue}>
                          {profileData?.fullName ? profileData.fullName.charAt(0).toUpperCase() + profileData.fullName.slice(1) : ''}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.contactRow}>
                  <View style={styles.contactRowLeft}>
                    <View style={styles.iconCircle}>
                      <Mail size={18} color={colors.primary} />
                    </View>
                    {isEditing ? (
                      <TextInput
                        value={profileData?.emailId || 'N/A'}
                        editable={false}
                        selectTextOnFocus={false}
                        style={[
                          styles.editInput,
                          {
                            backgroundColor: '#F1F5F9',
                            borderColor: colors.border,
                            color: colors.mutedText,
                          },
                        ]}
                      />
                    ) : (
                      <View>
                        <Text style={styles.fieldLabel}>Email Address</Text>
                        <Text style={styles.fieldValue}>
                          {profileData?.emailId || 'N/A'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.contactRow}>
                  <View style={styles.contactRowLeft}>
                    <View style={styles.iconCircle}>
                      <Phone size={18} color={colors.primary} />
                    </View>
                    {isEditing ? (
                      <View style={{ flex: 1 }}>
                        <TextInput
                          value={editPhone}
                          onChangeText={(text) => {
                            setEditPhone(text);
                            if (phoneError) setPhoneError('');
                          }}
                          keyboardType="phone-pad"
                          maxLength={10}
                          style={[styles.editInput, phoneError ? styles.errorBorder : null]}
                        />
                        {!!phoneError && (
                          <Text style={styles.errorText}>
                            {phoneError}
                          </Text>
                        )}
                      </View>
                    ) : (
                      <View>
                        <Text style={styles.fieldLabel}>Phone Number</Text>
                        <Text style={styles.fieldValue}>
                          {profileData?.mobileNo || ''}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {isEditing && (
                <View style={styles.editButtonRow}>
                  <Button
                    label="Cancel"
                    variant="secondary"
                    onPress={() => {
                      setIsEditing(false);
                      setNameError('');
                      setPhoneError('');
                    }}
                    style={{ flex: 1, minHeight: 46 }}
                  />
                  <Button
                    label={loading ? "Saving..." : "Save"}
                    variant="primary"
                    onPress={handleSave}
                    loading={loading}
                    disabled={loading}
                    style={{ flex: 1, minHeight: 46 }}
                  />
                </View>
              )}
            </Card>

            {!isEditing && (
              <View style={styles.menuSection}>
                <TouchableOpacity
                  onPress={handleLogout}
                  activeOpacity={0.8}
                  style={styles.logoutButton}
                >
                  <View style={styles.logoutButtonLeft}>
                    <LogOut size={18} color={colors.danger} />
                    <Text style={styles.logoutText}>Log Out</Text>
                  </View>
                  <ChevronRight size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {logoutModalVisible && (
        <Modal
          visible={logoutModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => {
            if (!logoutLoading) setLogoutModalVisible(false);
          }}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => {
              if (!logoutLoading) setLogoutModalVisible(false);
            }}
          >
            <TouchableOpacity
              style={styles.modalCard}
              activeOpacity={1}
              onPress={() => undefined}
            >
              <Text style={styles.modalTitle}>Log Out</Text>
              <Text style={styles.modalMessage}>
                Are you sure you want to log out from the application?
              </Text>
              <View style={styles.modalButtonRow}>
                <Button
                  label="Cancel"
                  variant="secondary"
                  disabled={logoutLoading}
                  onPress={() => setLogoutModalVisible(false)}
                  style={{ flex: 1, minHeight: 44 }}
                />
                <Button
                  label="Log Out"
                  variant="danger"
                  loading={logoutLoading}
                  disabled={logoutLoading}
                  onPress={async () => {
                    setLogoutLoading(true);
                    try {
                      try {
                        const token = await retrieveEncryptedData('token');
                        const fcmToken = await retrieveEncryptedData('fcm_token');
                        if (token && fcmToken) {
                          await axios.put(`${base_url}${delete_fcm_token}`, {
                            token: fcmToken
                          }, {
                            headers: {
                              'Content-Type': 'application/json',
                              Authorization: `Bearer ${token}`
                            }
                          });
                        }
                      } catch (fcmError) {
                        console.error('Error deleting FCM Token:', fcmError);
                      }

                      await removeEncryptedData('token');
                      await removeEncryptedData('fullName');
                      await removeEncryptedData('emailId');
                      await removeEncryptedData('mobileNo');
                      await removeEncryptedData('roleName');

                      await new Promise((resolve) => setTimeout(resolve, 500));

                      setLogoutModalVisible(false);
                      navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                      });
                    } catch (error) {
                      console.error('Error during logout:', error);
                    } finally {
                      setLogoutLoading(false);
                    }
                  }}
                  style={{ flex: 1, minHeight: 44 }}
                />
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
    </SafeAreaView>
  );
}

export default ProfileScreen;
