import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity
} from 'react-native';
import {
  Settings,
  Package,
  RefreshCw,
  AlertTriangle,
  FileText,
  User
} from 'lucide-react-native';

import { IOSText, IOSCard, IOSButton, IOSSection } from '../../ios';
import { useAuth } from '../../../hooks/useAuth';

interface EquipmentSubstitutionFormProps {
  eventId: string;
  onSubmit: (formData: EquipmentSubstitutionData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export interface EquipmentSubstitutionData {
  sailNumber: string;
  competitorName: string;
  originalEquipment: string;
  originalSpecifications: string;
  substituteEquipment: string;
  substituteSpecifications: string;
  reasonForSubstitution: string;
  category: 'sail' | 'hull' | 'rigging' | 'safety' | 'electronics' | 'other';
  urgency: 'normal' | 'urgent';
  raceAffected: string;
  contactEmail: string;
  supportingDocuments?: string[];
}

const EQUIPMENT_CATEGORIES = [
  { id: 'sail', label: 'Sails', icon: '⛵', description: 'Main, jib, spinnaker, etc.' },
  { id: 'hull', label: 'Hull & Deck', icon: '🚢', description: 'Hull repairs, deck hardware' },
  { id: 'rigging', label: 'Rigging', icon: '🔗', description: 'Mast, boom, standing/running rigging' },
  { id: 'safety', label: 'Safety Equipment', icon: '🦺', description: 'Life jackets, flares, etc.' },
  { id: 'electronics', label: 'Electronics', icon: '📱', description: 'GPS, radio, instruments' },
  { id: 'other', label: 'Other', icon: '⚙️', description: 'Other equipment not listed above' }
];

export const EquipmentSubstitutionForm: React.FC<EquipmentSubstitutionFormProps> = ({
  eventId,
  onSubmit,
  onCancel,
  isSubmitting = false
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<EquipmentSubstitutionData>({
    sailNumber: user?.sailNumber || '',
    competitorName: user?.name || '',
    originalEquipment: '',
    originalSpecifications: '',
    substituteEquipment: '',
    substituteSpecifications: '',
    reasonForSubstitution: '',
    category: 'other',
    urgency: 'normal',
    raceAffected: '',
    contactEmail: user?.email || '',
    supportingDocuments: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof EquipmentSubstitutionData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.sailNumber.trim()) {
      newErrors.sailNumber = 'Sail number is required';
    }
    if (!formData.competitorName.trim()) {
      newErrors.competitorName = 'Competitor name is required';
    }
    if (!formData.originalEquipment.trim()) {
      newErrors.originalEquipment = 'Original equipment description is required';
    }
    if (!formData.substituteEquipment.trim()) {
      newErrors.substituteEquipment = 'Substitute equipment description is required';
    }
    if (!formData.reasonForSubstitution.trim()) {
      newErrors.reasonForSubstitution = 'Reason for substitution is required';
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
    field: keyof EquipmentSubstitutionData,
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

  const selectCategory = () => {
    Alert.alert(
      'Equipment Category',
      'What type of equipment needs substitution?',
      [
        ...EQUIPMENT_CATEGORIES.map(cat => ({
          text: `${cat.icon} ${cat.label}`,
          onPress: () => handleInputChange('category', cat.id as any)
        })),
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const selectUrgency = () => {
    Alert.alert(
      'Request Urgency',
      'When do you need approval?',
      [
        {
          text: 'Normal - Before next race',
          onPress: () => handleInputChange('urgency', 'normal')
        },
        {
          text: 'Urgent - Need immediate approval',
          onPress: () => handleInputChange('urgency', 'urgent'),
          style: 'destructive'
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const getCurrentCategory = () => {
    return EQUIPMENT_CATEGORIES.find(cat => cat.id === formData.category);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <IOSSection spacing="regular">
        {/* Header */}
        <View style={styles.header}>
          <Settings size={32} color="#FF9500" />
          <IOSText textStyle="title2" weight="semibold" style={styles.title}>
            Equipment Substitution
          </IOSText>
          <IOSText textStyle="callout" color="secondaryLabel" style={styles.subtitle}>
            Request approval for equipment substitution
          </IOSText>
        </View>

        {/* Important Notice */}
        <IOSCard style={[styles.section, styles.warningCard]}>
          <View style={styles.warningHeader}>
            <AlertTriangle size={20} color="#FF9500" />
            <IOSText textStyle="callout" weight="semibold" style={styles.warningTitle}>
              Important Notice
            </IOSText>
          </View>
          <IOSText textStyle="caption1" color="secondaryLabel">
            Equipment substitutions must be approved before use in racing. Submit this request as early as possible. Using non-approved substitute equipment may result in disqualification.
          </IOSText>
        </IOSCard>

        {/* Competitor Info */}
        <IOSCard style={styles.section}>
          <IOSText textStyle="headline" weight="semibold" style={styles.sectionTitle}>
            Competitor Information
          </IOSText>
          
          <FormField
            label="Sail Number *"
            value={formData.sailNumber}
            onPress={() => promptForInput('sailNumber', 'Sail Number', 'Enter your sail number')}
            error={errors.sailNumber}
            icon={<User size={16} color="#007AFF" />}
          />
          
          <FormField
            label="Competitor Name *"
            value={formData.competitorName}
            onPress={() => promptForInput('competitorName', 'Competitor Name', 'Enter your full name')}
            error={errors.competitorName}
            icon={<User size={16} color="#007AFF" />}
          />
        </IOSCard>

        {/* Equipment Details */}
        <IOSCard style={styles.section}>
          <IOSText textStyle="headline" weight="semibold" style={styles.sectionTitle}>
            Equipment Details
          </IOSText>
          
          <FormField
            label="Equipment Category"
            value={getCurrentCategory() ? `${getCurrentCategory()?.icon} ${getCurrentCategory()?.label}` : 'Select category'}
            onPress={selectCategory}
            icon={<Package size={16} color="#007AFF" />}
          />

          {getCurrentCategory() && (
            <View style={styles.categoryDescription}>
              <IOSText textStyle="caption1" color="secondaryLabel">
                {getCurrentCategory()?.description}
              </IOSText>
            </View>
          )}
          
          <FormField
            label="Original Equipment *"
            value={formData.originalEquipment || 'Tap to describe original equipment'}
            onPress={() => promptForInput('originalEquipment', 'Original Equipment', 'Describe the equipment being replaced', true)}
            error={errors.originalEquipment}
            multiline
            icon={<Package size={16} color="#FF3B30" />}
          />
          
          <FormField
            label="Original Specifications"
            value={formData.originalSpecifications || 'Tap to add specifications (optional)'}
            onPress={() => promptForInput('originalSpecifications', 'Original Specifications', 'Brand, model, size, material, etc.', true)}
            multiline
            icon={<FileText size={16} color="#8E8E93" />}
          />
          
          <FormField
            label="Substitute Equipment *"
            value={formData.substituteEquipment || 'Tap to describe substitute equipment'}
            onPress={() => promptForInput('substituteEquipment', 'Substitute Equipment', 'Describe the replacement equipment', true)}
            error={errors.substituteEquipment}
            multiline
            icon={<RefreshCw size={16} color="#34C759" />}
          />
          
          <FormField
            label="Substitute Specifications"
            value={formData.substituteSpecifications || 'Tap to add specifications (optional)'}
            onPress={() => promptForInput('substituteSpecifications', 'Substitute Specifications', 'Brand, model, size, material, etc.', true)}
            multiline
            icon={<FileText size={16} color="#8E8E93" />}
          />
        </IOSCard>

        {/* Reason & Timing */}
        <IOSCard style={styles.section}>
          <IOSText textStyle="headline" weight="semibold" style={styles.sectionTitle}>
            Reason & Timing
          </IOSText>
          
          <FormField
            label="Reason for Substitution *"
            value={formData.reasonForSubstitution || 'Tap to explain why substitution is needed'}
            onPress={() => promptForInput('reasonForSubstitution', 'Reason for Substitution', 'Explain why the substitution is necessary', true)}
            error={errors.reasonForSubstitution}
            multiline
          />
          
          <FormField
            label="Race Affected"
            value={formData.raceAffected || 'All remaining races'}
            onPress={() => promptForInput('raceAffected', 'Race Affected', 'Which races will use the substitute equipment?')}
          />
          
          <FormField
            label="Request Priority"
            value={formData.urgency === 'urgent' ? 'Urgent - Need immediate approval' : 'Normal - Before next race'}
            onPress={selectUrgency}
            icon={<AlertTriangle size={16} color={formData.urgency === 'urgent' ? '#FF3B30' : '#34C759'} />}
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
        </IOSCard>

        {/* Process Information */}
        <IOSCard style={[styles.section, styles.infoCard]}>
          <IOSText textStyle="callout" weight="medium" style={styles.infoTitle}>
            Approval Process
          </IOSText>
          <IOSText textStyle="caption1" color="secondaryLabel">
            1. Submit this form with detailed descriptions{'\n'}
            2. Technical committee will review your request{'\n'}
            3. You'll receive approval/denial within 2 hours{'\n'}
            4. If approved, you may use the substitute equipment{'\n'}
            {'\n'}
            For urgent requests, contact the race office directly at +852 2832 2817
          </IOSText>
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
          !value.includes('Tap to') && !value.includes('Select') && !value.includes('All remaining') && styles.fieldValueFilled
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
  warningCard: {
    backgroundColor: '#FFF8F0',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  warningTitle: {
    marginLeft: 8,
    color: '#1C1C1E',
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoTitle: {
    color: '#1C1C1E',
    marginBottom: 8,
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
  categoryDescription: {
    marginBottom: 16,
    paddingHorizontal: 8,
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

export default EquipmentSubstitutionForm;