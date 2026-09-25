import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  Animated, Easing, ScrollView, RefreshControl, Text, View, useWindowDimensions, KeyboardAvoidingView,
  Platform, TouchableOpacity, Keyboard
} from 'react-native';
import Toast from 'react-native-simple-toast';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../common/config/theme';
import { Button } from '../../common/components/Button';
import { Card } from '../../common/components/Card';
import { WizardStepper } from '../components/ui/WizardStepper';
import { Check, ChevronLeft } from 'lucide-react-native';
import axios from 'axios';
import { base_url, form_entry } from '../../common/config/constant';
import { retrieveEncryptedData } from '../../common/config/storage';
import styles from '../styles/jobCardWizardStyles';

import { VehicleInfoStep } from '../components/wizard/VehicleInfoStep';
import { CustomerInfoStep } from '../components/wizard/CustomerInfoStep';
import { ServicesBillingStep } from '../components/wizard/ServicesBillingStep';
import { BillingStep } from '../components/wizard/BillingStep';
import { VehiclePhotosStep } from '../components/wizard/VehiclePhotosStep';

const steps = [
  'Vehicle Information',
  'Customer Information',
  'Services',
  'Billing',
  'Photos',
];

const emptyPhotos = {
  front: [],
  rear: [],
  left: [],
  right: [],
  damage: [],
  additional: [],
};

export function JobCardWizard({ navigation, route, onJobCardCreated }) {
  const isEdit = !!(route.params?.isEdit || route.params?.jobCardId);
  const editRecord = route.params?.record;
  const editJobCardId = route.params?.jobCardId || editRecord?.id;

  const selectedVehicle = useMemo(() => {
    if (route.params?.selectedVehicle) {
      return route.params.selectedVehicle;
    }
    const entry = route.params?.entry;
    if (entry) {
      return {
        id: String(entry.id),
        vehicleNumber: entry.vehicle?.registrationNumber || '',
        ownerName: entry.customer?.name || '',
        vehicleModel: entry.vehicle?.model || '',
        waitingMinutes: entry.waitingMinutes || 0,
        entryType: entry.entryType || 'service',
        gateEntryId: entry.gateEntryId || entry.id,
        make: entry.vehicle?.make || entry.vehicle?.brand || '',
        variant: entry.vehicle?.variant || '',
        fuelType: entry.vehicle?.fuelType || '',
        color: entry.vehicle?.color || '',
        chassisNo: entry.vehicle?.chassisNo || '',
        engineNo: entry.vehicle?.engineNo || '',
        mobileNumber: entry.customer?.mobileNo || '',
        alternateNumber: entry.customer?.alternateMobileNo || '',
        email: entry.customer?.emailId || '',
        address: entry.customer?.address || '',
        taxRate: entry.location?.taxRate !== undefined ? entry.location.taxRate : undefined,
      };
    }
    return null;
  }, [route.params?.selectedVehicle, route.params?.entry]);

  const onClose = useCallback(() => navigation.goBack(), [navigation]);
  const { width } = useWindowDimensions();
  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [nextLoading, setNextLoading] = useState(false);
  const slide = useRef(new Animated.Value(0)).current;
  const stepRef = useRef(null);
  const scrollRef = useRef(null);
  const [refreshing, setRefreshing] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isScrollEnabled, setScrollEnabled] = useState(true);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (isEdit) {
        if (activeStep === 0 && stepRef.current?.fetchBrands) {
          await stepRef.current.fetchBrands();
        } else if (activeStep === 2 && stepRef.current?.fetchServices) {
          await stepRef.current.fetchServices();
        }
        return; // Don't clear form data in edit mode
      }

      if (activeStep === 0) {
        // Only refresh Vehicle Info fields (keeping registrationNo)
        setFormData((c) => ({
          ...c,
          vehicleInfo: {
            registrationNo: c.vehicleInfo.registrationNo,
            model: '',
            brandId: '',
            variant: '',
            fuelType: '',
            color: '',
            chassisNo: '',
            engineNo: '',
          }
        }));
        if (stepRef.current?.fetchBrands) {
          await stepRef.current.fetchBrands();
        }
      } else if (activeStep === 1) {
        // Only refresh Customer Info fields (keeping mobileNo)
        setFormData((c) => ({
          ...c,
          customerInfo: {
            fullName: '',
            mobileNo: c.customerInfo.mobileNo,
            alternateMobileNo: '',
            email: '',
            address: '',
          }
        }));
      } else if (activeStep === 2) {
        // Only refresh Service Items
        setFormData((c) => ({
          ...c,
          serviceItems: [],
        }));
        if (stepRef.current?.fetchServices) {
          await stepRef.current.fetchServices();
        }
      } else if (activeStep === 3) {
        // Only refresh Billing fields
        setFormData((c) => ({
          ...c,
          billing: {
            discount: '',
            customer_approval: '',
            discountReason: '',
            customerComplaint: '',
            additionalNotes: '',
            expectedDeliveryAt: '',
          }
        }));
      } else if (activeStep === 4) {
        // Only refresh Photos
        setFormData((c) => ({
          ...c,
          photos: emptyPhotos,
        }));
      }
    } catch (err) {
      console.log('Error during refresh:', err);
    } finally {
      setRefreshing(false);
    }
  }, [activeStep, isEdit]);

  // Animation values for success overlay
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [taxRate, setTaxRate] = useState(10);

  useEffect(() => {
    const loadTaxRate = async () => {
      try {
        if (selectedVehicle?.taxRate !== undefined) {
          setTaxRate(Number(selectedVehicle.taxRate));
          return;
        }
        const storedTaxRate = await retrieveEncryptedData('taxRate');
        if (storedTaxRate) {
          setTaxRate(Number(storedTaxRate));
        }
      } catch (error) {
        console.error('Error loading taxRate in JobCardWizard:', error);
      }
    };
    loadTaxRate();
  }, [selectedVehicle]);

  const initialState = useMemo(() => {
    if (editRecord) {
      const header = editRecord.header || {};
      const vehicle = editRecord.vehicleSpecifications || editRecord.vehicle || {};
      const customer = editRecord.customerDetails || editRecord.customer || {};
      const billingData = editRecord.servicesAndMaintenanceTasks?.billing || editRecord.billing || {};
      const servicesList = editRecord.servicesAndMaintenanceTasks?.items || editRecord.services || editRecord.serviceItems || [];

      const parsedServiceItems = servicesList.map((item, idx) => ({
        id: item.id ? `svc-${item.id}` : `svc-edit-${idx}-${Date.now()}`,
        serviceItemId: item.serviceItemId || item.id || (idx + 1),
        serviceItem: item.name || item.serviceItem || item.serviceItemName || 'Service',
        category: item.category?.name || item.category || 'Service',
        unitPrice: Number(item.unitPrice || item.price || 0),
        quantity: Number(item.quantity || 1),
      }));

      let extractedSignatureUrl = null;
      let extractedSignatureId = null;
      const parsedPhotos = { front: [], rear: [], left: [], right: [], damage: [], additional: [] };
      if (editRecord.digitalConditionPhotos && Array.isArray(editRecord.digitalConditionPhotos)) {
        editRecord.digitalConditionPhotos.forEach(p => {
          const photoUrl = p.fileUrl ? p.fileUrl : (p.fileName ? `${base_url}${p.fileName}` : '');
          if (photoUrl) {
            const catKey = p.category ? p.category.toLowerCase() : '';
            const photoStr = ((p.fileName || '') + (photoUrl || '')).toLowerCase();
            if (catKey.includes('signature') || photoStr.includes('signature')) {
              extractedSignatureUrl = photoUrl;
              extractedSignatureId = p.id;
            } else {
              let targetKey = 'additional';
              if (catKey.includes('front')) targetKey = 'front';
              else if (catKey.includes('rear')) targetKey = 'rear';
              else if (catKey.includes('left')) targetKey = 'left';
              else if (catKey.includes('right')) targetKey = 'right';
              else if (catKey.includes('damage')) targetKey = 'damage';

              parsedPhotos[targetKey].push({
                id: p.id || String(Math.random()),
                uri: photoUrl,
                name: p.fileName || `photo_${targetKey}.jpg`,
                type: 'image/jpeg'
              });
            }
          }
        });
      } else if (editRecord.photos) {
        Object.keys(editRecord.photos).forEach(key => {
          if (parsedPhotos[key] && Array.isArray(editRecord.photos[key])) {
            const filteredPhotos = [];
            editRecord.photos[key].forEach(photo => {
              const photoStr = (photo.name || photo.uri || '').toLowerCase();
              if (photoStr.includes('signature')) {
                extractedSignatureUrl = photo.uri;
                extractedSignatureId = photo.id;
              } else {
                filteredPhotos.push(photo);
              }
            });
            parsedPhotos[key] = filteredPhotos;
          }
        });
      }

      return {
        gateEntryId: editRecord.gateEntryId || header.gateEntryId || editRecord.id || '',
        serviceItems: parsedServiceItems,
        vehicleInfo: {
          registrationNo: header.registrationNumber || vehicle.registrationNumber || '',
          model: vehicle.model || '',
          brandId: vehicle.brand?.id || vehicle.brand?.name || vehicle.brand || '',
          variant: vehicle.variant || '',
          fuelType: vehicle.fuelType || '',
          color: vehicle.color || '',
          chassisNo: vehicle.chassisNo || '',
          engineNo: vehicle.engineNo || '',
        },
        customerInfo: {
          fullName: header.customerName || customer.fullName || customer.name || '',
          mobileNo: header.mobileNo || customer.mobileNo || '',
          alternateMobileNo: customer.alternateMobileNo || '',
          email: header.emailId || customer.emailId || customer.email || '',
          address: customer.billingAddress || customer.address || '',
        },
        billing: {
          discount: billingData.discountAmount !== undefined ? String(billingData.discountAmount) : (editRecord.discount ? String(editRecord.discount) : ''),
          customer_approval: billingData.customerApproval !== undefined
            ? (billingData.customerApproval ? 'yes' : 'no')
            : (editRecord.customer_approval ?? 'yes'),
          discountReason: billingData.discountReason || editRecord.discountReason || header.discountReason || editRecord.servicesAndMaintenanceTasks?.discountReason || editRecord.discount_reason || header.discount_reason || editRecord.jobCard?.discountReason || '',
          customerComplaint: billingData.customerComplaint || editRecord.customerComplaint || header.customerComplaint || editRecord.servicesAndMaintenanceTasks?.customerComplaint || editRecord.customer_complaint || header.customer_complaint || editRecord.jobCard?.customerComplaint || '',
          additionalNotes: billingData.additionalNotes || editRecord.additionalNotes || header.additionalNotes || editRecord.servicesAndMaintenanceTasks?.additionalNotes || editRecord.additional_notes || header.additional_notes || editRecord.jobCard?.additionalNotes || '',
          expectedDeliveryAt: header.expectedDeliveryAt || editRecord.expectedDeliveryAt || '',
          signature: extractedSignatureUrl || editRecord.customerSignature?.fileUrl || billingData.signature || editRecord.signature || header.signature || editRecord.jobCard?.signature || '',
          signatureId: extractedSignatureId || editRecord.customerSignature?.id || null,
        },
        photos: parsedPhotos,
      };
    }

    return {
      gateEntryId: selectedVehicle?.gateEntryId ?? '',
      serviceItems: [],
      vehicleInfo: {
        registrationNo: selectedVehicle?.vehicleNumber ?? '',
        model: selectedVehicle?.vehicleModel ?? '',
        brandId: selectedVehicle?.make ?? selectedVehicle?.brand ?? '',
        variant: selectedVehicle?.variant ?? '',
        fuelType: selectedVehicle?.fuelType ?? '',
        color: selectedVehicle?.color ?? '',
        chassisNo: '',
        engineNo: '',
      },
      customerInfo: {
        fullName: '',
        mobileNo: selectedVehicle?.mobileNumber ?? '',
        alternateMobileNo: selectedVehicle?.alternateNumber ?? '',
        email: selectedVehicle?.email ?? '',
        address: '',
      },
      billing: {
        discount: '',
        customer_approval: '',
        discountReason: '',
        customerComplaint: '',
        additionalNotes: '',
        expectedDeliveryAt: '',
      },
      photos: emptyPhotos,
    };
  }, [editRecord, selectedVehicle]);

  const [formData, setFormData] = useState(initialState);

  // Console log formData state when it changes
  useEffect(() => {
    console.log('Job Card FormData Changed:', formData);
  }, [formData]);

  useEffect(() => {
    setFormData(initialState);
    setActiveStep(0);
    setSubmitted(false);
    setSubmitting(false);
  }, [initialState]);

  useEffect(() => {
    Animated.timing(slide, {
      toValue: activeStep,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [activeStep, slide]);

  // Scroll to top of forms when the active step changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: 0, animated: false });
    }
  }, [activeStep]);

  // Success animations trigger
  useEffect(() => {
    if (submitted) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 60,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();

      const timer = setTimeout(() => {
        onClose();
      }, 2800);

      return () => clearTimeout(timer);
    }
  }, [submitted, fadeAnim, scaleAnim, pulseAnim, onClose]);

  const billing = useMemo(() => {
    const serviceCharges = formData.serviceItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const discount = Number(formData.billing.discount || 0);
    const taxableAmount = Math.max(0, serviceCharges - discount);
    const tax = Math.round(taxableAmount * (taxRate / 100));
    const finalAmount = taxableAmount + tax;
    return { serviceCharges, tax, discount, finalAmount };
  }, [formData.billing.discount, formData.serviceItems, taxRate]);

  const stepTranslate = slide.interpolate({
    inputRange: [0, 4],
    outputRange: [0, -width * 0.01],
    extrapolate: 'clamp',
  });

  const updateService = (id, changes) => {
    setFormData((current) => ({
      ...current,
      serviceItems: current.serviceItems.map((service) => (service.id === id ? { ...service, ...changes } : service)),
    }));
  };

  const addService = (catalogItem) => {
    if (!catalogItem) return;
    const nextItem = catalogItem;

    // Check if the service is already added
    const existingItem = formData.serviceItems.find((s) => s.serviceItem === nextItem.label);
    if (existingItem) {
      updateService(existingItem.id, { quantity: existingItem.quantity + 1 });
      return;
    }

    setFormData((current) => ({
      ...current,
      serviceItems: [
        ...current.serviceItems,
        {
          id: `svc-${Date.now()}-${Math.random()}`,
          serviceItemId: nextItem.id || 1,
          serviceItem: nextItem.label,
          category: nextItem.category,
          unitPrice: nextItem.price,
          quantity: 1,
        },
      ],
    }));
  };

  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return <VehicleInfoStep ref={stepRef} formData={formData} setFormData={setFormData} width={width} />;
      case 1:
        return <CustomerInfoStep ref={stepRef} formData={formData} setFormData={setFormData} width={width} />;
      case 2:
        return (
          <ServicesBillingStep
            ref={stepRef}
            formData={formData}
            setFormData={setFormData}
            addService={addService}
            updateService={updateService}
          />
        );
      case 3:
        return (
          <BillingStep
            ref={stepRef}
            formData={formData}
            setFormData={setFormData}
            width={width}
            billing={billing}
            taxRate={taxRate}
            setSignatureSaved={(saved) => setFormData((c) => ({ ...c, signatureSaved: saved }))}
            setScrollEnabled={setScrollEnabled}
          />
        );
      case 4:
        return <VehiclePhotosStep ref={stepRef} formData={formData} setFormData={setFormData} scrollRef={scrollRef} />;
      default:
        return null;
    }
  };

  const next = async () => {
    // Run validation on steps that have a validate() method
    if ((activeStep === 0 || activeStep === 1 || activeStep === 2 || activeStep === 3) && stepRef.current?.validate) {
      const valid = stepRef.current.validate();
      if (!valid) return;
    }
    setNextLoading(true);
    // Simulate brief transition delay for visual feedback
    await new Promise((resolve) => setTimeout(resolve, 400));
    setActiveStep((current) => Math.min(steps.length - 1, current + 1));
    setNextLoading(false);
  };
  const previous = () => setActiveStep((current) => Math.max(0, current - 1));

  const createJobCard = async () => {
    const fd = new FormData();
    fd.append('gateEntryId', String(formData.gateEntryId || ''));

    if (formData.billing.expectedDeliveryAt) {
      fd.append('expectedDeliveryAt', new Date(formData.billing.expectedDeliveryAt).toISOString());
    } else {
      fd.append('expectedDeliveryAt', '');
    }

    fd.append('vehicleInfo', JSON.stringify({
      vehicleNumber: formData.vehicleInfo.registrationNo || '',
      vehicleModel: formData.vehicleInfo.model || '',
      brandId: formData.vehicleInfo.brandId || '',
      variant: formData.vehicleInfo.variant || '',
      fuelType: formData.vehicleInfo.fuelType || '',
      color: formData.vehicleInfo.color || '',
      chassisNo: formData.vehicleInfo.chassisNo || '',
      engineNo: formData.vehicleInfo.engineNo || '',
    }));

    fd.append('customerInfo', JSON.stringify({
      ownerName: formData.customerInfo.fullName || '',
      mobileNumber: formData.customerInfo.mobileNo || '',
      alternateNumber: formData.customerInfo.alternateMobileNo || '',
      email: formData.customerInfo.email || '',
      address: formData.customerInfo.address || '',
    }));

    fd.append('serviceItems', JSON.stringify(
      formData.serviceItems.map(item => ({
        serviceItemId: item.serviceItemId,
        quantity: item.quantity,
      }))
    ));

    fd.append('billing', JSON.stringify({
      taxRate: taxRate,
      taxAmount: billing.tax,
      discount: Number(formData.billing.discount || 0),
      discountReason: formData.billing.discountReason || '',
      finalAmount: billing.finalAmount,
      customer_approval: (formData.billing.customer_approval ?? 'yes') === 'yes' ? true : false,
      customerComplaint: formData.billing.customerComplaint || '',
      additionalNotes: formData.billing.additionalNotes || '',
    }));

    fd.append('discountReason', formData.billing.discountReason || '');
    fd.append('customerComplaint', formData.billing.customerComplaint || '');
    fd.append('additionalNotes', formData.billing.additionalNotes || '');

    const photosList = [];
    const categoriesList = [];

    if (formData.billing.signature) {
      if (!formData.billing.signature.startsWith('http')) {
        categoriesList.push('SIGNATURE');
        photosList.push({
          uri: formData.billing.signature,
          name: `signature_${Date.now()}.png`,
          type: 'image/png',
        });
      }
    }

    Object.keys(formData.photos).forEach(key => {
      const fileArray = formData.photos[key];
      if (fileArray && fileArray.length > 0) {
        fileArray.forEach(file => {
          if (file.uri) {
            // Only upload new local files, skip HTTP URLs as React Native FormData cannot upload remote URLs as files
            if (!file.uri.startsWith('#') && !file.uri.startsWith('http')) {
              const photoCat = key.toUpperCase() === 'FRONT' ? 'FRONT_VIEW' :
                key.toUpperCase() === 'REAR' ? 'REAR_VIEW' :
                  (key.toUpperCase() === 'LEFT' || key.toUpperCase() === 'LEFTSIDE') ? 'LEFT_SIDE' :
                    (key.toUpperCase() === 'RIGHT' || key.toUpperCase() === 'RIGHTSIDE') ? 'RIGHT_SIDE' :
                      key.toUpperCase() === 'DAMAGE' ? 'DAMAGE' : 'ADDITIONAL';
              categoriesList.push(photoCat);

              photosList.push({
                uri: file.uri,
                name: file.name || `photo_${key}_${Date.now()}.jpg`,
                type: file.type || 'image/jpeg',
              });
            }
          }
        });
      }
    });

    fd.append('photoCategories', JSON.stringify(categoriesList));
    photosList.forEach(photo => {
      fd.append('photos', photo);
    });

    const token = await retrieveEncryptedData('token');
    console.log('Sending create job-card request to:', `${base_url}${form_entry}`);
    return await axios.post(`${base_url}${form_entry}`, fd, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`,
      },
    });
  };

  const updateJobCard = async () => {
    const fd = new FormData();

    fd.append('vehicleInfo', JSON.stringify({
      registrationNo: formData.vehicleInfo.registrationNo || '',
      brandId: formData.vehicleInfo.brandId || '',
      model: formData.vehicleInfo.model || '',
      variant: formData.vehicleInfo.variant || '',
      fuelType: formData.vehicleInfo.fuelType || '',
      vehicleColor: formData.vehicleInfo.color || '',
      chassisNo: formData.vehicleInfo.chassisNo || '',
      engineNo: formData.vehicleInfo.engineNo || '',
    }));

    fd.append('customerInfo', JSON.stringify({
      fullName: formData.customerInfo.fullName || '',
      mobileNo: formData.customerInfo.mobileNo || '',
      alternateMobileNo: formData.customerInfo.alternateMobileNo || '',
      emailId: formData.customerInfo.email || '',
      address: formData.customerInfo.address || '',
    }));

    fd.append('serviceItems', JSON.stringify(
      formData.serviceItems.map(item => ({
        serviceItemId: item.serviceItemId,
        quantity: item.quantity,
      }))
    ));
    fd.append('billing', JSON.stringify({
      taxRate: taxRate,
      taxAmount: billing.tax,
      discountAmount: Number(formData.billing.discount || 0),
      discountReason: formData.billing.discountReason || '',
      finalAmount: billing.finalAmount,
      customerComplaint: formData.billing.customerComplaint || '',
      additionalNotes: formData.billing.additionalNotes || '',
    }));

    fd.append('customer_approval', (formData.billing.customer_approval ?? 'yes') === 'yes' ? 'YES' : 'NO');
    fd.append('discountReason', formData.billing.discountReason || '');

    if (formData.billing.expectedDeliveryAt) {
      fd.append('expectedDeliveryAt', new Date(formData.billing.expectedDeliveryAt).toISOString());
    } else {
      fd.append('expectedDeliveryAt', '');
    }

    fd.append('customerComplaint', formData.billing.customerComplaint || '');
    fd.append('additionalNotes', formData.billing.additionalNotes || '');

    const photosList = [];
    const categoriesList = [];

    if (formData.billing.signature) {
      if (!formData.billing.signature.startsWith('http')) {
        categoriesList.push('SIGNATURE');
        photosList.push({
          uri: formData.billing.signature,
          name: `signature_${Date.now()}.png`,
          type: 'image/png',
        });
      }
    }

    const allDeletedIds = [];
    if (formData.billing.signature && !formData.billing.signature.startsWith('http') && formData.billing.signatureId) {
      allDeletedIds.push(formData.billing.signatureId);
    }

    const initialPhotoIds = [];
    Object.keys(initialState.photos).forEach(key => {
      if (initialState.photos[key]) {
        initialState.photos[key].forEach(p => {
          if (p.id && typeof p.id === 'number') {
            initialPhotoIds.push(p.id);
          }
        });
      }
    });

    const currentPhotoIds = [];
    Object.keys(formData.photos).forEach(key => {
      if (formData.photos[key]) {
        formData.photos[key].forEach(p => {
          if (p.id && typeof p.id === 'number') {
            currentPhotoIds.push(p.id);
          }
        });
      }
    });

    const deletedPhotoIds = initialPhotoIds.filter(id => !currentPhotoIds.includes(id));
    allDeletedIds.push(...deletedPhotoIds);

    if (allDeletedIds.length > 0) {
      fd.append('deletedMediaIds', JSON.stringify(allDeletedIds));
    }

    Object.keys(formData.photos).forEach(key => {
      const fileArray = formData.photos[key];
      if (fileArray && fileArray.length > 0) {
        fileArray.forEach(file => {
          if (file.uri) {
            // Only upload new local files, skip HTTP URLs
            if (!file.uri.startsWith('#') && !file.uri.startsWith('http')) {
              const photoCat = key.toLowerCase();
              categoriesList.push(photoCat);

              photosList.push({
                uri: file.uri,
                name: file.name || `photo_${key}_${Date.now()}.jpg`,
                type: file.type || 'image/jpeg',
              });
            }
          }
        });
      }
    });

    fd.append('photoCategories', JSON.stringify(categoriesList));
    photosList.forEach(photo => {
      fd.append('photos', photo);
    });

    if (!editJobCardId) {
      throw new Error("Job Card ID is missing. Cannot update.");
    }

    const token = await retrieveEncryptedData('token');
    const updateUrl = `${base_url}/mobile/job-cards/update/${editJobCardId}`;
    console.log('Sending update job-card request to:', updateUrl);

    return await axios.put(updateUrl, fd, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`,
      },
    });
  };

  const submit = async () => {
    // Validate step 4 (photos) before submitting
    if (stepRef.current?.validate) {
      const valid = stepRef.current.validate();
      if (!valid) return;
    }
    setSubmitting(true);
    console.log(`Submitting Job Card (${isEdit ? 'UPDATE' : 'CREATE'})...`);

    try {
      let response;
      if (isEdit && editJobCardId) {
        response = await updateJobCard();
      } else {
        response = await createJobCard();
      }

      console.log('Job Card API Response:', response.data);

      if (response.data && response.data.success) {
        const backendId = response.data.data?.id ||
          response.data.data?.jobCard?.id ||
          response.data.data?.record?.id ||
          response.data.jobCard?.id ||
          response.data.record?.id ||
          response.data.id ||
          response.data.data?.jobCardId ||
          editJobCardId;

        if (onJobCardCreated) {
          onJobCardCreated({
            id: backendId,
            gateEntryId: formData.gateEntryId,
            // Flat fields for UI fallback (RecordScreen etc.)
            vehicleNumber: formData.vehicleInfo.registrationNo,
            vehicleModel: formData.vehicleInfo.model,
            brandId: formData.vehicleInfo.brandId,
            color: formData.vehicleInfo.color,
            ownerName: formData.customerInfo.fullName,
            mobileNumber: formData.customerInfo.mobileNo,
            services: formData.serviceItems,
            discount: formData.billing.discount,
            billing: billing,
            photos: formData.photos,
            chassisNo: formData.vehicleInfo.chassisNo,
            engineNo: formData.vehicleInfo.engineNo,
            // Nested structures for API mapping
            serviceItems: formData.serviceItems.map(item => ({
              serviceItemId: item.serviceItemId,
              quantity: item.quantity,
            })),
            vehicleInfo: {
              ...formData.vehicleInfo,
              brandId: formData.vehicleInfo.brandId,
            },
            customerInfo: formData.customerInfo,
            billingInfo: {
              totalEstimate: billing.finalAmount,
              discount: formData.billing.discount,
              customer_approval: formData.billing.customer_approval ?? 'yes',
              discountReason: formData.billing.discountReason || '',
              customerComplaint: formData.billing.customerComplaint || '',
              additionalNotes: formData.billing.additionalNotes || '',
              expectedDeliveryAt: formData.billing.expectedDeliveryAt || '',
              signature: formData.billing.signature
            },
            date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
          });
        }
        setSubmitted(true);
      } else {
        Toast.show(response.data?.message || `Failed to ${isEdit ? 'update' : 'create'} job card`, Toast.LONG);
      }
    } catch (err) {
      console.error('Error submitting job card:', err);
      Toast.show(
        err.response?.data?.message || err.message || 'An error occurred during submission',
        Toast.LONG
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header bar */}
        <View style={styles.headerBar}>
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <ChevronLeft size={20} color={colors.text} />
              </TouchableOpacity>
              <View>
                <Text style={styles.headerTitle}>{isEdit ? 'Edit Job Card' : 'Create Job Card'}</Text>
                <Text style={styles.headerSubtitle}>
                  {isEdit ? 'Update job card details and services' : 'Premium multi-step vehicle service workflow'}
                </Text>
              </View>
            </View>
          </View>
          <WizardStepper steps={steps} activeStep={activeStep} />
        </View>

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          scrollEnabled={isScrollEnabled}
          onTouchEnd={() => {
            if (!isScrollEnabled) setScrollEnabled(true);
          }}
          onTouchCancel={() => {
            if (!isScrollEnabled) setScrollEnabled(true);
          }}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
        >
          <Animated.View
            style={[styles.stepAnimatedView, { transform: [{ translateY: stepTranslate }] }]}
          >
            <Card style={{ minHeight: 520 }}>{renderStep()}</Card>
          </Animated.View>
        </ScrollView>

        {/* Footer navigation bar */}
        <View style={[styles.footerBar, Platform.OS === 'android' && Platform.Version >= 35 && keyboardHeight > 0 ? { marginBottom: keyboardHeight } : {}]}>
          <Text style={styles.stepLabel}>
            Step {activeStep + 1} of {steps.length}
          </Text>
          <View style={styles.footerButtons}>
            {activeStep > 0 && <Button label="Previous" onPress={previous} variant="secondary" />}
            {activeStep < steps.length - 1 ? (
              <Button label="Next" onPress={next} variant="primary" loading={nextLoading} disabled={nextLoading} />
            ) : (
              <Button
                label={submitting ? (isEdit ? 'Updating...' : 'Submitting...') : submitted ? (isEdit ? 'Updated' : 'Submitted') : (isEdit ? 'Update Job Card' : 'Submit Job Card')}
                onPress={submit}
                variant="primary"
                loading={submitting}
                disabled={submitting}
              />
            )}
          </View>
        </View>

        {/* Success overlay */}
        {submitted ? (
          <Animated.View style={[styles.successOverlay, { opacity: fadeAnim }]}>
            <Animated.View style={[styles.successCard, { transform: [{ scale: scaleAnim }] }]}>
              {/* Animated Pulse Ring */}
              <View style={styles.pulseWrapper}>
                <Animated.View
                  style={[
                    styles.pulseRing,
                    {
                      transform: [{ scale: pulseAnim }],
                      opacity: pulseAnim.interpolate({
                        inputRange: [1, 1.3],
                        outputRange: [0.8, 0],
                      }),
                    },
                  ]}
                />
                <View style={styles.checkCircle}>
                  <Check size={38} color="#FFFFFF" strokeWidth={3} />
                </View>
              </View>

              <Text style={styles.successTitle}>Success!</Text>
              <Text style={styles.successMessage}>
                {isEdit ? 'Job Card updated successfully.' : 'Job Card created successfully. Returning to dashboard...'}
              </Text>
            </Animated.View>
          </Animated.View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
