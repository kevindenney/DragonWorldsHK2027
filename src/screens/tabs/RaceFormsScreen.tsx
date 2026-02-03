import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  FileText,
  ExternalLink,
  Gavel,
  HelpCircle,
  Users,
  Wrench,
  ClipboardList,
  QrCode,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { IOSText } from '../../components/ios/IOSText';
import { FloatingEventSwitch } from '../../components/navigation/FloatingEventSwitch';
import { ProfileButton } from '../../components/navigation/ProfileButton';
import { colors, spacing } from '../../constants/theme';
import { externalUrls } from '../../config/externalUrls';
import { useToolbarVisibility } from '../../contexts/TabBarVisibilityContext';
import { useSelectedEvent, useSetSelectedEvent } from '../../stores/eventStore';
import { EVENTS } from '../../constants/events';

const HEADER_HEIGHT = 100; // Height of header section for content padding (title + event toggle)

interface RaceForm {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  getUrl: (eventId: string) => string;
  category: 'protest' | 'scoring' | 'admin';
}

const RACE_FORMS: RaceForm[] = [
  {
    id: 'protest',
    title: 'Submit Request for Hearing',
    description: 'File a protest or request for redress',
    icon: Gavel,
    getUrl: (eventId) => `https://www.racingrulesofsailing.org/protests/new?event_id=${eventId}`,
    category: 'protest',
  },
  {
    id: 'scoring-inquiry',
    title: 'Submit Scoring Inquiry',
    description: 'Report a scoring discrepancy or request correction',
    icon: ClipboardList,
    getUrl: (eventId) => `https://www.racingrulesofsailing.org/scoring_inquiries/new?event_id=${eventId}`,
    category: 'scoring',
  },
  {
    id: 'question',
    title: 'Submit Question',
    description: 'Ask the Race Committee a question',
    icon: HelpCircle,
    getUrl: (eventId) => `https://www.racingrulesofsailing.org/questions/new?event_id=${eventId}`,
    category: 'admin',
  },
  {
    id: 'crew-substitution',
    title: 'Submit Crew Substitution',
    description: 'Request to change crew members',
    icon: Users,
    getUrl: (eventId) => `https://www.racingrulesofsailing.org/crew_substitutions/new?event_id=${eventId}`,
    category: 'admin',
  },
  {
    id: 'equipment-substitution',
    title: 'Submit Equipment Substitution',
    description: 'Request to change equipment',
    icon: Wrench,
    getUrl: (eventId) => `https://www.racingrulesofsailing.org/equipment_substitutions/new?event_id=${eventId}`,
    category: 'admin',
  },
];

// Event selection type handled inline

export function RaceFormsScreen() {
  const selectedEvent = useSelectedEvent();
  const setSelectedEvent = useSetSelectedEvent();
  const [expandedForm, setExpandedForm] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  // Toolbar auto-hide
  const { toolbarTranslateY, createScrollHandler } = useToolbarVisibility();
  const scrollHandler = useMemo(() => createScrollHandler(), [createScrollHandler]);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getEventId = (): string => {
    return selectedEvent === EVENTS.APAC_2026.id
      ? externalUrls.racingRules.apac.eventId
      : externalUrls.racingRules.worlds.eventId;
  };

  const handleOpenForm = async (form: RaceForm) => {
    const eventId = getEventId();
    const url = form.getUrl(eventId);

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open the form. Please try again later.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while opening the form.');
    }
  };

  const toggleQRCode = (formId: string) => {
    setExpandedForm(expandedForm === formId ? null : formId);
  };

  const renderFormCard = (form: RaceForm) => {
    const IconComponent = form.icon;
    const isExpanded = expandedForm === form.id;
    const eventId = getEventId();
    const formUrl = form.getUrl(eventId);

    return (
      <View key={form.id} style={styles.formCard}>
        <View style={styles.formHeader}>
          <View style={styles.formIconContainer}>
            <IconComponent color="#007AFF" size={24} strokeWidth={2} />
          </View>
          <View style={styles.formInfo}>
            <Text style={styles.formTitle}>{form.title}</Text>
            <Text style={styles.formDescription}>{form.description}</Text>
          </View>
        </View>

        <View style={styles.formActions}>
          <TouchableOpacity
            style={styles.qrButton}
            onPress={() => toggleQRCode(form.id)}
          >
            <QrCode size={18} color="#007AFF" strokeWidth={2} />
            <Text style={styles.qrButtonText}>QR Code</Text>
            {isExpanded ? (
              <ChevronUp size={16} color="#007AFF" />
            ) : (
              <ChevronDown size={16} color="#007AFF" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.openButton}
            onPress={() => handleOpenForm(form)}
          >
            <Text style={styles.openButtonText}>Open Form</Text>
            <ExternalLink size={16} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {isExpanded && (
          <View style={styles.qrCodeContainer}>
            <View style={styles.qrCodeWrapper}>
              <QRCode
                value={formUrl}
                size={180}
                color="#000000"
                backgroundColor="#FFFFFF"
              />
            </View>
            <Text style={styles.qrCodeHint}>
              Scan with your phone's camera to open the form
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Main Content - Scrolls under the header */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: HEADER_HEIGHT + insets.top }]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={scrollHandler.onScroll}
        onScrollBeginDrag={scrollHandler.onScrollBeginDrag}
        onScrollEndDrag={scrollHandler.onScrollEndDrag}
        onMomentumScrollEnd={scrollHandler.onMomentumScrollEnd}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            progressViewOffset={HEADER_HEIGHT + insets.top}
          />
        }
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <FileText color="#007AFF" size={20} />
          <Text style={styles.infoText}>
            These official forms are hosted on racingrulesofsailing.org.
            Tap "Open Form" to submit directly, or scan the QR code with another device.
          </Text>
        </View>

        {/* Protest Forms Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Protests & Hearings</Text>
          {RACE_FORMS.filter(f => f.category === 'protest').map(renderFormCard)}
        </View>

        {/* Scoring Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scoring</Text>
          {RACE_FORMS.filter(f => f.category === 'scoring').map(renderFormCard)}
        </View>

        {/* Administrative Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Administrative</Text>
          {RACE_FORMS.filter(f => f.category === 'admin').map(renderFormCard)}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Floating Header Section - Positioned above content */}
      <Animated.View
        style={[
          styles.headerSection,
          {
            paddingTop: insets.top,
            transform: [{ translateY: toolbarTranslateY }]
          }
        ]}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <IOSText textStyle="title1" weight="bold" style={styles.headerTitle}>
              Forms
            </IOSText>
            <ProfileButton size={36} />
          </View>
          <FloatingEventSwitch
            options={[
              { label: 'APAC 2026', shortLabel: 'APAC 2026', value: EVENTS.APAC_2026.id },
              { label: 'Worlds 2027', shortLabel: 'Worlds 2027', value: EVENTS.WORLDS_2027.id }
            ]}
            selectedValue={selectedEvent}
            onValueChange={setSelectedEvent}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  headerSection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    zIndex: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.text,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollContent: {
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E8F4FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1C1C1E',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  formIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F0F8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  formInfo: {
    flex: 1,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  formDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
  },
  qrButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F0F8FF',
    gap: 6,
  },
  qrButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  openButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    gap: 6,
  },
  openButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  qrCodeWrapper: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  qrCodeHint: {
    marginTop: 12,
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 100,
  },
});

export default RaceFormsScreen;
