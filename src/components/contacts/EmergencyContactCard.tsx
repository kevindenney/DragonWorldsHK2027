import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { 
  Phone, 
  AlertTriangle, 
  Radio,
  Clock,
  MapPin,
  PhoneCall
} from 'lucide-react-native';

import { IOSText, IOSButton, IOSCard } from '../ios';
import type { EmergencyContact } from '../../types/contacts';
import { useContactsStore } from '../../stores/contactsStore';

interface EmergencyContactCardProps {
  contact: EmergencyContact;
  showQuickDial?: boolean;
  compact?: boolean;
}

export const EmergencyContactCard: React.FC<EmergencyContactCardProps> = ({
  contact,
  showQuickDial = true,
  compact = false,
}) => {
  const { callEmergencyContact, trackContactInteraction } = useContactsStore();

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical':
        return '#FF3B30';
      case 'urgent':
        return '#FF9500';
      case 'important':
        return '#FFD60A';
      default:
        return '#8E8E93';
    }
  };

  const getEmergencyTypeIcon = (type: string) => {
    const color = getPriorityColor(contact.priority);
    switch (type) {
      case 'medical':
        return <AlertTriangle size={16} color={color} />;
      case 'marine-rescue':
        return <AlertTriangle size={16} color={color} />;
      case 'security':
        return <AlertTriangle size={16} color={color} />;
      case 'weather':
        return <AlertTriangle size={16} color={color} />;
      case 'technical':
        return <AlertTriangle size={16} color={color} />;
      default:
        return <AlertTriangle size={16} color={color} />;
    }
  };

  const formatEmergencyType = (type: string): string => {
    return type
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatPriority = (priority: string): string => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const handleQuickCall = async () => {
    Alert.alert(
      'Emergency Call',
      `Are you sure you want to call ${contact.name}?\n\nThis is an emergency contact.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call Now',
          style: 'destructive',
          onPress: async () => {
            await callEmergencyContact(contact.id);
          }
        }
      ]
    );
  };

  const handleCardPress = () => {
    trackContactInteraction({
      contactId: contact.id,
      type: 'view',
      timestamp: new Date().toISOString()
    });
  };

  if (compact) {
    return (
      <TouchableOpacity onPress={handleCardPress}>
        <IOSCard style={[styles.card, styles.compactCard, { borderLeftColor: getPriorityColor(contact.priority) }]}>
          <View style={styles.compactContent}>
            <View style={styles.compactHeader}>
              <View style={styles.priorityIndicator}>
                {getEmergencyTypeIcon(contact.emergencyType)}
              </View>
              <View style={styles.compactInfo}>
                <IOSText style={styles.compactName}>{contact.name}</IOSText>
                <IOSText style={[styles.compactType, { color: getPriorityColor(contact.priority) }]}>
                  {formatEmergencyType(contact.emergencyType)}
                </IOSText>
              </View>
              <View style={styles.priorityBadge}>
                <IOSText style={[styles.priorityText, { color: getPriorityColor(contact.priority) }]}>
                  {formatPriority(contact.priority).toUpperCase()}
                </IOSText>
              </View>
            </View>
            
            {showQuickDial && contact.quickDial && contact.phone && (
              <TouchableOpacity onPress={handleQuickCall} style={[styles.quickDialButton, { borderColor: getPriorityColor(contact.priority) }]}>
                <PhoneCall size={16} color={getPriorityColor(contact.priority)} />
              </TouchableOpacity>
            )}
          </View>
        </IOSCard>
      </TouchableOpacity>
    );
  }

  return (
    <IOSCard style={[styles.card, styles.emergencyCard, { borderLeftColor: getPriorityColor(contact.priority) }]}>
      <TouchableOpacity onPress={handleCardPress} style={styles.cardContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.emergencyIcon}>
              {getEmergencyTypeIcon(contact.emergencyType)}
            </View>
            <View style={styles.titleContainer}>
              <IOSText style={styles.name}>{contact.name}</IOSText>
              <IOSText style={[styles.emergencyType, { color: getPriorityColor(contact.priority) }]}>
                {formatEmergencyType(contact.emergencyType)}
              </IOSText>
              {contact.organization && (
                <IOSText style={styles.organization}>{contact.organization}</IOSText>
              )}
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: `${getPriorityColor(contact.priority)}15` }]}>
              <IOSText style={[styles.priorityText, { color: getPriorityColor(contact.priority) }]}>
                {formatPriority(contact.priority).toUpperCase()}
              </IOSText>
            </View>
          </View>
          
          <IOSText style={styles.description}>{contact.description}</IOSText>
        </View>

        {/* Emergency Details */}
        <View style={styles.details}>
          {contact.phone && (
            <View style={styles.detailItem}>
              <Phone size={14} color="#8E8E93" />
              <IOSText style={styles.detailText}>{contact.phone}</IOSText>
              {contact.internationalFormat && (
                <IOSText style={styles.internationalText}>({contact.internationalFormat})</IOSText>
              )}
            </View>
          )}
          
          {contact.vhfChannel && (
            <View style={styles.detailItem}>
              <Radio size={14} color="#8E8E93" />
              <IOSText style={styles.detailText}>{contact.vhfChannel}</IOSText>
            </View>
          )}
          
          {contact.location && (
            <View style={styles.detailItem}>
              <MapPin size={14} color="#8E8E93" />
              <IOSText style={styles.detailText}>{contact.location}</IOSText>
            </View>
          )}
          
          <View style={styles.detailItem}>
            <Clock size={14} color="#8E8E93" />
            <IOSText style={styles.detailText}>{contact.availability || '24/7'}</IOSText>
          </View>
          
          {contact.alternativeNumbers && contact.alternativeNumbers.length > 0 && (
            <View style={styles.alternativeNumbers}>
              <IOSText style={styles.alternativeTitle}>Alternative Numbers:</IOSText>
              {contact.alternativeNumbers.map((number, index) => (
                <IOSText key={index} style={styles.alternativeNumber}>• {number}</IOSText>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Emergency Actions */}
      <View style={[styles.actions, { backgroundColor: `${getPriorityColor(contact.priority)}05` }]}>
        {contact.quickDial && contact.phone && (
          <IOSButton
            title="Emergency Call"
            onPress={handleQuickCall}
            variant="filled"
            size="medium"
            icon={<PhoneCall size={16} color="#FFFFFF" />}
            style={[styles.emergencyButton, { backgroundColor: getPriorityColor(contact.priority) }]}
          />
        )}
        
        {contact.vhfChannel && (
          <IOSButton
            title={`VHF ${contact.vhfChannel}`}
            onPress={() => Alert.alert('VHF Radio', `Switch to ${contact.vhfChannel} on your VHF radio`)}
            variant="tinted"
            size="small"
            icon={<Radio size={16} color="#007AFF" />}
            style={styles.vhfButton}
          />
        )}
      </View>
    </IOSCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    padding: 0,
    borderLeftWidth: 4,
  },
  emergencyCard: {
    borderLeftWidth: 4,
  },
  compactCard: {
    marginBottom: 8,
    borderLeftWidth: 3,
  },
  cardContent: {
    padding: 16,
  },
  compactContent: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  header: {
    marginBottom: 12,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  emergencyIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  priorityIndicator: {
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  compactInfo: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  compactName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 1,
  },
  emergencyType: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  compactType: {
    fontSize: 12,
    fontWeight: '500',
  },
  organization: {
    fontSize: 12,
    color: '#8E8E93',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#F2F2F7',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 14,
    color: '#3C3C43',
    lineHeight: 20,
  },
  details: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#3C3C43',
    marginLeft: 8,
    flex: 1,
  },
  internationalText: {
    fontSize: 11,
    color: '#8E8E93',
    marginLeft: 4,
  },
  alternativeNumbers: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 6,
  },
  alternativeTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3C3C43',
    marginBottom: 4,
  },
  alternativeNumber: {
    fontSize: 12,
    color: '#3C3C43',
    marginLeft: 8,
    marginBottom: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
    gap: 12,
  },
  emergencyButton: {
    flex: 1,
    minHeight: 44,
  },
  vhfButton: {
    minWidth: 100,
  },
  quickDialButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
  },
});