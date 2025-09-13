import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { 
  ExternalLink, 
  Radio, 
  Globe, 
  MapPin, 
  Clock,
  Facebook,
  Instagram,
  Smartphone,
  FileText,
  Anchor
} from 'lucide-react-native';

import { IOSText, IOSButton, IOSCard } from '../ios';
import type { CommunicationChannel } from '../../types/contacts';
import { useContactsStore } from '../../stores/contactsStore';

interface CommunicationChannelCardProps {
  channel: CommunicationChannel;
  compact?: boolean;
}

export const CommunicationChannelCard: React.FC<CommunicationChannelCardProps> = ({
  channel,
  compact = false,
}) => {
  const { openCommunicationChannel } = useContactsStore();

  const getChannelIcon = (type: string, name?: string) => {
    const color = getChannelColor(type);
    
    // Special handling for specific social media
    if (name?.toLowerCase().includes('facebook')) {
      return <Facebook size={16} color="#1877F2" />;
    }
    if (name?.toLowerCase().includes('instagram')) {
      return <Instagram size={16} color="#E4405F" />;
    }
    
    switch (type) {
      case 'vhf':
        return <Radio size={16} color={color} />;
      case 'website':
        return <Globe size={16} color={color} />;
      case 'social':
        return <ExternalLink size={16} color={color} />;
      case 'physical':
        return <MapPin size={16} color={color} />;
      case 'app':
        return <Smartphone size={16} color={color} />;
      case 'notice-board':
        return <FileText size={16} color={color} />;
      default:
        return <ExternalLink size={16} color={color} />;
    }
  };

  const getChannelColor = (type: string): string => {
    switch (type) {
      case 'vhf':
        return '#FF9500';
      case 'website':
        return '#007AFF';
      case 'social':
        return '#32D74B';
      case 'physical':
        return '#8E8E93';
      case 'app':
        return '#5856D6';
      case 'notice-board':
        return '#AF52DE';
      default:
        return '#8E8E93';
    }
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'official':
        return '#007AFF';
      case 'emergency':
        return '#FF3B30';
      case 'social':
        return '#32D74B';
      case 'technical':
        return '#FF9500';
      default:
        return '#8E8E93';
    }
  };

  const formatChannelType = (type: string): string => {
    switch (type) {
      case 'vhf':
        return 'VHF Radio';
      case 'website':
        return 'Website';
      case 'social':
        return 'Social Media';
      case 'physical':
        return 'Physical Location';
      case 'app':
        return 'Mobile App';
      case 'notice-board':
        return 'Notice Board';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const formatCategory = (category: string): string => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const handleChannelPress = async () => {
    if (channel.type === 'vhf') {
      Alert.alert(
        'VHF Radio Channel',
        `Switch to ${channel.vhfChannel || channel.details} on your VHF radio to access ${channel.name}.`,
        [{ text: 'OK' }]
      );
    } else if (channel.type === 'physical') {
      Alert.alert(
        'Physical Location',
        `${channel.name}\n\n${channel.details}${channel.location ? `\n\nLocation: ${channel.location}` : ''}${channel.hours ? `\nHours: ${channel.hours}` : ''}`,
        [{ text: 'OK' }]
      );
    } else if (channel.url) {
      await openCommunicationChannel(channel.id);
    } else {
      Alert.alert(
        channel.name,
        channel.details,
        [{ text: 'OK' }]
      );
    }
  };

  if (compact) {
    return (
      <TouchableOpacity onPress={handleChannelPress}>
        <IOSCard style={[styles.card, styles.compactCard]}>
          <View style={styles.compactContent}>
            <View style={styles.compactHeader}>
              <View style={styles.channelIcon}>
                {getChannelIcon(channel.type, channel.name)}
              </View>
              <View style={styles.compactInfo}>
                <IOSText style={styles.compactName}>{channel.name}</IOSText>
                <IOSText style={styles.compactType}>{formatChannelType(channel.type)}</IOSText>
              </View>
              {channel.isOfficial && (
                <View style={styles.officialBadge}>
                  <IOSText style={styles.officialText}>OFFICIAL</IOSText>
                </View>
              )}
            </View>
          </View>
        </IOSCard>
      </TouchableOpacity>
    );
  }

  return (
    <IOSCard style={styles.card}>
      <TouchableOpacity onPress={handleChannelPress} style={styles.cardContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.channelIcon}>
              {getChannelIcon(channel.type, channel.name)}
            </View>
            <View style={styles.titleContainer}>
              <IOSText style={styles.name}>{channel.name}</IOSText>
              <IOSText style={[styles.channelType, { color: getChannelColor(channel.type) }]}>
                {formatChannelType(channel.type)}
              </IOSText>
            </View>
            <View style={styles.badges}>
              {channel.isOfficial && (
                <View style={[styles.officialBadge, { backgroundColor: `${getCategoryColor(channel.category)}15` }]}>
                  <IOSText style={[styles.officialText, { color: getCategoryColor(channel.category) }]}>
                    OFFICIAL
                  </IOSText>
                </View>
              )}
              <View style={[styles.categoryBadge, { backgroundColor: `${getCategoryColor(channel.category)}15` }]}>
                <IOSText style={[styles.categoryText, { color: getCategoryColor(channel.category) }]}>
                  {formatCategory(channel.category)}
                </IOSText>
              </View>
            </View>
          </View>
          
          <IOSText style={styles.description}>{channel.details}</IOSText>
        </View>

        {/* Channel Details */}
        <View style={styles.details}>
          {channel.vhfChannel && (
            <View style={styles.detailItem}>
              <Radio size={14} color="#8E8E93" />
              <IOSText style={styles.detailText}>{channel.vhfChannel}</IOSText>
            </View>
          )}
          
          {channel.location && (
            <View style={styles.detailItem}>
              <MapPin size={14} color="#8E8E93" />
              <IOSText style={styles.detailText}>{channel.location}</IOSText>
            </View>
          )}
          
          {channel.hours && (
            <View style={styles.detailItem}>
              <Clock size={14} color="#8E8E93" />
              <IOSText style={styles.detailText}>{channel.hours}</IOSText>
            </View>
          )}

          {channel.url && (
            <View style={styles.detailItem}>
              <Globe size={14} color="#8E8E93" />
              <IOSText style={styles.urlText} numberOfLines={1}>{channel.url}</IOSText>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Actions */}
      <View style={styles.actions}>
        {channel.type === 'vhf' && (
          <IOSButton
            title={`Switch to ${channel.vhfChannel || channel.details}`}
            onPress={handleChannelPress}
            variant="tinted"
            size="small"
            icon={<Radio size={16} color="#007AFF" />}
            style={styles.actionButton}
          />
        )}
        
        {channel.url && (
          <IOSButton
            title="Open"
            onPress={handleChannelPress}
            variant="filled"
            size="small"
            icon={<ExternalLink size={16} color="#FFFFFF" />}
            style={styles.actionButton}
          />
        )}
        
        {channel.type === 'physical' && (
          <IOSButton
            title="View Details"
            onPress={handleChannelPress}
            variant="tinted"
            size="small"
            icon={<MapPin size={16} color="#007AFF" />}
            style={styles.actionButton}
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
  channelIcon: {
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
  channelType: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  compactType: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
  },
  badges: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
  },
  officialBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#007AFF15',
  },
  officialText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#007AFF',
    letterSpacing: 0.5,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
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
  urlText: {
    fontSize: 12,
    color: '#007AFF',
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
  actionButton: {
    flex: 1,
    minWidth: 80,
  },
});