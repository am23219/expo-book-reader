import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Switch, 
  TouchableOpacity, 
  ScrollView, 
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { 
  getReminderSettings, 
  saveReminderSettings, 
  ReminderSettings,
  DEFAULT_REMINDER_SETTINGS,
  registerForPushNotificationsAsync,
  areNotificationsEnabled,
  isPushNotificationsAvailable
} from '../utils/notifications';
import { colors, fonts, spacing, radius, shadows } from '../constants/theme';

const ReminderSettingsScreen: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_REMINDER_SETTINGS);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [pushNotificationsAvailable, setPushNotificationsAvailable] = useState(true);
  const [loading, setLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await getReminderSettings();
        setSettings(savedSettings);
        
        // Check if notifications are enabled
        const enabled = await areNotificationsEnabled();
        setNotificationsEnabled(enabled);
        
        // Check if push notifications are available
        const available = await isPushNotificationsAvailable();
        setPushNotificationsAvailable(available);
        
        if (!available) {
          console.log('Push notifications are not available on this device');
        }
      } catch (error) {
        console.error('Error loading reminder settings:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  // Handle enabling/disabling reminders
  const handleToggleEnabled = async (value: boolean) => {
    if (value && !notificationsEnabled) {
      // If trying to enable reminders but notifications are not enabled
      Alert.alert(
        'Enable Notifications',
        'To use reminders, you need to enable notifications for this app.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Enable', 
            onPress: async () => {
              const token = await registerForPushNotificationsAsync();
              if (token) {
                setNotificationsEnabled(true);
                const newSettings = { ...settings, enabled: true };
                setSettings(newSettings);
                await saveReminderSettings(newSettings);
              }
            } 
          }
        ]
      );
    } else {
      // Just update the setting
      const newSettings = { ...settings, enabled: value };
      setSettings(newSettings);
      await saveReminderSettings(newSettings);
    }
  };

  // Handle time change
  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    
    if (selectedDate) {
      const newSettings = { 
        ...settings, 
        time: {
          hour: selectedDate.getHours(),
          minute: selectedDate.getMinutes()
        }
      };
      setSettings(newSettings);
      saveReminderSettings(newSettings);
    }
  };

  // Format time for display
  const formatTime = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">Daily Reading Reminder</Text>
        <TouchableOpacity 
          onPress={onClose} 
          style={styles.closeButton}
          hitSlop={{top: 10, right: 10, bottom: 10, left: 10}}
        >
          <Ionicons name="close" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {!pushNotificationsAvailable && (
          <View style={styles.warningSection}>
            <Ionicons name="warning-outline" size={24} color={colors.warning} style={styles.warningIcon} />
            <Text style={styles.warningText}>
              Push notifications are not fully supported on this device. Reminders will still work when the app is open, but you may not receive notifications when the app is closed.
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Enable Daily Reminder</Text>
            <Switch
              value={settings.enabled}
              onValueChange={handleToggleEnabled}
              trackColor={{ false: '#767577', true: colors.primary.deep }}
              thumbColor={settings.enabled ? colors.primary.sky : '#f4f3f4'}
            />
          </View>

          <TouchableOpacity 
            style={[styles.settingRow, styles.timePickerRow]} 
            onPress={() => setShowTimePicker(true)}
            disabled={!settings.enabled}
          >
            <Text style={[styles.settingLabel, !settings.enabled && styles.disabledText]}>
              Reminder Time
            </Text>
            <View style={styles.timeDisplay}>
              <Ionicons name="time-outline" size={20} color={settings.enabled ? colors.primary.deep : colors.text.muted} />
              <Text style={[styles.timeText, !settings.enabled && styles.disabledText]}>
                {formatTime(settings.time.hour, settings.time.minute)}
              </Text>
            </View>
          </TouchableOpacity>

          {showTimePicker && (
            <DateTimePicker
              value={new Date(new Date().setHours(settings.time.hour, settings.time.minute, 0, 0))}
              mode="time"
              is24Hour={false}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
            />
          )}
        </View>

        <View style={styles.infoSection}>
          <Ionicons name="information-circle-outline" size={20} color={colors.text.muted} />
          <Text style={styles.infoText}>
            You'll receive a daily notification at your selected time to help you maintain your reading streak.
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.backButton}
          onPress={onClose}
        >
          <Text style={styles.backButtonText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    marginTop: 50,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.large,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingRight: spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.md,
  },
  closeButton: {
    padding: spacing.xs,
    zIndex: 10,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  warningSection: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 243, 205, 0.5)', // Light yellow background
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.small,
  },
  warningIcon: {
    marginRight: spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: colors.warning,
  },
  section: {
    marginBottom: spacing.lg,
    backgroundColor: colors.background.secondary,
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadows.small,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.md,
    color: colors.text.primary,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  timePickerRow: {
    paddingVertical: spacing.md,
  },
  settingLabel: {
    fontSize: 16,
    color: colors.text.primary,
  },
  disabledText: {
    color: colors.text.muted,
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    color: colors.text.primary,
    marginLeft: spacing.xs,
  },
  infoSection: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.small,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.muted,
    marginLeft: spacing.sm,
  },
  backButton: {
    backgroundColor: colors.primary.deep,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.medium,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReminderSettingsScreen; 