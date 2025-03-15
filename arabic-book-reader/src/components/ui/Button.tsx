/**
 * Reusable Button component
 */
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, fonts, radius, spacing } from '../../constants/theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  isLoading = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  ...rest
}) => {
  // Get styles based on variant and size
  const buttonStyle = [
    styles.button,
    styles[`${variant}Button`],
    styles[`${size}Button`],
    style,
  ];

  const textStyleArray = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      disabled={isLoading || rest.disabled}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.primary.white : colors.primary.deep}
          size="small"
        />
      ) : (
        <>
          {leftIcon && <>{leftIcon}</>}
          <Text style={textStyleArray}>{title}</Text>
          {rightIcon && <>{rightIcon}</>}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  text: {
    fontFamily: fonts.primaryFamily,
    textAlign: 'center',
  },
  // Variant styles
  primaryButton: {
    backgroundColor: colors.primary.deep,
  },
  primaryText: {
    color: colors.primary.white,
    fontWeight: '500',
  },
  secondaryButton: {
    backgroundColor: colors.primary.sky,
  },
  secondaryText: {
    color: colors.primary.white,
    fontWeight: '500',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary.deep,
  },
  outlineText: {
    color: colors.primary.deep,
    fontWeight: '500',
  },
  textButton: {
    backgroundColor: 'transparent',
  },
  textText: {
    color: colors.primary.deep,
    fontWeight: '500',
  },
  // Size styles
  smallButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  smallText: {
    fontSize: fonts.size.sm,
  },
  mediumButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  mediumText: {
    fontSize: fonts.size.md,
  },
  largeButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  largeText: {
    fontSize: fonts.size.lg,
  },
}); 