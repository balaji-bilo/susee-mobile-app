import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { View } from 'react-native';
import styles from '../../styles/customerInfoStepStyles';
import { CardTitle } from '../../../common/components/CardTitle';
import { FloatingInput } from '../../../common/components/FloatingInput';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9]{10}$/;
const NAME_REGEX = /^[a-zA-Z\s]+$/;

export const CustomerInfoStep = forwardRef(function CustomerInfoStep({ formData, setFormData, width }, ref) {
  const [errors, setErrors] = useState({});

  useImperativeHandle(ref, () => ({
    validate() {
      const info = formData.customerInfo;
      const newErrors = {};

      // Owner Name checks
      const fullName = info.fullName?.trim() || '';
      if (!fullName) {
        newErrors.fullName = 'Owner Name is required';
      } else if (fullName.length < 3) {
        newErrors.fullName = 'Owner Name must be at least 3 characters';
      } else if (!NAME_REGEX.test(fullName)) {
        newErrors.fullName = 'Owner Name can only contain letters';
      }

      // Primary Mobile checks
      const mobileNo = info.mobileNo?.trim() || '';
      if (!mobileNo) {
        newErrors.mobileNo = 'Mobile Number is required';
      } else if (!PHONE_REGEX.test(mobileNo)) {
        newErrors.mobileNo = 'Enter a valid 10-digit mobile number';
      }

      // Alternate Mobile checks (optional format validation)
      const altMobile = info.alternateMobileNo?.trim();
      if (altMobile) {
        if (!PHONE_REGEX.test(altMobile)) {
          newErrors.alternateMobileNo = 'Enter a valid 10-digit mobile number';
        } else if (altMobile === mobileNo) {
          newErrors.alternateMobileNo = 'Alternate number cannot be the same as primary mobile number';
        }
      }

      // Email checks (optional format validation)
      const emailVal = info.email?.trim();
      if (emailVal && !EMAIL_REGEX.test(emailVal)) {
        newErrors.email = 'Enter a valid email address';
      }

      // Address checks
      const addressVal = info.address?.trim() || '';
      if (!addressVal) {
        newErrors.address = 'Address is required';
      } else if (addressVal.length < 3) {
        newErrors.address = 'Address must be at least 3 characters';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
  }));

  const handleChange = (field, val) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    setFormData((c) => ({ ...c, customerInfo: { ...c.customerInfo, [field]: val } }));
  };

  return (
    <View style={styles.container}>
      <CardTitle title="Customer Information" subtitle="Please enter the customer and owner details manually." />
      <View style={[styles.rowContainer, { flexDirection: width > 900 ? 'row' : 'column' }]}>
        <View style={[styles.inputsColumn, width > 900 ? { flex: 1 } : {}]}>
          <FloatingInput
            label="Owner Name"
            required
            value={formData.customerInfo.fullName}
            onChangeText={(val) => handleChange('fullName', val.replace(/[^a-zA-Z\s]/g, ''))}
            error={errors.fullName}
          />
          <FloatingInput
            label="Mobile Number"
            required
            value={formData.customerInfo.mobileNo}
            keyboardType="phone-pad"
            maxLength={10}
            onChangeText={(val) => handleChange('mobileNo', val.replace(/[^0-9]/g, ''))}
            error={errors.mobileNo}
          />
          <FloatingInput
            label="Alternate Number"
            value={formData.customerInfo.alternateMobileNo}
            keyboardType="phone-pad"
            maxLength={10}
            onChangeText={(val) => handleChange('alternateMobileNo', val.replace(/[^0-9]/g, ''))}
            error={errors.alternateMobileNo}
          />
          <FloatingInput
            label="Email"
            value={formData.customerInfo.email}
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={(val) => handleChange('email', val)}
            error={errors.email}
          />
        </View>
        <View style={[styles.inputsColumn, width > 900 ? { flex: 1 } : {}]}>
          <FloatingInput
            label="Address"
            required
            value={formData.customerInfo.address}
            multiline
            numberOfLines={4}
            maxLength={120}
            scrollEnabled
            onChangeText={(val) => handleChange('address', val)}
            error={errors.address}
          />
        </View>
      </View>
    </View>
  );
});
