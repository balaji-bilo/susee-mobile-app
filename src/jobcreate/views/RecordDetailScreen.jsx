import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Modal, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, spacing, radius } from '../../common/config/theme';
import recordDetailStyles from '../styles/recordDetailStyles';
import { RecordDetailSkeleton } from '../components/loading/RecordDetailSkeleton';
import { getInitials, retrieveEncryptedData } from '../../common/config/storage';
import { base_url, record_details } from '../../common/config/constant';
import { ChevronLeft, User, Car, Wrench, Phone, MapPin, Camera, Clock, X, ChevronRight, Edit2, FileText } from 'lucide-react-native';
import axios from 'axios';
import Toast from 'react-native-simple-toast';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const timeStr = `${hours}:${minutes} ${ampm}`;

    return `${day} ${month} ${year} ${timeStr}`;
  } catch (e) {
    return dateStr;
  }
};

export function ZoomableImage({ uri }) {
  return (
    <View style={{ flex: 1, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
      <Image
        source={{ uri }}
        style={{
          width: '100%',
          height: '100%',
        }}
        resizeMode="contain"
      />
    </View>
  );
}

export function RecordDetailScreen({ route, navigation }) {
  const { record: initialRecord, id, jobCardId } = route.params || {};
  const actualId = jobCardId || id;
  const [record, setRecord] = useState(initialRecord || {});
  const [loading, setLoading] = useState(!!actualId);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPhotoGroup, setSelectedPhotoGroup] = useState(null);
  const [taxRate, setTaxRate] = useState(0);

  useEffect(() => {
    const loadStoredTaxRate = async () => {
      try {
        const storedRate = await retrieveEncryptedData('taxRate');
        if (storedRate) {
          setTaxRate(Number(storedRate));
        }
      } catch (err) {
        console.error('Error loading stored taxRate in RecordDetailScreen:', err);
      }
    };
    loadStoredTaxRate();
  }, []);

  // Fetch job card details from API
  const fetchDetail = useCallback(async (showLoading = true) => {
    console.log("record details", `${base_url}${record_details}/${actualId}`);
    if (showLoading) {
      setLoading(true);
    }
    try {
      const token = await retrieveEncryptedData('token');

      const response = await axios({
        method: 'get',
        url: `${base_url}${record_details}/${actualId}`,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('RecordDetailScreen - API Detail Response:', response.data);

      if (response.data && response.data.success && response.data.data?.record) {
        setRecord(response.data.data.record);
      } else {
        Toast.show(response.data?.message || 'Failed to fetch job card details', Toast.SHORT);
      }
    } catch (error) {
      console.error('Error fetching job card detail:', error);
      Toast.show('Error fetching job card details', Toast.SHORT);
    } finally {
      setLoading(false);
    }
  }, [actualId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (actualId) {
      await fetchDetail(false);
    }
    setRefreshing(false);
  }, [actualId, fetchDetail]);

  useEffect(() => {
    if (actualId) {
      fetchDetail();
    }
  }, [actualId, fetchDetail]);

  useEffect(() => {
    if (navigation && actualId) {
      const unsubscribe = navigation.addListener('focus', () => {
        fetchDetail(false);
      });
      return unsubscribe;
    }
  }, [navigation, actualId, fetchDetail]);

  // Nested response objects
  const header = record.header || {};
  const vehicle = record.vehicleSpecifications || {};
  const customer = record.customerDetails || {};
  const billing = record.servicesAndMaintenanceTasks?.billing || {};

  const isCreated = record.canCreateJobCard !== false;
  const initials = getInitials(header.customerName || 'Unknown Owner');

  const isDelivered =
    record?.currentStatus?.code === 'DELIVERED' ||
    record?.header?.currentStatus?.code === 'DELIVERED' ||
    record?.jobCard?.currentStatus?.code === 'DELIVERED' ||
    record?.status === 'DELIVERED' ||
    record?.header?.status === 'DELIVERED';

  const services = record.servicesAndMaintenanceTasks?.items || record.services || [];

  // Calculate billing details
  const subtotal = billing.serviceSubtotal !== undefined
    ? billing.serviceSubtotal
    : services.reduce((sum, item) => sum + ((item.unitPrice || item.price || 0) * (item.quantity || 1)), 0);

  const displayTaxRate = billing.taxRate !== undefined
    ? Number(billing.taxRate)
    : taxRate;

  const discount = billing.discountAmount !== undefined
    ? billing.discountAmount
    : (record.discount ? parseFloat(record.discount) : 0);

  const taxableAmount = Math.max(0, subtotal - discount);

  const tax = billing.taxAmount !== undefined
    ? billing.taxAmount
    : Math.round(taxableAmount * (displayTaxRate / 100));

  const totalAmount = billing.grandTotalEstimate !== undefined
    ? billing.grandTotalEstimate
    : (billing.finalAmount !== undefined ? billing.finalAmount : taxableAmount + tax);

  const discountReason = billing.discountReason || record.discountReason || record.header?.discountReason || record.servicesAndMaintenanceTasks?.discountReason || record.discount_reason || record.header?.discount_reason || record.jobCard?.discountReason || '';
  const customerComplaint = record.customerComplaint || record.header?.customerComplaint || billing.customerComplaint || record.servicesAndMaintenanceTasks?.customerComplaint || record.customer_complaint || record.header?.customer_complaint || record.jobCard?.customerComplaint || '';
  const additionalNotes = record.additionalNotes || record.header?.additionalNotes || billing.additionalNotes || record.servicesAndMaintenanceTasks?.additionalNotes || record.additional_notes || record.header?.additional_notes || record.jobCard?.additionalNotes || '';
  const hasAdditionalDetails = false;

  // Extract all uploaded vehicle condition photos
  const rawUploadedPhotos = [];
  if (record.digitalConditionPhotos && Array.isArray(record.digitalConditionPhotos)) {
    record.digitalConditionPhotos.forEach(p => {
      const photoUrl = p.fileUrl ? p.fileUrl : (p.fileName ? `${base_url}${p.fileName}` : '');
      if (photoUrl) {
        rawUploadedPhotos.push({
          id: p.id || String(Math.random()),
          uri: photoUrl,
          label: p.category ? p.category.replace('_', ' ') : 'Vehicle Photo'
        });
      }
    });
  } else if (record.photos) {
    Object.keys(record.photos).forEach(key => {
      const photosArray = record.photos[key];
      if (Array.isArray(photosArray)) {
        photosArray.forEach(p => {
          if (p && p.uri) {
            rawUploadedPhotos.push({
               ...p,
               label: key.toUpperCase()
            });
          }
        });
      }
    });
  } else if (record.rawItem?.vehiclePhotos) {
    if (Array.isArray(record.rawItem.vehiclePhotos)) {
      record.rawItem.vehiclePhotos.forEach(p => {
        const photoUrl = p.photoPath ? (p.photoPath.startsWith('http') ? p.photoPath : `${base_url}${p.photoPath}`) : p.uri;
        if (photoUrl) {
          rawUploadedPhotos.push({
            id: p.id || String(Math.random()),
            uri: photoUrl,
            label: p.category ? p.category.replace('_', ' ') : 'Vehicle Photo'
          });
        }
      });
    }
  }

  // Group photos by category
  const groupedPhotosMap = new Map();
  rawUploadedPhotos.forEach(photo => {
    let category = photo.label ? photo.label.toUpperCase() : '';
    let normalizedCategory = '';
    
    if (category.includes('FRONT')) normalizedCategory = 'FRONT VIEW';
    else if (category.includes('REAR')) normalizedCategory = 'REAR VIEW';
    else if (category.includes('LEFT')) normalizedCategory = 'LEFT SIDE';
    else if (category.includes('RIGHT')) normalizedCategory = 'RIGHT SIDE';
    else if (category.includes('DAMAGE')) normalizedCategory = 'DAMAGE';
    else normalizedCategory = 'ADDITIONAL';
    
    if (!groupedPhotosMap.has(normalizedCategory)) {
      groupedPhotosMap.set(normalizedCategory, { 
        ...photo, 
        label: normalizedCategory,
        allUris: [photo.uri]
      });
    } else {
      groupedPhotosMap.get(normalizedCategory).allUris.push(photo.uri);
    }
  });

  const uploadedPhotos = Array.from(groupedPhotosMap.values()).filter(photo => photo.label !== 'ADDITIONAL');
  
  // Extract customer signature
  const signatureUrl = record.customerSignature?.fileUrl || record.signature || record.header?.signature || record.jobCard?.signature || '';

  const isLoading = loading || !record || Object.keys(record).length === 0;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.headerBackground} />
        {/* Premium Navigation Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ChevronLeft size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Record Details</Text>
          <View style={{ width: 38 }} />
        </View>
        <RecordDetailSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      {/* Decorative curved background for the header */}
      <View style={styles.headerBackground} />

      {/* Premium Navigation Header */}
      <View style={[styles.header, isDelivered && { justifyContent: 'flex-start', gap: 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Record Details</Text>
        {!isDelivered ? (
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('JobCardWizard', {
                isEdit: true,
                jobCardId: actualId,
                record: record,
              });
            }}
            style={styles.backButton}
          >
            <Edit2 size={18} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 38 }} />
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >

        {/* Profile Card / Hero Section */}
        <View style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View style={[styles.avatarCircle, { backgroundColor: isCreated ? colors.successSoft : colors.primarySoft }]}>
              <Text style={[styles.avatarText, { color: isCreated ? colors.success : colors.primary }]}>{initials}</Text>
            </View>
            <View style={styles.heroMeta}>
              <Text style={styles.ownerName} numberOfLines={1}>{header.customerName}</Text>
              <Text style={styles.vehicleSubtitle}>
                {header.mobileNo}
                {customer?.alternateMobileNo ? ` / ${customer.alternateMobileNo}` : ''}
              </Text>
              {header.emailId && (
                <Text style={styles.vehicleSubtitle}>{header.emailId}</Text>
              )}
              <Text style={styles.vehicleSubtitle}>{customer?.billingAddress}</Text>
            </View>
            <View style={styles.plateBadge}>
              <Text style={styles.plateText}>{header.registrationNumber}</Text>
            </View>
          </View>

          <View style={styles.heroDivider} />

          <View style={styles.heroFooter}>
            {header.expectedDeliveryAt ? (
              <View style={styles.footerItem}>
                <Clock size={13} color={colors.primary} />
                <Text style={[styles.footerItemText, { color: colors.primary, fontFamily: fonts.inter }]}>
                  Expected Delivery: {formatDate(header.expectedDeliveryAt)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Section 1: Vehicle Specifications */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconContainer}>
              <Car size={18} color={colors.primaryDeep} />
            </View>
            <Text style={styles.sectionTitle}>Vehicle Specifications</Text>
          </View>
          <View style={styles.specGrid}>
            <View style={styles.gridCell}>
              <Text style={styles.cellLabel}>Brand</Text>
              <Text style={styles.cellValue}>{vehicle.brand.name}</Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.cellLabel}>Vehicle Model</Text>
              <Text style={styles.cellValue}>{vehicle.model}</Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.cellLabel}>Fuel Type</Text>
              <Text style={styles.cellValue}>{vehicle.fuelType}</Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.cellLabel}>Color</Text>
              <Text style={styles.cellValue}>{vehicle.color}</Text>
            </View>
            {vehicle.chassisNo && (
              <View style={styles.gridCell}>
                <Text style={styles.cellLabel}>Chassis Number</Text>
                <Text style={styles.cellValue} numberOfLines={1} adjustsFontSizeToFit>{vehicle.chassisNo}</Text>
              </View>
            )}

            {vehicle.engineNo && (
              <View style={styles.gridCell}>
                <Text style={styles.cellLabel}>Engine Number</Text>
                <Text style={styles.cellValue} numberOfLines={1} adjustsFontSizeToFit>{vehicle.engineNo}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Section 3: Services Ordered */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconContainer}>
              <Wrench size={18} color={colors.primaryDeep} />
            </View>
            <Text style={styles.sectionTitle}>Services & Maintenance Tasks</Text>
          </View>

          {services.length === 0 ? (
            <View style={{ alignItems: 'center', padding: spacing.md }}>
              <Wrench size={20} color="#94A3B8" />
              <Text style={{ fontFamily: fonts.inter, fontSize: 13, color: colors.mutedText, marginTop: 8 }}>
                No services ordered
              </Text>
            </View>
          ) : (
            <>
              {/* Services Table */}
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.columnTitle, { flex: 3 }]}>Task / Description</Text>
                <Text style={[styles.columnTitle, { flex: 1, textAlign: 'center' }]}>Qty</Text>
                <Text style={[styles.columnTitle, { flex: 1.5, textAlign: 'right' }]}>Total</Text>
              </View>

              {services.map((item, idx) => (
                <View key={item.id || idx} style={styles.tableRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 3, gap: 6 }}>
                    <ChevronRight size={12} color={colors.primary} />
                    <Text style={[styles.columnValue, { fontFamily: fonts.inter, flex: 1 }]} numberOfLines={1}>
                      {item.name || item.serviceItem || item.serviceItemName || 'General Service'}
                    </Text>
                  </View>
                  <Text style={[styles.columnValue, { flex: 1, textAlign: 'center', color: colors.mutedText }]}>
                    {item.quantity || 1}
                  </Text>
                  <Text style={[styles.columnValue, { flex: 1.5, textAlign: 'right', fontFamily: fonts.inter }]}>
                    <Text style={{ fontFamily: fonts.inter }}>₹</Text>{(item.price || item.unitPrice || 0) * (item.quantity || 1)}
                  </Text>
                </View>
              ))}
            </>
          )}

          {/* Billing Calculations */}
          <View style={styles.calculationSection}>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Service Subtotal</Text>
              <Text style={styles.calcValue}><Text style={{ fontFamily: fonts.inter }}>₹</Text>{subtotal}</Text>
            </View>
            {discount > 0 && (
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Discount</Text>
                <Text style={[styles.calcValue, { color: colors.danger }]}>-<Text style={{ fontFamily: fonts.inter }}>₹</Text>{discount}</Text>
              </View>
            )}
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Estimated GST ({displayTaxRate}%)</Text>
              <Text style={styles.calcValue}><Text style={{ fontFamily: fonts.inter }}>₹</Text>{tax}</Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Grand Total Estimate</Text>
              <Text style={styles.totalValue}><Text style={{ fontFamily: fonts.inter }}>₹</Text>{totalAmount}</Text>
            </View>
          </View>
        </View>

        {/* Section 3.5: Additional Details */}
        {hasAdditionalDetails && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconContainer}>
                <FileText size={18} color={colors.primaryDeep} />
              </View>
              <Text style={styles.sectionTitle}>Additional Details</Text>
            </View>

            {customerComplaint ? (
              <View style={styles.contactRow}>
                <View style={styles.contactDetail}>
                  <Text style={styles.contactLabel}>Customer Complaint</Text>
                  <Text style={styles.contactValue}>{customerComplaint}</Text>
                </View>
              </View>
            ) : null}

            {discountReason ? (
              <View style={styles.contactRow}>
                <View style={styles.contactDetail}>
                  <Text style={styles.contactLabel}>Discount Reason</Text>
                  <Text style={styles.contactValue}>{discountReason}</Text>
                </View>
              </View>
            ) : null}

            {additionalNotes ? (
              <View style={styles.contactRow}>
                <View style={styles.contactDetail}>
                  <Text style={styles.contactLabel}>Additional Notes</Text>
                  <Text style={styles.contactValue}>{additionalNotes}</Text>
                </View>
              </View>
            ) : null}
          </View>
        )}

        {/* Section 4: Digital Vehicle Inspection Photos */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconContainer}>
              <Camera size={18} color={colors.primaryDeep} />
            </View>
            <Text style={styles.sectionTitle}>Digital Condition Photos</Text>
          </View>
          {uploadedPhotos.length === 0 ? (
            <View style={{ alignItems: 'center', padding: spacing.md }}>
              <Camera size={24} color="#94A3B8" />
              <Text style={{ fontFamily: fonts.inter, fontSize: 13, color: colors.mutedText, marginTop: 8 }}>
                No photos captured
              </Text>
            </View>
          ) : (
            <View style={styles.photoGrid}>
              {uploadedPhotos.map((photo, index) => (
                <TouchableOpacity
                  key={photo.id || index}
                  style={styles.photoFrame}
                  activeOpacity={0.9}
                  onPress={() => setSelectedPhotoGroup(photo.allUris)}
                >
                  <Image
                    source={{ uri: photo.uri }}
                    style={{ width: '100%', height: 100, borderRadius: radius.md }}
                    resizeMode="cover"
                  />
                  {photo.allUris && photo.allUris.length > 1 && (
                    <View style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      backgroundColor: 'rgba(0, 0, 0, 0.65)',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}>
                      <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>
                        1 of {photo.allUris.length}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.photoFrameTitle}>{photo.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Customer Signature Card */}
        {signatureUrl ? (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconContainer}>
                <Edit2 size={18} color={colors.primaryDeep} />
              </View>
              <Text style={styles.sectionTitle}>Customer Signature</Text>
            </View>
            <View style={{ alignItems: 'center', marginTop: spacing.md, paddingVertical: spacing.md, backgroundColor: '#F8FAFC', borderRadius: radius.md, borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed' }}>
              <Image
                source={{ uri: signatureUrl }}
                style={{ width: '90%', height: 120 }}
                resizeMode="contain"
              />
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Full-Screen Image Viewer Modal */}
      <Modal
        visible={!!selectedPhotoGroup}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedPhotoGroup(null)}
      >
        <View style={localStyles.modalOverlay}>
          {/* Tap backdrop to close */}
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setSelectedPhotoGroup(null)}
          />

          {/* Zoomable Image Container with Swipe Support */}
          <View style={localStyles.imageContainer}>
            {selectedPhotoGroup && (
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={true}
                contentContainerStyle={{ alignItems: 'center' }}
              >
                {selectedPhotoGroup.map((uri, index) => (
                  <View key={index} style={{ width: Dimensions.get('window').width * 0.95, height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                    <ZoomableImage uri={uri} />
                    {selectedPhotoGroup.length > 1 && (
                      <View style={localStyles.imageCounter}>
                        <Text style={localStyles.imageCounterText}>{index + 1} / {selectedPhotoGroup.length}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Close Button */}
          <TouchableOpacity
            style={localStyles.modalCloseButton}
            onPress={() => setSelectedPhotoGroup(null)}
          >
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = recordDetailStyles;

const localStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: '95%',
    height: '75%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  imageCounter: {
    position: 'absolute',
    bottom: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  imageCounterText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
