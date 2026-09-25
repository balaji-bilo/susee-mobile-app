import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, Text, View, Image, Alert } from 'react-native';
import { colors, fonts, radius, spacing } from '../../../common/config/theme';
import { Button } from '../../../common/components/Button';
import { launchImageLibrary } from 'react-native-image-picker';

export function SignaturePad({ onChange }) {
  const [strokes, setStrokes] = useState([]);
  const [activeStroke, setActiveStroke] = useState([]);
  const [uploadedSignatureUri, setUploadedSignatureUri] = useState(null);
  const currentStroke = useRef([]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          currentStroke.current = [getPoint(evt)];
          setActiveStroke(currentStroke.current.slice());
        },
        onPanResponderMove: (evt) => {
          currentStroke.current = [...currentStroke.current, getPoint(evt)];
          setActiveStroke(currentStroke.current.slice());
        },
        onPanResponderRelease: () => {
          if (currentStroke.current.length > 0) {
            setStrokes((existing) => [...existing, { points: currentStroke.current.slice() }]);
            onChange?.(true);
          }
          currentStroke.current = [];
          setActiveStroke([]);
        },
      }),
    [onChange]
  );

  const clear = () => {
    setStrokes([]);
    currentStroke.current = [];
    setUploadedSignatureUri(null);
    onChange?.(false);
  };

  const uploadSignature = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 1,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) return;
      if (response.errorCode) {
        Alert.alert('Gallery Error', response.errorMessage || 'Could not open gallery');
        return;
      }
      if (response.assets && response.assets.length > 0) {
        const photo = response.assets[0];
        setUploadedSignatureUri(photo.uri);
        onChange?.(true);
      }
    });
  };

  return (
    <View>
      <Text style={{ fontFamily: fonts.inter, fontSize: 15, color: colors.text, marginBottom: spacing.sm }}>
        Customer Signature
      </Text>
      <View
        {...(uploadedSignatureUri ? {} : panResponder.panHandlers)}
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.lg,
          height: 220,
          overflow: 'hidden',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {uploadedSignatureUri ? (
          <Image
            source={{ uri: uploadedSignatureUri }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          />
        ) : (
          <View style={{ padding: spacing.lg, flex: 1, width: '100%', height: '100%' }}>
            {strokes.length === 0 ? (
              <Text style={{ color: colors.mutedText, fontFamily: fonts.inter }}>
                Sign inside the pad using your finger or stylus.
              </Text>
            ) : null}
            {strokes.map((stroke, strokeIndex) => {
              const rows = [];
              for (let i = 1; i < stroke.points.length; i += 1) {
                const prev = stroke.points[i - 1];
                const point = stroke.points[i];
                rows.push(
                  <View
                    key={`${strokeIndex}-${i}`}
                    style={{
                      position: 'absolute',
                      left: prev.x,
                      top: prev.y,
                      width: Math.max(2, Math.hypot(point.x - prev.x, point.y - prev.y)),
                      height: 2.2,
                      backgroundColor: colors.primaryDeep,
                      transform: [{ rotate: `${Math.atan2(point.y - prev.y, point.x - prev.x)}rad` }],
                      transformOrigin: 'left center',
                      borderRadius: 2,
                    }}
                  />
                );
              }
              return rows;
            })}
            {activeStroke.length > 1
              ? activeStroke.slice(1).map((point, index) => {
                const prev = activeStroke[index];
                return (
                  <View
                    key={`active-${index}`}
                    style={{
                      position: 'absolute',
                      left: prev.x,
                      top: prev.y,
                      width: Math.max(2, Math.hypot(point.x - prev.x, point.y - prev.y)),
                      height: 2.2,
                      backgroundColor: colors.primaryDeep,
                      transform: [{ rotate: `${Math.atan2(point.y - prev.y, point.x - prev.x)}rad` }],
                      borderRadius: 2,
                    }}
                  />
                );
              })
              : null}
          </View>
        )}
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' }}>
        {(strokes.length > 0 || uploadedSignatureUri) ? (
          <Button label="Clear Signature" onPress={clear} variant="secondary" />
        ) : null}
        <Button label="Upload Signature" onPress={uploadSignature} variant="secondary" />
      </View>
    </View>
  );

  function getPoint(evt) {
    return {
      x: evt.nativeEvent.locationX,
      y: evt.nativeEvent.locationY,
    };
  }
}
