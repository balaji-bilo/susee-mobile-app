import React, { useState } from 'react';
import { ScrollView, Text, View, TouchableOpacity, Image, Modal, Platform, PermissionsAndroid, Alert } from 'react-native';
import { Camera, Image as ImageIcon, X } from 'lucide-react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { colors, fonts, radius, spacing } from '../../../common/config/theme';
import { Button } from '../../../common/components/Button';

export function PhotoUploader({ value = {}, onChange }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeKey, setActiveKey] = useState(null);
  const [preview, setPreview] = useState(null);

  const sections = [
    { key: 'front', label: 'Front View' },
    { key: 'rear', label: 'Rear View' },
    { key: 'left', label: 'Left Side' },
    { key: 'right', label: 'Right Side' },
    { key: 'damage', label: 'Damage' },
  ];

  const requestCameraPermission = async () => {
    if (Platform.OS !== 'android') return true;
    try {
      const hasPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.CAMERA
      );
      if (hasPermission) return true;

      const status = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission Required',
          message: 'This app needs access to your camera to take vehicle photos.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return status === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Camera permission request error:', err);
      return false;
    }
  };

  const openCamera = async (key) => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Denied',
        'Camera permission is required to take vehicle photos.'
      );
      return;
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      saveToPhotos: false,
    };

    launchCamera(options, (response) => {
      setSheetOpen(false);
      if (response.didCancel) return;
      if (response.errorCode) {
        console.warn('Camera Error: ', response.errorCode, response.errorMessage);
        Alert.alert('Camera Error', response.errorMessage || 'Failed to open camera.');
        return;
      }
      if (response.assets && response.assets.length > 0) {
        const photo = response.assets[0];
        const newPhoto = {
          id: Date.now().toString(),
          uri: photo.uri,
          name: photo.fileName || `photo_${key}_${Date.now()}.jpg`,
          type: photo.type || 'image/jpeg',
        };
        const existing = value[key] || [];
        onChange({ ...value, [key]: [...existing, newPhoto] });
      }
    });
  };

  const openGallery = (key) => {
    const existingCount = (value[key] || []).length;
    const remainingSlots = 2 - existingCount;
    if (remainingSlots <= 0) {
      Alert.alert('Limit Reached', 'You can only upload up to 2 photos per category.');
      return;
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: remainingSlots,
    };

    launchImageLibrary(options, (response) => {
      setSheetOpen(false);
      if (response.didCancel) return;
      if (response.errorCode) {
        console.warn('Gallery Error: ', response.errorCode, response.errorMessage);
        Alert.alert('Gallery Error', response.errorMessage || 'Failed to open library.');
        return;
      }
      if (response.assets && response.assets.length > 0) {
        const newPhotos = response.assets.map((asset) => ({
          id: `${Date.now()}-${Math.random()}`,
          uri: asset.uri,
          name: asset.fileName || `photo_${key}_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
        }));
        const existing = value[key] || [];
        const allowedNewPhotos = newPhotos.slice(0, Math.max(0, 2 - existing.length));
        onChange({ ...value, [key]: [...existing, ...allowedNewPhotos] });
      }
    });
  };

  const addPhoto = (key) => {
    setActiveKey(key);
    setSheetOpen(true);
  };

  const removePhoto = (key, id) => {
    onChange({ ...value, [key]: value[key].filter((item) => item.id !== id) });
  };

  return (
    <View>
      <View style={{ gap: spacing.md }}>
        {sections.map((section) => (
          <View
            key={section.key}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              padding: spacing.lg,
            }}
          >
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}
            >
              <Text style={{ fontFamily: fonts.inter, color: colors.text }}>{section.label}</Text>
              {(!value[section.key] || value[section.key].length < 2) ? (
                <TouchableOpacity
                  onPress={() => addPhoto(section.key)}
                  activeOpacity={0.75}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: colors.primarySoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Camera size={18} color={colors.primaryDeep} strokeWidth={2} />
                </TouchableOpacity>
              ) : (
                <View style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: colors.surfaceAlt, borderRadius: radius.sm }}>
                  <Text style={{ fontFamily: fonts.inter, fontSize: 11, color: colors.mutedText, fontWeight: '600' }}>MAX (2/2)</Text>
                </View>
              )}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                {value[section.key]?.map((item) => {
                  const isColor = item.uri.startsWith('#');
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setPreview(item)}
                      activeOpacity={0.85}
                      style={{
                        width: 124,
                        height: 96,
                        borderRadius: radius.md,
                        overflow: 'hidden',
                        borderWidth: 1,
                        borderColor: colors.border,
                        marginRight: spacing.md,
                      }}
                    >
                      {isColor ? (
                        <View
                          style={{
                            flex: 1,
                            backgroundColor: item.uri,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text
                            style={{ fontFamily: fonts.inter, color: colors.text, textAlign: 'center', paddingHorizontal: 8 }}
                          >
                            {item.label}
                          </Text>
                        </View>
                      ) : (
                        <Image
                          source={{ uri: item.uri }}
                          style={{
                            flex: 1,
                            width: '100%',
                            height: '100%',
                          }}
                          resizeMode="cover"
                        />
                      )}
                      <TouchableOpacity
                        onPress={() => removePhoto(section.key, item.id)}
                        activeOpacity={0.7}
                        style={{
                          position: 'absolute',
                          right: 6,
                          top: 6,
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: 'rgba(255,255,255,0.92)',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <X size={14} color={colors.danger} strokeWidth={3} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
                {!value[section.key] || value[section.key].length === 0 ? (
                  <View
                    style={{
                      width: 200,
                      height: 96,
                      borderRadius: radius.md,
                      borderWidth: 1,
                      borderStyle: 'dashed',
                      borderColor: colors.border,
                      backgroundColor: colors.surfaceAlt,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontFamily: fonts.inter, color: colors.mutedText, fontSize: 12 }}>No photos added</Text>
                  </View>
                ) : null}
              </View>
            </ScrollView>
          </View>
        ))}
      </View>

      {Boolean(preview) && (
        <Modal visible={Boolean(preview)} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: 'rgba(6, 14, 25, 0.5)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: spacing.xl,
            }}
            activeOpacity={1}
            onPress={() => setPreview(null)}
          >
            {preview ? (
              <TouchableOpacity
                style={{
                  width: '100%',
                  maxWidth: 620,
                  borderRadius: radius.lg,
                  backgroundColor: colors.surface,
                  padding: spacing.lg,
                }}
                activeOpacity={1}
                onPress={() => undefined}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                  <Text style={{ fontFamily: fonts.inter, fontSize: 16, color: colors.text }}>
                    Photo Preview
                  </Text>
                  <TouchableOpacity onPress={() => setPreview(null)} style={{ padding: 4 }} activeOpacity={0.7}>
                    <X size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>
                <View
                  style={{
                    height: 360,
                    borderRadius: radius.lg,
                    backgroundColor: preview.uri.startsWith('#') ? preview.uri : '#F1F5F9',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {preview.uri.startsWith('#') ? (
                    <Text style={{ fontFamily: fonts.inter, color: colors.text }}>{preview.label}</Text>
                  ) : (
                    <Image
                      source={{ uri: preview.uri }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="contain"
                    />
                  )}
                </View>
              </TouchableOpacity>
            ) : null}
          </TouchableOpacity>
        </Modal>
      )}

      {sheetOpen && (
        <Modal
          visible={sheetOpen}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setSheetOpen(false)}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: 'rgba(15, 23, 42, 0.3)',
              justifyContent: 'flex-end',
            }}
            activeOpacity={1}
            onPress={() => setSheetOpen(false)}
          >
            <TouchableOpacity
              style={{
                backgroundColor: colors.surface,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: 24,
                paddingBottom: Platform.OS === 'ios' ? 40 : 28,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 10,
              }}
              activeOpacity={1}
              onPress={() => undefined}
            >
              <View
                style={{
                  width: 38,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.border,
                  alignSelf: 'center',
                  marginBottom: 16,
                }}
              />

              <Text style={{ fontFamily: fonts.inter, fontSize: 18, color: colors.text, marginBottom: 4 }}>
                Upload Vehicle Photo
              </Text>
              <Text style={{ fontFamily: fonts.inter, fontSize: 13, color: colors.mutedText, marginBottom: 20 }}>
                Select a source to capture or upload the photo.
              </Text>

              <View style={{ gap: 12 }}>
                <TouchableOpacity
                  onPress={() => openCamera(activeKey)}
                  activeOpacity={0.75}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    borderRadius: 14,
                    backgroundColor: '#F1F5F9',
                    gap: 16,
                  }}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                    <Camera size={20} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={{ fontFamily: fonts.inter, fontSize: 15, color: colors.text }}>
                      Take Photo
                    </Text>
                    <Text style={{ fontFamily: fonts.inter, fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                      Use camera to snap a live view
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => openGallery(activeKey)}
                  activeOpacity={0.75}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    borderRadius: 14,
                    backgroundColor: '#F1F5F9',
                    gap: 16,
                  }}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#E6F7ED', alignItems: 'center', justifyContent: 'center' }}>
                    <ImageIcon size={20} color="#0D9488" />
                  </View>
                  <View>
                    <Text style={{ fontFamily: fonts.inter, fontSize: 15, color: colors.text }}>
                      Choose from Gallery
                    </Text>
                    <Text style={{ fontFamily: fonts.inter, fontSize: 11, color: colors.mutedText, marginTop: 1 }}>
                      Select an image from local storage
                    </Text>
                  </View>
                </TouchableOpacity>

                <Button
                  label="Cancel"
                  onPress={() => setSheetOpen(false)}
                  variant="ghost"
                  style={{ marginTop: 8 }}
                />
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}
