import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity
} from 'react-native';
import {
  HelpCircle,
  MessageSquare,
  Clock,
  User
} from 'lucide-react-native';

import { IOSText, IOSCard, IOSButton, IOSSection } from '../../ios';
import { useAuth } from '../../../hooks/useAuth';

interface QuestionFormProps {
  eventId: string;
  onSubmit: (formData: QuestionData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export interface QuestionData {
  sailNumber: string;
  competitorName: string;
  questionText: string;
  category: 'rules' | 'measurement' | 'schedule' | 'technical' | 'other';
  urgency: 'low' | 'medium' | 'high';
  contactEmail: string;
  contactPhone?: string;
}

const QUESTION_CATEGORIES = [
  { id: 'rules', label: 'Racing Rules', icon: '📋' },
  { id: 'measurement', label: 'Measurement', icon: '📏' },
  { id: 'schedule', label: 'Schedule', icon: '📅' },
  { id: 'technical', label: 'Technical', icon: '⚙️' },
  { id: 'other', label: 'Other', icon: '❓' }
];

const URGENCY_LEVELS = [
  { id: 'low', label: 'Low Priority', color: '#34C759', description: 'Can wait for normal response time' },
  { id: 'medium', label: 'Medium Priority', color: '#FF9500', description: 'Preferred response within 2 hours' },
  { id: 'high', label: 'High Priority', color: '#FF3B30', description: 'Urgent - response needed ASAP' }
];

export const QuestionForm: React.FC<QuestionFormProps> = ({
  eventId,
  onSubmit,
  onCancel,
  isSubmitting = false
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<QuestionData>({
    sailNumber: user?.sailNumber || '',
    competitorName: user?.name || '',
    questionText: '',
    category: 'other',
    urgency: 'medium',
    contactEmail: user?.email || '',
    contactPhone: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof QuestionData, value: any) => {
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
    if (!formData.questionText.trim()) {
      newErrors.questionText = 'Question text is required';
    }
    if (formData.questionText.trim().length < 10) {
      newErrors.questionText = 'Question must be at least 10 characters';
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
    field: keyof QuestionData,
    title: string,
    placeholder?: string
  ) => {
    Alert.prompt(
      title,
      placeholder,
      (text) => handleInputChange(field, text || ''),
      'plain-text',
      String(formData[field] || '')
    );
  };

  const promptForQuestion = () => {
    Alert.prompt(
      'Your Question',
      'Please describe your question in detail',
      (text) => handleInputChange('questionText', text || ''),
      'plain-text',
      formData.questionText
    );
  };

  const selectCategory = () => {
    Alert.alert(
      'Question Category',
      'What type of question do you have?',
      [
        ...QUESTION_CATEGORIES.map(cat => ({
          text: `${cat.icon} ${cat.label}`,
          onPress: () => handleInputChange('category', cat.id as any)
        })),
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const selectUrgency = () => {
    Alert.alert(
      'Question Priority',
      'How urgent is your question?',
      [
        ...URGENCY_LEVELS.map(level => ({
          text: level.label,
          onPress: () => handleInputChange('urgency', level.id as any)
        })),
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const getCurrentCategory = () => {
    return QUESTION_CATEGORIES.find(cat => cat.id === formData.category);
  };

  const getCurrentUrgency = () => {
    return URGENCY_LEVELS.find(level => level.id === formData.urgency);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <IOSSection spacing="regular">
        {/* Header */}
        <View style={styles.header}>
          <HelpCircle size={32} color="#34C759" />
          <IOSText textStyle="title2" weight="semibold" style={styles.title}>
            Ask a Question
          </IOSText>
          <IOSText textStyle="callout" color="secondaryLabel" style={styles.subtitle}>
            Submit a question to the race committee
          </IOSText>
        </View>

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

        {/* Question Details */}
        <IOSCard style={styles.section}>
          <IOSText textStyle="headline" weight="semibold" style={styles.sectionTitle}>
            Question Details
          </IOSText>
          
          <FormField
            label="Category"
            value={getCurrentCategory() ? `${getCurrentCategory()?.icon} ${getCurrentCategory()?.label}` : 'Select category'}
            onPress={selectCategory}
            icon={<MessageSquare size={16} color="#007AFF" />}
          />
          
          <FormField
            label="Your Question *"
            value={formData.questionText || 'Tap to enter your question'}
            onPress={promptForQuestion}
            error={errors.questionText}
            multiline
            icon={<MessageSquare size={16} color="#007AFF" />}
          />
          
          <FormField
            label="Priority Level"
            value={getCurrentUrgency()?.label || 'Select priority'}
            onPress={selectUrgency}
            icon={<Clock size={16} color={getCurrentUrgency()?.color || '#007AFF'} />}
          />
          
          {getCurrentUrgency() && (
            <View style={styles.urgencyDescription}>
              <IOSText textStyle="caption1" color="secondaryLabel">
                {getCurrentUrgency()?.description}
              </IOSText>
            </View>
          )}
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
            label="Phone Number (Optional)"
            value={formData.contactPhone || 'Not provided'}
            onPress={() => promptForInput('contactPhone', 'Phone Number', 'Enter phone number')}
          />
        </IOSCard>

        {/* Response Time Info */}
        <IOSCard style={[styles.section, styles.infoCard]}>
          <IOSText textStyle="callout" weight="medium" style={styles.infoTitle}>
            Response Times
          </IOSText>
          <IOSText textStyle="caption1" color="secondaryLabel">
            • Low Priority: Response within 4-6 hours{'\n'}
            • Medium Priority: Response within 1-2 hours{'\n'}
            • High Priority: Response within 30 minutes{'\n'}
            {'\n'}
            For urgent safety matters, contact the race office directly at +852 2832 2817
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
            title={isSubmitting ? 'Submitting...' : 'Submit Question'}
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
          !value.includes('Tap to') && !value.includes('Not provided') && !value.includes('Select') && styles.fieldValueFilled
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
  urgencyDescription: {
    marginTop: 8,
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

export default QuestionForm;