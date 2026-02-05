/**
 * Documents List Component
 * Displays race documents with categories and search
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert
} from 'react-native';
import Animated from '../../utils/reanimatedWrapper';
import {
  FileText,
  Download,
  Search,
  Filter,
  Calendar,
  ExternalLink,
  File,
  FileImage,
  FileVideo,
  Archive,
  AlertCircle
} from 'lucide-react-native';
import { dragonChampionshipsLightTheme } from '../../constants/dragonChampionshipsTheme';
import firebaseRaceDataService, { Document } from '../../services/firebaseRaceDataService';
import { DocumentViewer } from './DocumentViewer';

const { colors, typography, spacing, shadows, borderRadius } = dragonChampionshipsLightTheme;

interface DocumentsListProps {
  eventId: string;
  category?: string;
}

export function DocumentsList({ eventId, category }: DocumentsListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(category || 'All');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Document categories
  const categories = [
    'All',
    'Official Documents',
    'Sailing Instructions',
    'Schedules',
    'Results',
    'Class Rules',
    'Registration'
  ];

  // Load documents
  useEffect(() => {
    loadDocuments();
  }, [eventId]);

  // Filter documents when search or category changes
  useEffect(() => {
    filterDocuments();
  }, [documents, searchQuery, selectedCategory]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const docs = await firebaseRaceDataService.getDocuments(eventId);
      setDocuments(docs);
    } catch (error) {
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = documents;

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(doc => doc.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(query) ||
        doc.category.toLowerCase().includes(query) ||
        doc.type.toLowerCase().includes(query)
      );
    }

    setFilteredDocuments(filtered);
  };

  // Get file icon based on type
  const getFileIcon = (fileType: string, size: number = 20) => {
    const type = fileType.toLowerCase();
    const iconColor = colors.primary;

    switch (type) {
      case 'pdf':
        return <FileText color={iconColor} size={size} />;
      case 'doc':
      case 'docx':
        return <File color={iconColor} size={size} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileImage color={iconColor} size={size} />;
      case 'mp4':
      case 'mov':
      case 'avi':
        return <FileVideo color={iconColor} size={size} />;
      case 'zip':
      case 'rar':
        return <Archive color={iconColor} size={size} />;
      default:
        return <FileText color={iconColor} size={size} />;
    }
  };

  // Get category color
  const getCategoryColor = (cat: string) => {
    const colors_map: { [key: string]: string } = {
      'Official Documents': colors.championshipRed,
      'Sailing Instructions': colors.championshipBlue,
      'Schedules': colors.championshipYellow,
      'Results': colors.racingOptimal,
      'Class Rules': colors.racingChallenging,
      'Registration': colors.primary,
    };
    return colors_map[cat] || colors.textSecondary;
  };

  // Format file size
  const formatFileSize = (bytes: number | undefined): string => {
    if (!bytes) return '';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Open document
  const openDocument = (doc: Document) => {
    setSelectedDocument(doc);
  };

  // Render category filter
  const renderCategoryFilter = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoryContainer}
      contentContainerStyle={styles.categoryContent}
    >
      {categories.map(cat => {
        const isSelected = selectedCategory === cat;
        const categoryColor = getCategoryColor(cat);
        
        return (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryTab,
              isSelected && styles.categoryTabSelected,
              cat !== 'All' && {
                borderColor: categoryColor + '40',
                borderWidth: isSelected ? 2 : 1
              }
            ]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[
              styles.categoryTabText,
              isSelected && styles.categoryTabTextSelected,
              cat !== 'All' && !isSelected && { color: categoryColor }
            ]}>
              {cat}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  // Render document card
  const renderDocumentCard = (doc: Document, index: number) => (
    <Animated.View
      key={doc.id}
      style={styles.documentCard}
    >
      <TouchableOpacity
        style={styles.documentContent}
        onPress={() => openDocument(doc)}
        activeOpacity={0.7}
      >
        <View style={styles.documentHeader}>
          <View style={styles.documentIcon}>
            {getFileIcon(doc.fileType, 24)}
          </View>
          
          <View style={styles.documentInfo}>
            <Text style={styles.documentTitle} numberOfLines={2}>
              {doc.title}
            </Text>
            
            <View style={styles.documentMeta}>
              <View style={[
                styles.categoryBadge,
                { backgroundColor: getCategoryColor(doc.category) + '20' }
              ]}>
                <Text style={[
                  styles.categoryBadgeText,
                  { color: getCategoryColor(doc.category) }
                ]}>
                  {doc.category}
                </Text>
              </View>
              
              {doc.uploadedAt && (
                <View style={styles.documentDate}>
                  <Calendar color={colors.textTertiary} size={12} />
                  <Text style={styles.documentDateText}>
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.documentDetails}>
              <Text style={styles.documentDetailText}>
                {doc.fileType.toUpperCase()}
              </Text>
              <Text style={styles.documentDetailSeparator}>•</Text>
              <Text style={styles.documentDetailText}>
                {formatFileSize((doc as any).size)}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.actionButton}>
            <ExternalLink color={colors.primary} size={18} />
          </TouchableOpacity>
        </View>
        
        {(doc as any).description && (
          <Text style={styles.documentDescription} numberOfLines={2}>
            {(doc as any).description}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading documents...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle color={colors.error} size={48} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadDocuments}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search color={colors.textSecondary} size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search documents..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textTertiary}
          />
        </View>
      </View>

      {/* Category Filter */}
      {renderCategoryFilter()}

      {/* Documents List */}
      <ScrollView
        style={styles.documentsList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.documentsContent}
      >
        {filteredDocuments.length > 0 ? (
          filteredDocuments.map((doc, index) => renderDocumentCard(doc, index))
        ) : (
          <View style={styles.emptyState}>
            <FileText color={colors.textMuted} size={48} />
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'No documents found' : 'No documents available'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery ? 'Try adjusting your search' : 'Documents will appear here when available'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    ...typography.bodyLarge,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  retryButtonText: {
    ...typography.labelLarge,
    color: colors.textInverted,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.bodyMedium,
    color: colors.text,
    fontSize: 16,
  },
  categoryContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  categoryContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  categoryTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  categoryTabSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryTabText: {
    ...typography.labelMedium,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  categoryTabTextSelected: {
    color: colors.textInverted,
    fontWeight: '600',
  },
  documentsList: {
    flex: 1,
  },
  documentsContent: {
    padding: spacing.md,
  },
  documentCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.card,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.cardSmall,
  },
  documentContent: {
    padding: spacing.md,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  documentIcon: {
    padding: spacing.sm,
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    ...typography.bodyLarge,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  categoryBadgeText: {
    ...typography.labelSmall,
    fontWeight: '600',
    fontSize: 11,
  },
  documentDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  documentDateText: {
    ...typography.labelSmall,
    color: colors.textTertiary,
    fontSize: 11,
  },
  documentDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  documentDetailText: {
    ...typography.labelSmall,
    color: colors.textSecondary,
    fontSize: 11,
  },
  documentDetailSeparator: {
    ...typography.labelSmall,
    color: colors.textTertiary,
    fontSize: 11,
  },
  actionButton: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
  },
  documentDescription: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyStateText: {
    ...typography.headlineSmall,
    color: colors.textMuted,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    ...typography.bodyMedium,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});