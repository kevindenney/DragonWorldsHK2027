import React, { useState, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  Alert, 
  ScrollView,
  TouchableOpacity,
  Modal
} from 'react-native';
import { 
  Gavel, 
  HelpCircle, 
  Settings, 
  AlertTriangle, 
  Ruler,
  ExternalLink,
  Send,
  X
} from 'lucide-react-native';

import { IOSText, IOSCard, IOSButton, IOSSection } from '../ios';
import { ActionForm } from '../../services/ccr2024NoticesService';
import NoticeBoardService from '../../services/noticeBoardService';
import { useUserStore } from '../../stores/userStore';
import { haptics } from '../../utils/haptics';
import { 
  HearingRequestForm, 
  QuestionForm, 
  EquipmentSubstitutionForm,
  HearingRequestData,
  QuestionData,
  EquipmentSubstitutionData 
} from './ActionForms';

interface NoticeActionsProps {
  eventId: string;
  noticeBoardService: NoticeBoardService;
  userRole?: 'participant' | 'official' | 'spectator';
  onActionSubmitted?: (actionId: string) => void;
}

export const NoticeActions: React.FC<NoticeActionsProps> = ({
  eventId,
  noticeBoardService,
  userRole = 'participant',
  onActionSubmitted
}) => {
  const userStore = useUserStore();
  const [actions, setActions] = useState<ActionForm[]>([]);
  const [selectedAction, setSelectedAction] = useState<ActionForm | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load available actions
  React.useEffect(() => {
    const loadActions = async () => {
      try {
        const availableActions = noticeBoardService.getAvailableActions();
        setActions(availableActions);
      } catch (error) {
      }
    };

    loadActions();
  }, [noticeBoardService]);

  // Get icon for action type
  const getActionIcon = (iconName: string) => {
    switch (iconName) {
      case 'gavel':
        return <Gavel size={24} color="#007AFF" />;
      case 'help-circle':
        return <HelpCircle size={24} color="#34C759" />;
      case 'settings':
        return <Settings size={24} color="#FF9500" />;
      case 'alert-triangle':
        return <AlertTriangle size={24} color="#FF3B30" />;
      case 'ruler':
        return <Ruler size={24} color="#8E8E93" />;
      default:
        return <ExternalLink size={24} color="#007AFF" />;
    }
  };

  // Handle action press
  const handleActionPress = useCallback(async (action: ActionForm) => {
    await haptics.buttonPress();
    setSelectedAction(action);
    setShowActionModal(true);
  }, []);

  // Handle action submission
  const handleSubmitAction = useCallback(async (formData: Record<string, any>) => {
    if (!selectedAction) return;

    setIsSubmitting(true);
    
    try {
      // Add user info to form data
      const submissionData = {
        ...formData,
        eventId,
        submittedBy: userStore.profile?.displayName || 'Unknown',
        submissionTime: new Date().toISOString()
      };

      const success = await noticeBoardService.submitActionForm(
        selectedAction.id, 
        submissionData
      );

      if (success) {
        await haptics.successAction();
        Alert.alert(
          'Success',
          `Your ${selectedAction.title.toLowerCase()} has been submitted successfully. You will be notified of any response.`,
          [{ text: 'OK', onPress: () => setShowActionModal(false) }]
        );
        onActionSubmitted?.(selectedAction.id);
      } else {
        await haptics.errorAction();
        Alert.alert(
          'Error',
          'Failed to submit your request. Please try again or contact the race office directly.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      await haptics.errorAction();
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedAction, eventId, userStore, noticeBoardService, onActionSubmitted]);

  // Close modal
  const handleCloseModal = useCallback(() => {
    setShowActionModal(false);
    setSelectedAction(null);
  }, []);

  // Don't show actions for spectators
  if (userRole === 'spectator') {
    return null;
  }

  return (
    <View style={styles.container}>
      <IOSSection title="Sailor Actions" spacing="regular">
        <IOSText textStyle="caption1" color="secondaryLabel" style={styles.description}>
          Submit requests and communicate with race officials
        </IOSText>
        
        <View style={styles.actionsGrid}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.id}
              onPress={() => handleActionPress(action)}
              activeOpacity={0.7}
              style={styles.actionItem}
            >
              <IOSCard variant="elevated" style={styles.actionCard}>
                <View style={styles.actionIcon}>
                  {getActionIcon(action.icon)}
                </View>
                
                <IOSText textStyle="headline" weight="semibold" numberOfLines={2} style={styles.actionTitle}>
                  {action.title}
                </IOSText>
                
                <IOSText textStyle="caption1" color="secondaryLabel" numberOfLines={2} style={styles.actionDescription}>
                  {action.description}
                </IOSText>
                
                <View style={styles.actionArrow}>
                  <ExternalLink size={16} color="#8E8E93" />
                </View>
              </IOSCard>
            </TouchableOpacity>
          ))}
        </View>

        {/* Contact Information */}
        <IOSCard variant="elevated" style={styles.contactCard}>
          <IOSText textStyle="headline" weight="semibold" style={styles.contactTitle}>
            Race Office Contact
          </IOSText>
          <IOSText textStyle="callout" color="secondaryLabel">
            For urgent matters or technical issues, contact the race office directly:
          </IOSText>
          <View style={styles.contactDetails}>
            <IOSText textStyle="callout" color="systemBlue" style={styles.contactInfo}>
              📞 +852 2832 2817
            </IOSText>
            <IOSText textStyle="callout" color="systemBlue" style={styles.contactInfo}>
              📧 raceoffice@rhkyc.org.hk
            </IOSText>
            <IOSText textStyle="callout" color="secondaryLabel">
              📍 RHKYC Kellett Island
            </IOSText>
          </View>
        </IOSCard>
      </IOSSection>

      {/* Action Form Modal */}
      <Modal
        visible={showActionModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={handleCloseModal}
              style={styles.closeButton}
            >
              <X size={24} color="#007AFF" />
            </TouchableOpacity>
            
            <IOSText textStyle="headline" weight="semibold">
              {selectedAction?.title}
            </IOSText>
            
            <View style={styles.headerSpacer} />
          </View>

          {/* Modal Content */}
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {selectedAction && (
              <EnhancedActionFormContent
                action={selectedAction}
                onSubmit={handleSubmitAction}
                onCancel={handleCloseModal}
                isSubmitting={isSubmitting}
                eventId={eventId}
              />
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

// Enhanced Action Form Content Component
interface EnhancedActionFormContentProps {
  action: ActionForm;
  onSubmit: (formData: Record<string, any>) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  eventId: string;
}

const EnhancedActionFormContent: React.FC<EnhancedActionFormContentProps> = ({
  action,
  onSubmit,
  onCancel,
  isSubmitting,
  eventId
}) => {
  // Handle form submission with proper data transformation
  const handleFormSubmit = (formData: any) => {
    onSubmit(formData);
  };

  // Render the appropriate form based on action type
  switch (action.id) {
    case 'hearing_request':
      return (
        <HearingRequestForm
          eventId={eventId}
          onSubmit={handleFormSubmit}
          onCancel={onCancel}
          isSubmitting={isSubmitting}
        />
      );
    
    case 'question':
      return (
        <QuestionForm
          eventId={eventId}
          onSubmit={handleFormSubmit}
          onCancel={onCancel}
          isSubmitting={isSubmitting}
        />
      );
    
    case 'equipment_substitution':
      return (
        <EquipmentSubstitutionForm
          eventId={eventId}
          onSubmit={handleFormSubmit}
          onCancel={onCancel}
          isSubmitting={isSubmitting}
        />
      );
    
    default:
      // Fallback to generic form for other action types
      return (
        <GenericActionForm
          action={action}
          onSubmit={handleFormSubmit}
          onCancel={onCancel}
          isSubmitting={isSubmitting}
          eventId={eventId}
        />
      );
  }
};

// Generic Action Form for other action types
interface GenericActionFormProps {
  action: ActionForm;
  onSubmit: (formData: Record<string, any>) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  eventId: string;
}

const GenericActionForm: React.FC<GenericActionFormProps> = ({
  action,
  onSubmit,
  onCancel,
  isSubmitting,
  eventId
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const userStore = useUserStore();
  const profile = userStore.profile;

  // Initialize form with user data
  React.useEffect(() => {
    setFormData({
      competitor_name: profile?.displayName || '',
      sail_number: profile?.sailingExperience?.sailNumber || '',
      event_id: eventId,
    });
  }, [profile, eventId]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    // Basic validation
    const missingFields = action.requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      Alert.alert(
        'Missing Information',
        `Please fill in the following required fields: ${missingFields.join(', ')}`
      );
      return;
    }

    onSubmit(formData);
  };

  return (
    <View style={styles.formContainer}>
      <IOSSection spacing="regular">
        <IOSText textStyle="callout" color="secondaryLabel">
          {action.description}
        </IOSText>
        
        {/* Basic form fields for demo - in production would be dynamic */}
        <View style={styles.formFields}>
          {action.requiredFields.map((field) => (
            <View key={field} style={styles.formField}>
              <IOSText textStyle="headline" weight="medium" style={styles.fieldLabel}>
                {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} *
              </IOSText>
              
              {field === 'incident_description' || field === 'question_text' || field === 'reason' ? (
                // Text area for long text
                <View style={styles.textAreaContainer}>
                  <IOSText 
                    textStyle="body" 
                    style={styles.textArea}
                    onPress={() => {
                      Alert.prompt(
                        `Enter ${field.replace(/_/g, ' ')}`,
                        '',
                        (text) => handleInputChange(field, text),
                        'plain-text',
                        formData[field] || ''
                      );
                    }}
                  >
                    {formData[field] || `Tap to enter ${field.replace(/_/g, ' ')}`}
                  </IOSText>
                </View>
              ) : (
                // Single line input
                <View style={styles.inputContainer}>
                  <IOSText 
                    textStyle="body" 
                    style={styles.input}
                    onPress={() => {
                      Alert.prompt(
                        `Enter ${field.replace(/_/g, ' ')}`,
                        '',
                        (text) => handleInputChange(field, text),
                        'plain-text',
                        formData[field] || ''
                      );
                    }}
                  >
                    {formData[field] || `Enter ${field.replace(/_/g, ' ')}`}
                  </IOSText>
                </View>
              )}
            </View>
          ))}
        </View>

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
            icon={<Send size={20} color="#FFFFFF" />}
            style={styles.submitButton}
          />
        </View>
      </IOSSection>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  description: {
    marginBottom: 16,
    textAlign: 'center',
  },
  
  // Actions Grid
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  actionItem: {
    width: '48%',
  },
  actionCard: {
    padding: 16,
    alignItems: 'center',
    minHeight: 120,
  },
  actionIcon: {
    marginBottom: 8,
  },
  actionTitle: {
    textAlign: 'center',
    marginBottom: 4,
  },
  actionDescription: {
    textAlign: 'center',
    marginBottom: 8,
  },
  actionArrow: {
    marginTop: 'auto',
  },

  // Contact Card
  contactCard: {
    padding: 16,
  },
  contactTitle: {
    marginBottom: 8,
  },
  contactDetails: {
    marginTop: 12,
    gap: 4,
  },
  contactInfo: {
    fontWeight: '500',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  closeButton: {
    padding: 8,
  },
  headerSpacer: {
    width: 40,
  },
  modalContent: {
    flex: 1,
  },

  // Form Styles
  formContainer: {
    padding: 16,
  },
  formFields: {
    gap: 20,
    marginVertical: 24,
  },
  formField: {
    gap: 8,
  },
  fieldLabel: {
    color: '#1C1C1E',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#C6C6C8',
  },
  input: {
    color: '#1C1C1E',
    minHeight: 20,
  },
  textAreaContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#C6C6C8',
    minHeight: 80,
  },
  textArea: {
    color: '#1C1C1E',
    minHeight: 60,
  },
  submitButton: {
    flex: 2,
  },
  cancelButton: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
});

export default NoticeActions;