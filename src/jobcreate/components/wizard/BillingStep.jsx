import React, { forwardRef, useImperativeHandle, useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import styles from '../../styles/billingStepStyles';
import { CardTitle } from '../../../common/components/CardTitle';
import { SummaryCard } from '../../../common/components/SummaryCard';
import { FloatingInput } from '../../../common/components/FloatingInput';
import { colors, spacing, fonts, radius } from '../../../common/config/theme';
import { retrieveEncryptedData } from '../../../common/config/storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, RotateCcw } from 'lucide-react-native';
import Signature from 'react-native-signature-canvas';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch (e) {
    return dateStr;
  }
};

export const BillingStep = forwardRef(function BillingStep({
  formData,
  setFormData,
  width,
  billing,
  taxRate,
  setSignatureSaved,
  setScrollEnabled,
}, ref) {
  const [errors, setErrors] = useState({});
  const [localTaxRate, setLocalTaxRate] = useState(10);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCanvas, setShowCanvas] = useState(!formData.billing.signature);
  const signatureRef = useRef(null);

  useEffect(() => {
    const loadStoredTaxRate = async () => {
      try {
        const storedRate = await retrieveEncryptedData('taxRate');
        if (storedRate) {
          setLocalTaxRate(Number(storedRate));
        } else if (taxRate !== undefined) {
          setLocalTaxRate(Number(taxRate));
        }
      } catch (err) {
        console.error('Error loading stored taxRate in BillingStep:', err);
      }
    };
    loadStoredTaxRate();
  }, [taxRate]);

  useImperativeHandle(ref, () => ({
    validate() {
      const newErrors = {};
      if (!formData.billing.expectedDeliveryAt) {
        newErrors.expectedDeliveryAt = 'Expected delivery date is required';
      }

      if (!formData.billing.signature) {
        newErrors.signature = 'Customer signature is required';
      }
      const discountNum = Number(formData.billing.discount || 0);
      const maxDiscount = billing.serviceCharges + billing.tax;
      if (discountNum > maxDiscount) {
        newErrors.discount = `Discount cannot exceed total amount (Rs ${maxDiscount})`;
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }
  }));

  return (
    <View style={styles.container}>
      <CardTitle title="Billing & Signature" subtitle="Review service totals, apply discounts, and sign to confirm." />

      <View style={[styles.rowContainer, { flexDirection: width > 900 ? 'row' : 'column' }]}>
        <View style={[styles.inputsColumn, width > 900 ? { flex: 1 } : {}]}>
          <SummaryCard
            title="Billing Summary"
            rows={[
              { label: 'Service Charges', value: `Rs ${billing.serviceCharges}` },
              { label: 'Discount', value: `Rs ${billing.discount}` },
              { label: `Tax (${localTaxRate}%)`, value: `Rs ${billing.tax}` },
              { label: 'Final Amount', value: `Rs ${billing.finalAmount}`, emphasize: true },
            ]}
          />
          <FloatingInput
            label="Discount"
            value={formData.billing.discount}
            placeholder="Enter the Discount"
            error={errors.discount}
            keyboardType="number-pad"
            onChangeText={(value) => {
              const cleaned = value.replace(/[^0-9]/g, '');
              const discountNum = Number(cleaned || 0);
              const maxDiscount = billing.serviceCharges;

              if (discountNum > maxDiscount) {
                setErrors((prev) => ({
                  ...prev,
                  discount: `Discount cannot exceed service charges (Rs ${maxDiscount})`,
                }));
              } else {
                setErrors((prev) => ({
                  ...prev,
                  discount: undefined,
                }));
              }

              setFormData((current) => ({
                ...current,
                billing: { ...current.billing, discount: cleaned }
              }));
            }}
          />

          {Number(formData.billing.discount) > 0 && (
            <FloatingInput
              label="Discount Reason"
              value={formData.billing.discountReason || ''}
              onChangeText={(value) => setFormData((current) => ({
                ...current,
                billing: { ...current.billing, discountReason: value }
              }))}
            />
          )}

          <FloatingInput
            label="Customer Complaint"
            value={formData.billing.customerComplaint || ''}
            multiline
            numberOfLines={3}
            onChangeText={(value) => setFormData((current) => ({
              ...current,
              billing: { ...current.billing, customerComplaint: value }
            }))}
          />

          <FloatingInput
            label="Additional Notes"
            value={formData.billing.additionalNotes || ''}
            multiline
            numberOfLines={3}
            onChangeText={(value) => setFormData((current) => ({
              ...current,
              billing: { ...current.billing, additionalNotes: value }
            }))}
          />

          <View style={{ marginTop: spacing.xs }}>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <View style={{
                minHeight: 58,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: errors.expectedDeliveryAt
                  ? colors.danger
                  : (showDatePicker || formData.billing.expectedDeliveryAt ? colors.primary : colors.border),
                backgroundColor: colors.surface,
                paddingHorizontal: spacing.md,
                justifyContent: 'center',
                position: 'relative'
              }}>
                <Text style={{
                  position: 'absolute',
                  left: spacing.md,
                  top: 7,
                  fontSize: 11,
                  fontFamily: fonts.inter,
                  color: errors.expectedDeliveryAt
                    ? colors.danger
                    : (formData.billing.expectedDeliveryAt ? colors.primary : colors.mutedText),
                  backgroundColor: colors.surface,
                  paddingHorizontal: 4,
                  zIndex: 1,
                  fontWeight: '600'
                }}>
                  Expected Delivery Date <Text style={{ color: colors.danger }}>*</Text>
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12 }}>
                  <Text style={{
                    fontSize: 14,
                    fontFamily: fonts.inter,
                    color: formData.billing.expectedDeliveryAt ? colors.text : colors.mutedText,
                  }}>
                    {formData.billing.expectedDeliveryAt
                      ? formatDate(formData.billing.expectedDeliveryAt)
                      : 'Select Date'}
                  </Text>
                  <Calendar size={20} color={errors.expectedDeliveryAt ? colors.danger : (formData.billing.expectedDeliveryAt ? colors.primary : colors.mutedText)} />
                </View>
              </View>
            </TouchableOpacity>

            {errors.expectedDeliveryAt && (
              <Text style={{
                fontSize: 11,
                fontFamily: fonts.inter,
                color: colors.danger,
                marginTop: 4,
                marginLeft: spacing.xs,
              }}>
                {errors.expectedDeliveryAt}
              </Text>
            )}

            {showDatePicker && (
              <DateTimePicker
                value={formData.billing.expectedDeliveryAt ? new Date(formData.billing.expectedDeliveryAt) : new Date()}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setErrors((prev) => ({ ...prev, expectedDeliveryAt: undefined }));
                    setFormData((current) => ({
                      ...current,
                      billing: { ...current.billing, expectedDeliveryAt: selectedDate.toISOString() }
                    }));
                  }
                }}
              />
            )}
          </View>

          {/* Signature Canvas UI */}
          <View style={{ marginTop: spacing.xl }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, paddingRight: spacing.md }}>
                <Text style={{
                  fontSize: 14,
                  fontFamily: fonts.inter,
                  fontWeight: '600',
                  color: colors.text,
                  marginBottom: spacing.xs
                }}>
                  Customer Signature <Text style={{ color: colors.danger }}>*</Text>
                </Text>
                <Text style={{
                  fontSize: 12,
                  fontFamily: fonts.inter,
                  color: colors.mutedText,
                  marginBottom: spacing.md
                }}>
                  Please sign below to confirm the final amount and details.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  signatureRef.current?.clearSignature();
                  setFormData((current) => ({
                    ...current,
                    billing: { ...current.billing, signature: null }
                  }));
                  setShowCanvas(true);
                  if (setSignatureSaved) setSignatureSaved(false);
                }}
                style={{
                  padding: spacing.sm,
                  backgroundColor: colors.surface,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <RotateCcw size={16} color={colors.primary} />
                <Text style={{ fontSize: 12, fontFamily: fonts.inter, color: colors.primary, marginLeft: 6, fontWeight: '500' }}>Clear</Text>
              </TouchableOpacity>
            </View>

            <View style={{
              height: 200,
              borderWidth: 1,
              borderColor: errors.signature ? colors.danger : colors.border,
              borderRadius: radius.md,
              overflow: 'hidden',
              backgroundColor: colors.surface,
            }}>
              {!showCanvas && formData.billing.signature ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Image
                    source={{ uri: formData.billing.signature }}
                    style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
                  />
                </View>
              ) : (
                <Signature
                  ref={signatureRef}
                  onBegin={() => setScrollEnabled && setScrollEnabled(false)}
                  onEnd={() => {
                    if (setScrollEnabled) setScrollEnabled(true);
                    signatureRef.current?.readSignature();
                  }}
                  onOK={(sig) => {
                    if (setSignatureSaved) setSignatureSaved(true);
                    setFormData((current) => ({
                      ...current,
                      billing: { ...current.billing, signature: sig }
                    }));
                    setErrors((prev) => ({ ...prev, signature: undefined }));
                  }}
                  onEmpty={() => {
                    if (setSignatureSaved) setSignatureSaved(false);
                  }}
                  descriptionText="Sign above"
                  clearText="Clear"
                  confirmText="Save"
                  webStyle={`
                    body,html { width: 100%; height: 100%; touch-action: none; overscroll-behavior: none; }
                    .m-signature-pad { box-shadow: none; border: none; margin: 0; padding: 0; touch-action: none; }
                    .m-signature-pad--body { border: none; bottom: 0px; touch-action: none; }
                    .m-signature-pad--footer { display: none; }
                  `}
                />
              )}
            </View>
            {errors.signature && (
              <Text style={{
                fontSize: 11,
                fontFamily: fonts.inter,
                color: colors.danger,
                marginTop: 4,
                marginLeft: spacing.xs,
              }}>
                {errors.signature}
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
});
