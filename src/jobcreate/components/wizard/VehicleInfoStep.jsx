import React, { forwardRef, useImperativeHandle, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View } from 'react-native';
import styles from '../../styles/vehicleInfoStepStyles';
import { CardTitle } from '../../../common/components/CardTitle';
import { FloatingInput } from '../../../common/components/FloatingInput';
import { DropdownInput } from '../../../common/components/DropdownInput';
import axios from 'axios';
import { base_url, brands_list, lookup_vehicle } from '../../../common/config/constant';
import { retrieveEncryptedData } from '../../../common/config/storage';
import { Car } from 'lucide-react-native';

const REQUIRED_FIELDS = ['model', 'brandId', 'variant', 'fuelType', 'color'];
const FIELD_LABELS = {
  model: 'Vehicle Model',
  brandId: 'Brand',
  variant: 'Variant',
  fuelType: 'Fuel Type',
  color: 'Color',
};

// Format validation for optional fields
const CHASSIS_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;
const ENGINE_REGEX = /^[A-Z0-9-]{6,20}$/;

export const VehicleInfoStep = forwardRef(function VehicleInfoStep({ formData, setFormData, width }, ref) {
  const [errors, setErrors] = useState({});
  const [brands, setBrands] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const isMountedRef = useRef(true);
  const initialBrandRef = useRef(formData.vehicleInfo.brandId);

  const brandOptions = useMemo(() => {
    const opts = brands.map((b) => ({ label: b.name, value: b.id }));
    const currentVal = formData.vehicleInfo.brandId;
    if (currentVal) {
      const currentValStr = String(currentVal).toLowerCase();
      const hasMatch = opts.some((opt) =>
        String(opt.value).toLowerCase() === currentValStr ||
        String(opt.label).toLowerCase() === currentValStr
      );
      if (!hasMatch) {
        opts.unshift({ label: String(currentVal), value: currentVal });
      }
    }
    return opts;
  }, [brands, formData.vehicleInfo.brandId]);

  const fetchBrands = useCallback(async () => {
    setLoadingBrands(true);
    try {
      const token = await retrieveEncryptedData('token');
      const authToken = token;
      const response = await axios.get(`${base_url}${brands_list}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.data && response.data.success && response.data.data && response.data.data.brands) {
        if (isMountedRef.current) {
          const fetchedBrands = response.data.data.brands;
          setBrands(fetchedBrands);

          // Resolve brand name to brand ID
          const currentBrand = initialBrandRef.current;
          if (currentBrand) {
            const matched = fetchedBrands.find(
              b => String(b.name).toLowerCase() === String(currentBrand).toLowerCase() || String(b.id) === String(currentBrand)
            );
            if (matched) {
              setFormData(c => ({
                ...c,
                vehicleInfo: {
                  ...c.vehicleInfo,
                  brandId: matched.id
                }
              }));
            }
          }
        }
      }
    } catch (error) {
      console.log('Error fetching brands:', error);
    } finally {
      if (isMountedRef.current) {
        setLoadingBrands(false);
      }
    }
  }, [setFormData]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchBrands();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchBrands]);

  // Expose validate() and fetchBrands() so the parent wizard can call them
  useImperativeHandle(ref, () => ({
    fetchBrands,
    validate() {
      const newErrors = {};
      REQUIRED_FIELDS.forEach((field) => {
        const val = formData.vehicleInfo[field];
        if (val === undefined || val === null || !String(val).trim()) {
          newErrors[field] = `${FIELD_LABELS[field]} is required`;
        }
      });

      // Optional format checks — only if a value has been entered
      const chassis = formData.vehicleInfo.chassisNo?.trim();
      if (chassis && !CHASSIS_REGEX.test(chassis)) {
        newErrors.chassisNo = 'Chassis No. must be exactly 17 uppercase alphanumeric characters';
      }

      const engine = formData.vehicleInfo.engineNo?.trim();
      if (engine && !ENGINE_REGEX.test(engine)) {
        newErrors.engineNo = 'Engine No. must be 6–20 uppercase letters, digits or hyphens';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
  }));

  const handleVehicleLookup = async () => {
    const regNo = formData.vehicleInfo.registrationNo?.replace(/\s/g, '').trim();
    if (!regNo) return;

    try {
      const token = await retrieveEncryptedData('token');
      const authToken = token;

      const response = await axios.get(`${base_url}${lookup_vehicle}?vehicleNumber=${encodeURIComponent(regNo)}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data?.success && response.data?.data) {
        const data = response.data.data;
        console.log('Vehicle Lookup Data:', data);

        setFormData(c => ({
          ...c,
          vehicleInfo: {
            ...c.vehicleInfo,
            model: data.model || c.vehicleInfo.model,
            brandId: data.brand?.id || data.brand?.name || data.brandId || data.brand_id || data.brandName || data.make || c.vehicleInfo.brandId,
            variant: data.variant || c.vehicleInfo.variant,
            fuelType: data.fuelType || c.vehicleInfo.fuelType,
            color: data.color || c.vehicleInfo.color,
            chassisNo: data.chassisNo || c.vehicleInfo.chassisNo,
            engineNo: data.engineNo || c.vehicleInfo.engineNo,
          },
          customerInfo: {
            ...c.customerInfo,
            fullName: data.customer?.name || data.customer?.fullName || data.customerName || data.ownerName || data.customer_name || data.name || c.customerInfo.fullName,
            mobileNo: data.customer?.mobileNo || data.mobileNo || data.mobile_no || c.customerInfo.mobileNo,
            alternateMobileNo: data.customer?.alternateMobileNo || data.alternateMobileNo || c.customerInfo.alternateMobileNo,
            email: data.customer?.emailId || data.customer?.email || data.emailId || data.email || c.customerInfo.email,
            address: data.customer?.address || data.address || c.customerInfo.address,
          }
        }));
      }
    } catch (error) {
      console.log('Vehicle lookup error:', error);
    }
  };

  const hasLookedUp = useRef(false);
  useEffect(() => {
    // Automatically trigger lookup if registration number is already present on mount
    const regNo = formData.vehicleInfo.registrationNo?.trim();
    if (regNo && !hasLookedUp.current) {
      hasLookedUp.current = true;
      handleVehicleLookup();
    }
  }, []);

  const handleChange = (field, val) => {
    // Clear error as soon as the user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    setFormData((c) => ({ ...c, vehicleInfo: { ...c.vehicleInfo, [field]: val } }));
  };

  return (
    <View style={styles.container}>
      <CardTitle title="Vehicle Information" subtitle="Verify and update the details of the selected vehicle." />

      <View style={[styles.rowContainer, { flexDirection: width > 900 ? 'row' : 'column' }]}>
        <View style={[styles.inputsColumn, width > 900 ? { flex: 1 } : {}]}>
          <FloatingInput
            label="Vehicle Number"
            required
            value={formData.vehicleInfo.registrationNo}
            onChangeText={(val) => handleChange('registrationNo', val)}
            onBlur={handleVehicleLookup}
          />
          <DropdownInput
            label="Brand"
            required
            value={formData.vehicleInfo.brandId}
            options={brandOptions}
            onSelect={(val) => handleChange('brandId', val)}
            error={errors.brandId}
            icon={Car}
          />
          <FloatingInput
            label="Vehicle Model"
            required
            value={formData.vehicleInfo.model}
            onChangeText={(val) => handleChange('model', val)}
            error={errors.model}
          />
          <FloatingInput
            label="Chassis Number"
            value={formData.vehicleInfo.chassisNo}
            autoCapitalize="characters"
            onChangeText={(val) => handleChange('chassisNo', val.toUpperCase())}
            error={errors.chassisNo}
            maxLength={17}
          />
        </View>
        <View style={[styles.inputsColumn, width > 900 ? { flex: 1 } : {}]}>
          <FloatingInput
            label="Variant"
            required
            value={formData.vehicleInfo.variant}
            onChangeText={(val) => handleChange('variant', val)}
            error={errors.variant}
          />
          <DropdownInput
            label="Fuel Type"
            required
            value={formData.vehicleInfo.fuelType}
            options={[
              { label: 'Petrol', value: 'petrol' },
              { label: 'Diesel', value: 'diesel' },
              { label: 'CNG', value: 'cng' },
              { label: 'EV', value: 'ev' },
              { label: 'Hybrid', value: 'hybrid' },
            ]}
            onSelect={(val) => handleChange('fuelType', val)}
            error={errors.fuelType}
          />
          <FloatingInput
            label="Color"
            required
            value={formData.vehicleInfo.color}
            onChangeText={(val) => handleChange('color', val)}
            error={errors.color}
          />
          <FloatingInput
            label="Engine Number"
            value={formData.vehicleInfo.engineNo}
            autoCapitalize="characters"
            onChangeText={(val) => handleChange('engineNo', val.toUpperCase())}
            error={errors.engineNo}
            maxLength={20}
          />
        </View>
      </View>
    </View>
  );
});
