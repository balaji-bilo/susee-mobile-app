import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { colors } from '../../../common/config/theme';
import styles from '../../styles/servicesBillingStepStyles';
import { CardTitle } from '../../../common/components/CardTitle';
import axios from 'axios';
import { base_url, service_items_list } from '../../../common/config/constant';
import { retrieveEncryptedData } from '../../../common/config/storage';
import {
  Wrench,
  Plus,
  Minus,
  Trash2,
  AlertCircle,
  ChevronDown
} from 'lucide-react-native';

export const ServicesBillingStep = forwardRef(function ServicesBillingStep({
  formData,
  setFormData,
  addService,
  updateService,
}, ref) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [serviceError, setServiceError] = useState('');
  const isMountedRef = useRef(true);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const token = await retrieveEncryptedData('token');
      console.log('Fetching service items with token:', token ? 'Token exists' : 'No token');
      const response = await axios.get(`${base_url}${service_items_list}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data && response.data.success && response.data.data && response.data.data.serviceItems) {
        const formatted = response.data.data.serviceItems.map(item => ({
          id: item.id,
          label: item.name,
          category: item.category,
          price: Number(item.basePrice || item.defaultPrice) || 0
        }));
        if (isMountedRef.current) {
          setCatalog(formatted);
        }
      } else {
        if (isMountedRef.current) {
          setCatalog([]);
        }
      }
    } catch (error) {
      console.log('Error fetching service items:', error);
      if (isMountedRef.current) {
        setCatalog([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchServices();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchServices]);

  const selectedItems = formData.serviceItems;
  const totalCost = selectedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const handleSelectService = (catalogItem) => {
    addService(catalogItem);
    setDropdownOpen(false);
    setServiceError(''); // clear error once a service is added
  };

  const incrementQty = (id, currentQty) => {
    updateService(id, { quantity: currentQty + 1 });
  };

  const decrementQty = (id, currentQty) => {
    if (currentQty > 1) {
      updateService(id, { quantity: currentQty - 1 });
    }
  };

  useImperativeHandle(ref, () => ({
    fetchServices,
    validate() {
      if (formData.serviceItems.length === 0) {
        setServiceError('Please add at least one service to continue.');
        return false;
      }
      setServiceError('');
      return true;
    },
  }));

  const removeService = (id) => {
    setFormData(c => ({
      ...c,
      serviceItems: c.serviceItems.filter(s => s.id !== id)
    }));
  };

  return (
    <View style={styles.container}>
      <CardTitle title="Services" subtitle="Select service items to add them to the job card." />

      <View style={styles.selectionSection}>
        <Text style={styles.sectionTitle}>
          Add Service Item <Text style={{ color: colors.danger }}>*</Text>
        </Text>

        {/* Dropdown Selector for adding services */}
        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            onPress={() => setDropdownOpen(!dropdownOpen)}
            style={styles.dropdownButton}
          >
            <Text style={styles.dropdownButtonText}>
              Select a service from catalog to add...
            </Text>
            <ChevronDown size={18} color={colors.mutedText} />
          </TouchableOpacity>

          {dropdownOpen && (
            <View style={styles.dropdownList}>
              <ScrollView
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
                style={styles.dropdownScrollView}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.loadingText}>
                      Loading services...
                    </Text>
                  </View>
                ) : catalog.length === 0 ? (
                  <Text style={styles.emptyDropdownText}>
                    No services available
                  </Text>
                ) : (
                  catalog.map((catalogItem) => {
                    const alreadyAdded = selectedItems.some(s => s.serviceItem === catalogItem.label);
                    return (
                      <TouchableOpacity
                        key={catalogItem.label}
                        onPress={() => handleSelectService(catalogItem)}
                        style={styles.catalogItemRow}
                      >
                        <View style={styles.catalogItemInfo}>
                          <Text style={styles.catalogItemName}>
                            {catalogItem.label}
                          </Text>
                          <Text style={styles.catalogItemCategory}>
                            {catalogItem.category?.name || catalogItem.category || 'Service'}
                          </Text>
                        </View>
                        <View style={styles.catalogItemPriceContainer}>
                          <Text style={styles.catalogItemPrice}>
                            Rs {catalogItem.price}
                          </Text>
                          {alreadyAdded && (
                            <Text style={styles.addedBadge}>
                              Added
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      {/* Selected Service Items Table */}
      <View style={styles.selectedHeaderRow}>
        <View style={styles.selectedHeaderTitleRow}>
          <Text style={styles.selectedTitle}>
            Selected Services ({selectedItems.length})
          </Text>
          {selectedItems.length > 0 && (
            <TouchableOpacity
              onPress={() => setFormData(c => ({ ...c, serviceItems: [] }))}
              style={styles.clearAllButton}
            >
              <Text style={styles.clearAllText}>
                Clear All
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {selectedItems.length === 0 ? (
          <View>
            <View style={styles.emptySelectedContainer}>
              <AlertCircle size={32} color={serviceError ? colors.danger : '#94A3B8'} strokeWidth={1.5} />
              <Text style={[styles.emptySelectedTitle, serviceError ? { color: colors.danger } : {}]}>
                No services selected.
              </Text>
              <Text style={[styles.emptySelectedSubtitle, serviceError ? { color: colors.danger } : {}]}>
                {serviceError || 'Use the dropdown above to add services.'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.selectedItemsList}>
            <View style={styles.selectedItemsCard}>
              {selectedItems.map((item, index) => {
                const rowTotal = item.unitPrice * item.quantity;
                return (
                  <View
                    key={item.id}
                    style={[styles.selectedItemRow, { borderTopWidth: index > 0 ? 1 : 0, borderTopColor: colors.border }]}
                  >
                    {/* Top Row: Name and Delete */}
                    <View style={styles.selectedItemHeader}>
                      <View style={styles.selectedItemInfo}>
                        <Text style={styles.selectedItemName}>
                          {item.serviceItem}
                        </Text>
                        <Text style={styles.selectedItemCategory}>
                          {item.category?.name || item.category || 'Service'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => removeService(item.id)}
                        style={styles.deleteButton}
                      >
                        <Trash2 size={16} color={colors.danger} strokeWidth={2} />
                      </TouchableOpacity>
                    </View>

                    {/* Bottom Row: Qty Controls and Price */}
                    <View style={styles.selectedItemFooter}>
                      {/* Quantity control */}
                      <View style={styles.qtyControlsContainer}>
                        <TouchableOpacity
                          onPress={() => decrementQty(item.id, item.quantity)}
                          style={styles.qtyButton}
                        >
                          <Minus size={14} color="#475569" strokeWidth={2.5} />
                        </TouchableOpacity>

                        <Text style={styles.qtyText}>
                          {item.quantity}
                        </Text>

                        <TouchableOpacity
                          onPress={() => incrementQty(item.id, item.quantity)}
                          style={styles.qtyButton}
                        >
                          <Plus size={14} color="#475569" strokeWidth={2.5} />
                        </TouchableOpacity>
                      </View>

                      {/* Price info */}
                      <View style={styles.selectedItemPriceInfo}>
                        <Text style={styles.selectedItemPrice}>
                          Rs {rowTotal}
                        </Text>
                        <Text style={styles.selectedItemPriceEach}>
                          Rs {item.unitPrice} each
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Cost Box */}
            <View style={styles.totalCostCard}>
              <View>
                <Text style={styles.totalCostLabel}>
                  Estimated Service Total
                </Text>
                <Text style={styles.totalCostValue}>
                  Rs {totalCost}
                </Text>
              </View>
              <View style={styles.totalCostIconContainer}>
                <Wrench size={24} color="#FFFFFF" strokeWidth={2} />
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
});
