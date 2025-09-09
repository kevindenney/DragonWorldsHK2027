import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  Check,
  Star,
  Crown,
  ChevronLeft,
  Anchor
} from 'lucide-react-native';
import { colors, spacing } from '../../constants/theme';
import {
  IOSModal,
  IOSCard,
  IOSButton,
  IOSText,
  IOSBadge,
  IOSList
} from '../../components/ios';

// TypeScript interfaces
interface PricingFeature {
  id: string;
  name: string;
  included: boolean;
}

interface PricingTier {
  id: string;
  name: string;
  price: number;
  period: 'month' | 'year';
  isPopular?: boolean;
  features: PricingFeature[];
  description: string;
}

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubscribe: (tierId: string) => void;
}

// Feature List Component
const FeatureList: React.FC<{ 
  features: PricingFeature[];
  highlightIncluded?: boolean;
}> = ({ features, highlightIncluded = false }) => (
  <View style={styles.featureList}>
    {features.map((feature) => (
      <View key={feature.id} style={styles.featureItem}>
        <View style={styles.featureIcon}>
          {feature.included ? (
            <Check 
              size={16} 
              color={highlightIncluded ? colors.success : colors.textSecondary} 
            />
          ) : (
            <View style={styles.featureIconPlaceholder} />
          )}
        </View>
        <IOSText 
          textStyle="callout" 
          color={feature.included ? 'label' : 'tertiaryLabel'}
          style={[
            styles.featureText,
            !feature.included && styles.featureTextDisabled
          ]}
        >
          {feature.name}
        </IOSText>
      </View>
    ))}
  </View>
);

// Pricing Card Component
const PricingCard: React.FC<{
  tier: PricingTier;
  isSelected: boolean;
  onSelect: () => void;
  onSubscribe: () => void;
}> = ({ tier, isSelected, onSelect, onSubscribe }) => {
  const getTierIcon = (tierId: string) => {
    switch (tierId) {
      case 'basic':
        return <Anchor size={24} color={colors.primary} />;
      case 'professional':
        return <Star size={24} color={colors.warning} />;
      case 'elite':
        return <Crown size={24} color={colors.accent} />;
      default:
        return <Anchor size={24} color={colors.primary} />;
    }
  };

  const getTierColor = (tierId: string) => {
    switch (tierId) {
      case 'basic':
        return colors.primary;
      case 'professional':
        return colors.warning;
      case 'elite':
        return colors.accent;
      default:
        return colors.primary;
    }
  };

  return (
    <IOSCard 
      variant={isSelected ? "elevated" : "filled"} 
      style={[
        styles.pricingCard,
        isSelected && styles.pricingCardSelected,
        tier.isPopular && styles.pricingCardPopular
      ]}
    >
      {tier.isPopular && (
        <View style={styles.popularBadgeContainer}>
          <IOSBadge color="systemOrange" variant="filled" size="small">
            MOST POPULAR
          </IOSBadge>
        </View>
      )}
      
      <View style={styles.tierHeader}>
        <View style={styles.tierIconContainer}>
          {getTierIcon(tier.id)}
        </View>
        <IOSText textStyle="title2" weight="bold" color="label">
          {tier.name}
        </IOSText>
        <IOSText textStyle="callout" color="secondaryLabel" style={styles.tierDescription}>
          {tier.description}
        </IOSText>
      </View>

      <View style={styles.priceContainer}>
        <View style={styles.priceRow}>
          <IOSText textStyle="largeTitle" weight="heavy" color="label">
            ${tier.price.toFixed(2)}
          </IOSText>
          <IOSText textStyle="callout" color="secondaryLabel" style={styles.pricePeriod}>
            /{tier.period}
          </IOSText>
        </View>
      </View>

      <FeatureList features={tier.features} highlightIncluded={tier.isPopular} />

      <View style={styles.cardActions}>
        <IOSButton
          title={isSelected ? "Selected Plan" : "Select Plan"}
          variant={tier.isPopular ? "filled" : "tinted"}
          size="large"
          onPress={onSelect}
          disabled={isSelected}
          style={styles.selectButton}
        />
        
        {isSelected && (
          <IOSButton
            title="Start Subscription"
            variant="filled"
            size="large"
            onPress={onSubscribe}
            style={styles.subscribeButton}
          />
        )}
      </View>
    </IOSCard>
  );
};

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  visible,
  onClose,
  onSubscribe
}) => {
  const [selectedTier, setSelectedTier] = useState<string | null>('professional');

  // Mock pricing data
  const pricingTiers: PricingTier[] = [
    {
      id: 'basic',
      name: 'Basic Sailing',
      price: 9.99,
      period: 'month',
      description: 'Essential sailing features',
      features: [
        { id: '1', name: 'Weather forecasts', included: true },
        { id: '2', name: 'Basic race results', included: true },
        { id: '3', name: 'Event schedule', included: true },
        { id: '4', name: 'Live race tracking', included: false },
        { id: '5', name: 'Premium weather analysis', included: false },
        { id: '6', name: 'Detailed race analytics', included: false },
        { id: '7', name: 'VIP event access', included: false },
        { id: '8', name: 'Personal coaching insights', included: false },
      ]
    },
    {
      id: 'professional',
      name: 'Professional Racing',
      price: 24.99,
      period: 'month',
      isPopular: true,
      description: 'Advanced racing tools',
      features: [
        { id: '1', name: 'Weather forecasts', included: true },
        { id: '2', name: 'Basic race results', included: true },
        { id: '3', name: 'Event schedule', included: true },
        { id: '4', name: 'Live race tracking', included: true },
        { id: '5', name: 'Premium weather analysis', included: true },
        { id: '6', name: 'Detailed race analytics', included: true },
        { id: '7', name: 'VIP event access', included: false },
        { id: '8', name: 'Personal coaching insights', included: false },
      ]
    },
    {
      id: 'elite',
      name: 'Elite Sailor',
      price: 49.99,
      period: 'month',
      description: 'Complete sailing ecosystem',
      features: [
        { id: '1', name: 'Weather forecasts', included: true },
        { id: '2', name: 'Basic race results', included: true },
        { id: '3', name: 'Event schedule', included: true },
        { id: '4', name: 'Live race tracking', included: true },
        { id: '5', name: 'Premium weather analysis', included: true },
        { id: '6', name: 'Detailed race analytics', included: true },
        { id: '7', name: 'VIP event access', included: true },
        { id: '8', name: 'Personal coaching insights', included: true },
      ]
    }
  ];

  const handleTierSelect = (tierId: string) => {
    setSelectedTier(tierId);
  };

  const handleSubscribe = (tierId: string) => {
    onSubscribe(tierId);
  };

  const allFeatures = pricingTiers[0].features;

  return (
    <IOSModal
      visible={visible}
      onClose={onClose}
      presentationStyle="pageSheet"
      showsHandleIndicator={true}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <IOSButton
            title=""
            variant="plain"
            onPress={onClose}
            style={styles.backButton}
          />
          <View style={styles.headerContent}>
            <IOSText textStyle="title1" weight="bold" style={styles.headerTitle}>
              Choose Your Plan
            </IOSText>
            <IOSText textStyle="callout" color="secondaryLabel" style={styles.headerSubtitle}>
              Unlock premium sailing features
            </IOSText>
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Pricing Cards */}
          <View style={styles.pricingSection}>
            {pricingTiers.map((tier) => (
              <PricingCard
                key={tier.id}
                tier={tier}
                isSelected={selectedTier === tier.id}
                onSelect={() => handleTierSelect(tier.id)}
                onSubscribe={() => handleSubscribe(tier.id)}
              />
            ))}
          </View>

          {/* Feature Comparison */}
          <IOSCard variant="elevated" style={styles.comparisonCard}>
            <IOSText textStyle="title3" weight="semibold" style={styles.comparisonTitle}>
              Feature Comparison
            </IOSText>
            
            <View style={styles.comparisonTable}>
              <View style={styles.comparisonHeader}>
                <IOSText textStyle="caption1" color="secondaryLabel" style={styles.featureNameHeader}>
                  Features
                </IOSText>
                {pricingTiers.map((tier) => (
                  <IOSText 
                    key={tier.id} 
                    textStyle="caption1" 
                    color="secondaryLabel" 
                    style={styles.tierNameHeader}
                  >
                    {tier.name.split(' ')[0]}
                  </IOSText>
                ))}
              </View>
              
              {allFeatures.map((feature) => (
                <View key={feature.id} style={styles.comparisonRow}>
                  <IOSText textStyle="footnote" color="label" style={styles.featureName}>
                    {feature.name}
                  </IOSText>
                  {pricingTiers.map((tier) => {
                    const tierFeature = tier.features.find(f => f.id === feature.id);
                    return (
                      <View key={tier.id} style={styles.featureCheck}>
                        {tierFeature?.included ? (
                          <Check size={12} color={colors.success} />
                        ) : (
                          <View style={styles.featureCheckPlaceholder} />
                        )}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          </IOSCard>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <IOSText textStyle="caption1" color="tertiaryLabel" style={styles.trialInfo}>
            7-day free trial • Cancel anytime
          </IOSText>
          <IOSButton
            title="Terms & Conditions"
            variant="plain"
            size="small"
            onPress={() => {}}
            style={styles.termsButton}
            textStyle={styles.termsButtonText}
          />
        </View>
      </View>
    </IOSModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    marginBottom: 4,
  },
  headerSubtitle: {
    // Typography handled by IOSText
  },
  
  // Content
  scrollView: {
    flex: 1,
  },
  
  // Pricing Section
  pricingSection: {
    paddingHorizontal: 16,
    gap: 16,
  },
  pricingCard: {
    position: 'relative',
  },
  pricingCardSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  pricingCardPopular: {
    borderWidth: 2,
    borderColor: colors.warning,
  },
  popularBadgeContainer: {
    position: 'absolute',
    top: -8,
    alignSelf: 'center',
    zIndex: 1,
  },
  
  // Tier Header
  tierHeader: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  tierIconContainer: {
    marginBottom: 8,
  },
  tierDescription: {
    textAlign: 'center',
    marginTop: 4,
  },
  
  // Price
  priceContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  pricePeriod: {
    marginLeft: 4,
  },
  
  // Features
  featureList: {
    gap: 12,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: 20,
    alignItems: 'center',
  },
  featureIconPlaceholder: {
    width: 16,
    height: 16,
  },
  featureText: {
    marginLeft: 8,
    flex: 1,
  },
  featureTextDisabled: {
    textDecorationLine: 'line-through',
  },
  
  // Card Actions
  cardActions: {
    gap: 8,
  },
  selectButton: {
    // Button styling handled by IOSButton
  },
  subscribeButton: {
    // Button styling handled by IOSButton
  },
  
  // Feature Comparison
  comparisonCard: {
    margin: 16,
    marginTop: 24,
  },
  comparisonTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  comparisonTable: {
    // Table styling
  },
  comparisonHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    marginBottom: 8,
  },
  featureNameHeader: {
    flex: 2,
    fontWeight: '600',
  },
  tierNameHeader: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  featureName: {
    flex: 2,
  },
  featureCheck: {
    flex: 1,
    alignItems: 'center',
  },
  featureCheckPlaceholder: {
    width: 12,
    height: 12,
  },
  
  // Footer
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    alignItems: 'center',
  },
  trialInfo: {
    textAlign: 'center',
    marginBottom: 8,
  },
  termsButton: {
    paddingHorizontal: 0,
  },
  termsButtonText: {
    fontSize: 13,
    color: colors.primary,
  },
});