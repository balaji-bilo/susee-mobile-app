import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Platform,
  StatusBar,
  Modal,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft, X } from 'lucide-react-native';
import { colors, fonts } from '../../common/config/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function JobCardImagesScreen({ navigation, route }) {
  const { cardId, photos = [] } = route?.params || {};
  const insets = useSafeAreaInsets();
  const topPadding = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const validImages = (photos || []).filter((img) => {
    const cat = String(img?.category || '').toUpperCase();
    const fname = String(img?.fileName || '').toLowerCase();
    const url = String(img?.url || '').toLowerCase();
    return (
      cat !== 'SIGNATURE' &&
      !fname.includes('signature') &&
      !fname.includes('sign_') &&
      !fname.includes('sign-') &&
      !url.includes('signature')
    );
  }).map((p, index) => ({
    key: p.id || `img_${index}`,
    label: p.category || `Image ${index + 1}`,
    uri: p.url
  }));

  const [viewerVisible, setViewerVisible] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);
  const windowWidth = Dimensions.get('window').width;

  const openViewer = (key) => {
    const idx = validImages.findIndex(img => img.key === key);
    if (idx !== -1) {
      setInitialIndex(idx);
      setViewerVisible(true);
    }
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Navigation Header */}
      <View style={[styles.headerBar, { paddingTop: topPadding + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={19} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Card Images</Text>
      </View>

      {isLoading ? (
        <View style={styles.centerLoadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading Images...</Text>
        </View>
      ) : validImages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.placeholderBox}>
            <Text style={styles.placeholderText}>No images available</Text>
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {validImages.map(section => (
            <View key={section.key} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{section.label}</Text>
              </View>

              <TouchableOpacity
                style={styles.imageContainer}
                activeOpacity={0.8}
                onPress={() => openViewer(section.key)}
              >
                <Image
                  source={{ uri: section.uri }}
                  style={styles.image}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Full-Screen Image Viewer Modal */}
      <Modal visible={viewerVisible} transparent={true} animationType="fade">
        <View style={styles.viewerContainer}>
          <TouchableOpacity
            style={styles.viewerCloseBtn}
            onPress={() => setViewerVisible(false)}
          >
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <FlatList
            data={validImages}
            keyExtractor={item => item.key}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={initialIndex}
            getItemLayout={(data, index) => (
              { length: windowWidth, offset: windowWidth * index, index }
            )}
            renderItem={({ item }) => (
              <View style={[styles.viewerItem, { width: windowWidth }]}>
                <Image source={{ uri: item.uri }} style={styles.viewerImage} />
                <Text style={styles.viewerLabel}>{item.label}</Text>
              </View>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: fonts.interBold,
    color: '#0F172A'
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  card: {
    width: '48%', // two cards per row
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 1,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    marginBottom: 16
  },
  cardHeader: {
    alignItems: 'flex-start',
    marginBottom: 10
  },
  cardTitle: {
    fontSize: 13,
    fontFamily: fonts.interSemiBold,
    color: '#475569'
  },
  placeholderBox: {
    width: '100%',
    height: 100,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC'
  },
  placeholderText: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: fonts.interMedium
  },
  imageContainer: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  image: {
    width: '100%',
    height: '100%'
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.93)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerCloseBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  viewerItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerImage: {
    width: '100%',
    height: '60%',
    resizeMode: 'contain',
  },
  viewerLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: fonts.interBold,
    marginTop: 20,
  },
  centerLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: fonts.interMedium,
    color: '#64748B',
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
