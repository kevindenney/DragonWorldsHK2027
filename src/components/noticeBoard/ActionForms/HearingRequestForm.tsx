import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity
} from 'react-native';
import {
  Gavel,
  Calendar,
  Clock,
  Users,
  FileText,
  AlertCircle
} from 'lucide-react-native';

import { IOSText, IOSCard, IOSButton, IOSSection } from '../../ios';
import { useAuth } from '../../../hooks/useAuth';

interface HearingRequestFormProps {
  eventId: string;
  onSubmit: (formData: HearingRequestData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export interface HearingRequestData {
  protestingBoat: string;
  protestedBoat: string;
  raceNumber: string;
  incidentTime: string;
  incidentLocation: string;
  incidentDescription: string;
  rulesAlleged: string[];
  witnessBoats: string[];
  preferredHearingTime: string;
  contactEmail: string;
  contactPhone: string;
  urgency: 'normal' | 'urgent';
}

export const HearingRequestForm: React.FC<HearingRequestFormProps> = ({
  eventId,
  onSubmit,
  onCancel,
  isSubmitting = false
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<HearingRequestData>({
    protestingBoat: user?.sailNumber || '',
    protestedBoat: '',
    raceNumber: '',
    incidentTime: '',
    incidentLocation: '',
    incidentDescription: '',
    rulesAlleged: [],
    witnessBoats: [],
    preferredHearingTime: '',
    contactEmail: user?.email || '',
    contactPhone: '',
    urgency: 'normal'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof HearingRequestData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.protestingBoat.trim()) {
      newErrors.protestingBoat = 'Protesting boat is required';
    }
    if (!formData.protestedBoat.trim()) {
      newErrors.protestedBoat = 'Protested boat is required';
    }
    if (!formData.raceNumber.trim()) {
      newErrors.raceNumber = 'Race number is required';
    }
    if (!formData.incidentTime.trim()) {
      newErrors.incidentTime = 'Incident time is required';
    }
    if (!formData.incidentLocation.trim()) {
      newErrors.incidentLocation = 'Incident location is required';
    }
    if (!formData.incidentDescription.trim()) {
      newErrors.incidentDescription = 'Incident description is required';
    }
    if (formData.rulesAlleged.length === 0) {
      newErrors.rulesAlleged = 'At least one rule must be alleged';
    }
    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Contact email is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    } else {
      Alert.alert(
        'Form Incomplete',
        'Please fill in all required fields before submitting.'
      );
    }
  };

  const promptForInput = (
    field: keyof HearingRequestData,
    title: string,
    placeholder?: string,
    multiline?: boolean
  ) => {
    Alert.prompt(
      title,
      placeholder,
      (text) => handleInputChange(field, text || ''),
      multiline ? 'plain-text' : 'default',
      String(formData[field] || '')
    );
  };

  const promptForRules = () => {
    Alert.prompt(
      'Rules Alleged',
      'Enter rule numbers separated by commas (e.g., Rule 11, Rule 14)',
      (text) => {
        if (text) {
          const rules = text.split(',').map(rule => rule.trim()).filter(rule => rule);
          handleInputChange('rulesAlleged', rules);
        }
      },
      'plain-text',
      formData.rulesAlleged.join(', ')
    );
  };

  const promptForWitnesses = () => {
    Alert.prompt(
      'Witness Boats',
      'Enter sail numbers of witness boats separated by commas',
      (text) => {
        if (text) {
          const witnesses = text.split(',').map(witness => witness.trim()).filter(witness => witness);
          handleInputChange('witnessBoats', witnesses);
        }
      },
      'plain-text',
      formData.witnessBoats.join(', ')
    );
  };

  const selectUrgency = () => {
    Alert.alert(
      'Request Priority',
      'Select the urgency of this hearing request',
      [
        {
          text: 'Normal',
          onPress: () => handleInputChange('urgency', 'normal')
        },
        {
          text: 'Urgent',
          onPress: () => handleInputChange('urgency', 'urgent'),
          style: 'destructive'
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <IOSSection spacing="regular">
        {/* Header */}
        <View style={styles.header}>
          <Gavel size={32} color="#007AFF" />
          <IOSText textStyle="title2" weight="semibold" style={styles.title}>
            Hearing Request
          </IOSText>
          <IOSText textStyle="callout" color="secondaryLabel" style={styles.subtitle}>
            Request a formal hearing with the protest committee
          </IOSText>
        </View>

        {/* Boats Section */}
        <IOSCard style={styles.section}>
          <IOSText textStyle="headline" weight="semibold" style={styles.sectionTitle}>
            Boats Involved
          </IOSText>
          
          <FormField
            label="Protesting Boat *"
            value={formData.protestingBoat}
            onPress={() => promptForInput('protestingBoat', 'Protesting Boat', 'Enter sail number')}
            error={errors.protestingBoat}
            icon={<Users size={16} color="#007AFF" />}
          />
          
          <FormField
            label="Protested Boat *"
            value={formData.protestedBoat}
            onPress={() => promptForInput('protestedBoat', 'Protested Boat', 'Enter sail number')}
            error={errors.protestedBoat}
            icon={<Users size={16} color="#FF3B30" />}
          />
        </IOSCard>

        {/* Incident Details */}
        <IOSCard style={styles.section}>
          <IOSText textStyle="headline" weight="semibold" style={styles.sectionTitle}>
            Incident Details
          </IOSText>
          
          <FormField
            label="Race Number *"
            value={formData.raceNumber}
            onPress={() => promptForInput('raceNumber', 'Race Number', 'Enter race number')}
            error={errors.raceNumber}
          />
          
          <FormField
            label="Incident Time *"
            value={formData.incidentTime}
            onPress={() => promptForInput('incidentTime', 'Incident Time', 'e.g., 14:25:30')}
            error={errors.incidentTime}
            icon={<Clock size={16} color="#007AFF" />}
          />
          
          <FormField
            label="Incident Location *"
            value={formData.incidentLocation}
            onPress={() => promptForInput('incidentLocation', 'Incident Location', 'e.g., Windward mark rounding')}
            error={errors.incidentLocation}
          />
          
          <FormField
            label="Incident Description *"
            value={formData.incidentDescription}
            onPress={() => promptForInput('incidentDescription', 'Incident Description', 'Describe what happened in detail', true)}
            error={errors.incidentDescription}
            multiline
          />
        </IOSCard>

        {/* Rules and Witnesses */}
        <IOSCard style={styles.section}>
          <IOSText textStyle="headline" weight="semibold" style={styles.sectionTitle}>
            Rules & Witnesses
          </IOSText>
          
          <FormField
            label="Rules Alleged *"
            value={formData.rulesAlleged.join(', ') || 'Tap to add rules'}
            onPress={promptForRules}
            error={errors.rulesAlleged}
            icon={<FileText size={16} color="#007AFF" />}
          />
          
          <FormField
            label="Witness Boats"
            value={formData.witnessBoats.join(', ') || 'Tap to add witness boats'}
            onPress={promptForWitnesses}
            icon={<Users size={16} color="#34C759" />}
          />
        </IOSCard>

        {/* Hearing Preferences */}
        <IOSCard style={styles.section}>
          <IOSText textStyle="headline" weight="semibold" style={styles.sectionTitle}>
            Hearing Preferences
          </IOSText>
          
          <FormField
            label="Preferred Hearing Time"
            value={formData.preferredHearingTime || 'Any time available'}
            onPress={() => promptForInput('preferredHearingTime', 'Preferred Hearing Time', 'e.g., After 19:00')}
            icon={<Calendar size={16} color="#007AFF" />}
          />
          
          <FormField
            label="Request Priority"
            value={formData.urgency === 'urgent' ? 'Urgent' : 'Normal'}
            onPress={selectUrgency}
            icon={<AlertCircle size={16} color={formData.urgency === 'urgent' ? '#FF3B30' : '#34C759'} />}
          />
        </IOSCard>

        {/* Contact Information */}
        <IOSCard style={styles.section}>
          <IOSText textStyle="headline" weight="semibold" style={styles.sectionTitle}>
            Contact Information
          </IOSText>
          
          <FormField
            label="Email *"
            value={formData.contactEmail}
            onPress={() => promptForInput('contactEmail', 'Contact Email', 'Enter your email address')}
            error={errors.contactEmail}
          />
          
          <FormField
            label="Phone Number"
            value={formData.contactPhone || 'Optional'}
            onPress={() => promptForInput('contactPhone', 'Phone Number', 'Enter phone number')}
          />
        </IOSCard>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <IOSButton
            title="Cancel"
            onPress={onCancel}
            variant="secondary"
            size="large"
            style={styles.cancelButton}
          />
          
          <IOSButton
            title={isSubmitting ? 'Submitting...' : 'Submit Request'}
            onPress={handleSubmit}
            variant="primary"
            size="large"
            disabled={isSubmitting}
            style={styles.submitButton}
          />
        </View>
      </IOSSection>
    </ScrollView>
  );
};

// Form Field Component
interface FormFieldProps {
  label: string;
  value: string;
  onPress: () => void;
  error?: string;
  icon?: React.ReactNode;
  multiline?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onPress,
  error,
  icon,
  multiline
}) => (
  <View style={styles.formField}>
    <IOSText textStyle="callout" weight="medium" style={styles.fieldLabel}>
      {label}
    </IOSText>
    
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.fieldContainer,
        multiline && styles.multilineField,
        error && styles.fieldError
      ]}
    >
      {icon && <View style={styles.fieldIcon}>{icon}</View>}
      
      <IOSText 
        textStyle="body" 
        style={[
          styles.fieldValue,
          !value.includes('Tap to') && styles.fieldValueFilled
        ]}
        numberOfLines={multiline ? undefined : 1}
      >
        {value}
      </IOSText>
    </TouchableOpacity>
    
    {error && (
      <IOSText textStyle="caption1" color="systemRed" style={styles.errorText}>
        {error}
      </IOSText>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  
  // Header
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
  },
  title: {
    marginTop: 8,
    marginBottom: 4,
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 280,
  },

  // Sections
  section: {
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 16,
    color: '#1C1C1E',
  },

  // Form Fields
  formField: {
    marginBottom: 16,
  },
  fieldLabel: {
    marginBottom: 8,
    color: '#1C1C1E',
  },
  fieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  multilineField: {
    alignItems: 'flex-start',
    minHeight: 80,
    paddingVertical: 12,
  },
  fieldError: {
    borderColor: '#FF3B30',
    borderWidth: 2,
  },
  fieldIcon: {
    marginRight: 8,
  },
  fieldValue: {
    flex: 1,
    color: '#8E8E93',
  },
  fieldValueFilled: {
    color: '#1C1C1E',
  },
  errorText: {
    marginTop: 4,
    marginLeft: 4,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
});

export default HearingRequestForm;