import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing, radius, shadows } from '../../constants/theme';

interface KhatmHeaderProps {
  khatmCount: number;
}

const KhatmHeader: React.FC<KhatmHeaderProps> = ({ khatmCount }) => {
  return (
    <View style={styles.khatmCountContainer}>
      <View style={styles.khatmCountInfo}>
        <Text style={styles.khatmCountLabel}>Total Khatms</Text>
      </View>
      <View style={styles.khatmCountBadge}>
        <Text style={styles.khatmCount}>{khatmCount}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  khatmCountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginVertical: spacing.md,
    borderRadius: radius.lg,
    marginHorizontal: spacing.md,
    ...shadows.small,
    position: 'relative',
  },
  khatmCountInfo: {
    justifyContent: 'center',
  },
  khatmCountLabel: {
    fontSize: fonts.size.md,
    color: colors.primary.white,
    fontFamily: fonts.secondaryFamily,
    fontWeight: '600',
  },
  khatmCountBadge: {
    backgroundColor: 'rgba(114, 187, 225, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    minWidth: 42,
    alignItems: 'center',
    ...shadows.small,
  },
  khatmCount: {
    fontSize: fonts.size.lg,
    fontWeight: 'bold',
    color: colors.primary.sky,
    fontFamily: fonts.boldFamily,
  },
});

export default KhatmHeader; 