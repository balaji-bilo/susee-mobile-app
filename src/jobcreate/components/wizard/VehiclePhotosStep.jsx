import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { View, Text } from 'react-native';
import { colors, fonts, spacing } from '../../../common/config/theme';
import styles from '../../styles/vehiclePhotosStepStyles';
import { CardTitle } from '../../../common/components/CardTitle';
import { PhotoUploader } from '../ui/PhotoUploader';

export const VehiclePhotosStep = forwardRef(function VehiclePhotosStep({ formData, setFormData, scrollRef }, ref) {
  const [photoError, setPhotoError] = useState('');

  const totalPhotos = Object.values(formData.photos).reduce(
    (sum, arr) => sum + (arr?.length ?? 0),
    0
  );

  useImperativeHandle(ref, () => ({
    validate() {
      if (totalPhotos === 0) {
        setPhotoError('Please upload at least one photo before submitting.');
        if (scrollRef && scrollRef.current) {
          setTimeout(() => {
            scrollRef.current.scrollToEnd({ animated: true });
          }, 100);
        }
        return false;
      }
      setPhotoError('');
      return true;
    },
  }));

  const handleChange = (newPhotos) => {
    setPhotoError(''); // clear error as soon as a photo is added
    setFormData((c) => ({ ...c, photos: newPhotos }));
  };

  return (
    <View style={styles.container}>
      <CardTitle title="Vehicle Photos" subtitle="Capture every angle with previewable photo cards." />
      <PhotoUploader
        value={formData.photos}
        onChange={handleChange}
      />
      {!!photoError && (
        <Text
          style={{
            fontSize: 12,
            fontFamily: fonts.inter,
            color: colors.danger,
            marginTop: spacing.xs,
            textAlign: 'center',
          }}
        >
          {photoError}
        </Text>
      )}
    </View>
  );
});
