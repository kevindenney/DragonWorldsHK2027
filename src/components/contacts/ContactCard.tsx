import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Radio,
  Star,
  User,
  AlertTriangle,
  ExternalLink
} from 'lucide-react-native';

import { IOSText, IOSButton, IOSCard } from '../ios';
import type { KeyContact } from '../../types/contacts';
import { useContactsStore } from '../../stores/contactsStore';

interface ContactCardProps {
  contact: KeyContact;
  showActions?: boolean;
  compact?: boolean;
}

export const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  showActions = true,
  compact = false,
}) => {
  const { 
    toggleFavorite, 
    callContact, 
    emailContact, 
    trackContactInteraction,
    favoriteContacts 
  } = useContactsStore();
  
  const isFavorite = favoriteContacts.includes(contact.id);

  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'principal-race-officer':
      case 'chief-judge':
      case 'regatta-director':
        return '#FF9500';
      case 'safety-officer':
        return '#FF3B30';
      case 'coast-guard':
      case 'marine-police':
        return '#DC143C';
      case 'hospital':
      case 'event-medical':
        return '#34C759';
      case 'yacht-club-office':
      case 'marina-office':
        return '#007AFF';
      default:
        return '#8E8E93';
    }
  };

  const getRoleIcon = (role: string) => {
    const color = getRoleColor(role);
    switch (role) {
      case 'principal-race-officer':
      case 'chief-judge':
      case 'regatta-director':
        return <User size={16} color={color} />;
      case 'safety-officer':
        return <AlertTriangle size={16} color={color} />;
      case 'coast-guard':
      case 'marine-police':
      case 'hospital':
      case 'event-medical':
        return <AlertTriangle size={16} color={color} />;
      default:
        return <User size={16} color={color} />;
    }
  };

  const formatRole = (role: string): string => {
    return role
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleCall = async () => {
    if (contact.phone) {
      await callContact(contact.id);
    } else {
      Alert.alert('No Phone Number', 'This contact does not have a phone number available.');
    }
  };

  const handleEmail = async () => {
    if (contact.email) {
      await emailContact(contact.id);
    } else {
      Alert.alert('No Email', 'This contact does not have an email address available.');
    }
  };

  const handleToggleFavorite = () => {
    toggleFavorite(contact.id);
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
        <IOSCard style={[styles.card, styles.compactCard]}>
          <View style={styles.compactContent}>
            <View style={styles.compactHeader}>
              <View style={styles.roleIcon}>
                {getRoleIcon(contact.role)}
              </View>
              <View style={styles.compactInfo}>
                <IOSText style={styles.compactName}>{contact.name}</IOSText>
                <IOSText style={styles.compactRole}>{formatRole(contact.role)}</IOSText>
              </View>
              {contact.isEmergency && (
                <AlertTriangle size={16} color="#FF3B30" />
              )}
            </View>
            
            {showActions && (
              <View style={styles.compactActions}>
                {contact.phone && (
                  <TouchableOpacity onPress={handleCall} style={styles.compactActionButton}>
                    <Phone size={16} color="#007AFF" />
                  </TouchableOpacity>
                )}
                {contact.email && (
                  <TouchableOpacity onPress={handleEmail} style={styles.compactActionButton}>
                    <Mail size={16} color="#007AFF" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </IOSCard>
      </TouchableOpacity>
    );
  }

  return (
    <IOSCard style={styles.card}>
      <TouchableOpacity onPress={handleCardPress} style={styles.cardContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.roleIcon}>
              {getRoleIcon(contact.role)}
            </View>
            <View style={styles.titleContainer}>
              <IOSText style={styles.name}>{contact.name}</IOSText>
              <IOSText style={[styles.role, { color: getRoleColor(contact.role) }]}>
                {formatRole(contact.role)}
              </IOSText>
              {contact.organization && (
                <IOSText style={styles.organization}>{contact.organization}</IOSText>
              )}
            </View>
            <View style={styles.badges}>
              {contact.isEmergency && (
                <AlertTriangle size={16} color="#FF3B30" />
              )}
              <TouchableOpacity onPress={handleToggleFavorite} style={styles.favoriteButton}>
                <Star 
                  size={16} 
                  color={isFavorite ? "#FFD700" : "#8E8E93"} 
                  fill={isFavorite ? "#FFD700" : "transparent"}
                />
              </TouchableOpacity>
            </View>
          </View>
          
          {contact.description && (
            <IOSText style={styles.description}>{contact.description}</IOSText>
          )}
        </View>

        {/* Contact Details */}
        <View style={styles.details}>
          {contact.phone && (
            <View style={styles.detailItem}>
              <Phone size={14} color="#8E8E93" />
              <IOSText style={styles.detailText}>{contact.phone}</IOSText>
            </View>
          )}
          
          {contact.email && (
            <View style={styles.detailItem}>
              <Mail size={14} color="#8E8E93" />
              <IOSText style={styles.detailText}>{contact.email}</IOSText>
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
          
          {contact.availability && (
            <View style={styles.detailItem}>
              <Clock size={14} color="#8E8E93" />
              <IOSText style={styles.detailText}>{contact.availability}</IOSText>
            </View>
          )}
          
          {contact.hours && (
            <View style={styles.detailItem}>
              <Clock size={14} color="#8E8E93" />
              <IOSText style={styles.detailText}>{contact.hours}</IOSText>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Actions */}
      {showActions && (
        <View style={styles.actions}>
          {contact.phone && (
            <IOSButton
              title="Call"
              onPress={handleCall}
              variant="filled"
              size="small"
              icon={<Phone size={16} color="#FFFFFF" />}
              style={styles.actionButton}
            />
          )}
          
          {contact.email && (
            <IOSButton
              title="Email"
              onPress={handleEmail}
              variant="tinted"
              size="small"
              icon={<Mail size={16} color="#007AFF" />}
              style={styles.actionButton}
            />
          )}
        </View>
      )}
    </IOSCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    padding: 0,
  },
  compactCard: {
    marginBottom: 8,
  },
  cardContent: {
    padding: 16,
  },
  compactContent: {
    padding: 12,
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
  roleIcon: {
    marginRight: 12,
    marginTop: 2,
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
  role: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  compactRole: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
  },
  organization: {
    fontSize: 12,
    color: '#8E8E93',
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favoriteButton: {
    padding: 4,
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#C6C6C8',
    gap: 12,
  },
  compactActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minWidth: 80,
  },
  compactActionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
});