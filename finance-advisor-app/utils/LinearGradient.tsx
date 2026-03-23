/**
 * Simple LinearGradient placeholder.
 * In production, use expo-linear-gradient or react-native-linear-gradient.
 */
import React from 'react';
import { View, ViewProps } from 'react-native';

interface Props extends ViewProps {
  colors?: string[];
}

export function LinearGradient({ colors, style, children, ...rest }: Props) {
  return (
    <View style={[{ backgroundColor: colors?.[0] || 'transparent' }, style]} {...rest}>
      {children}
    </View>
  );
}
