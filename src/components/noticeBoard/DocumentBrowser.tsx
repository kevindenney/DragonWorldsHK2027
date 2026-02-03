import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Share,
  TextInput,
  SafeAreaView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  ProcessedDocument, 
  DocumentContent, 
  DocumentSearchResult,
  documentProcessingService 
} from '../../services/documentProcessingService';

interface DocumentBrowserProps {
  eventId: string;
  visible: boolean;
  onClose: () => void;
  initialDocument?: ProcessedDocument;
  onDocumentSelect?: (document: ProcessedDocument) => void;
}

export const DocumentBrowser: React.FC<DocumentBrowserProps> = ({
  eventId,
  visible,
  onClose,
  initialDocument,
  onDocumentSelect
}) => {
  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<DocumentSearchResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (visible) {
      loadDocuments();
      loadStatistics();
    }
  }, [visible, eventId]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const docs = await documentProcessingService.getEventDocuments(eventId);
      setDocuments(docs);
    } catch (error) {
      Alert.alert('Error', 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const documentStats = await documentProcessingService.getDocumentStatistics(eventId);
      setStats(documentStats);
    } catch (error) {
    }
  };

  const handleSearch = async () => {
    if (!searchText.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const results = await documentProcessingService.searchDocuments(
        eventId,
        searchText,
        {
          includeContent: true,
          minRelevance: 1
        }
      );
      setSearchResults(results);
    } catch (error) {
      Alert.alert('Error', 'Failed to search documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentPress = (document: ProcessedDocument) => {
    if (onDocumentSelect) {
      onDocumentSelect(document);
    } else {
      openDocument(document);
    }
  };

  const openDocument = async (document: ProcessedDocument) => {
    try {
      const supported = await Linking.canOpenURL(document.url);
      if (supported) {
        await Linking.openURL(document.url);
      } else {
        Alert.alert('Error', 'Cannot open this document');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open document');
    }
  };

  const shareDocument = async (document: ProcessedDocument) => {
    try {
      await Share.share({
        message: `${document.title}\n\n${document.url}`,
        title: document.title,
        url: document.url,
      });
    } catch (error) {
    }
  };

  const getFilteredDocuments = () => {
    let filtered = documents;

    if (filterCategory !== 'all') {
      filtered = filtered.filter(doc => doc.category === filterCategory);
    }

    if (filterPriority !== 'all') {
      filtered = filtered.filter(doc => doc.priority === filterPriority);
    }

    return filtered;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#FF6B6B';
      case 'medium': return '#4ECDC4';
      case 'low': return '#95E1D3';
      default: return '#BDC3C7';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sailing_instructions': return 'compass-outline';
      case 'notice_of_race': return 'document-text-outline';
      case 'schedule': return 'time-outline';
      case 'amendment': return 'create-outline';
      case 'results': return 'trophy-outline';
      default: return 'document-outline';
    }
  };

  const renderStatistics = () => {
    if (!stats) return null;

    return (
      <View style={styles.statisticsContainer}>
        <Text style={styles.statisticsTitle}>Document Statistics</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Documents</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.withContent}</Text>
            <Text style={styles.statLabel}>Processed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.byPriority.high || 0}</Text>
            <Text style={styles.statLabel}>High Priority</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderDocumentItem = (doc: ProcessedDocument) => (
    <TouchableOpacity
      key={doc.id}
      style={styles.documentItem}
      onPress={() => handleDocumentPress(doc)}
    >
      <View style={styles.documentHeader}>
        <View style={styles.documentInfo}>
          <Ionicons 
            name={getTypeIcon(doc.type) as any} 
            size={24} 
            color="#666" 
            style={styles.documentIcon}
          />
          <View style={styles.documentText}>
            <Text style={styles.documentTitle} numberOfLines={2}>
              {doc.title}
            </Text>
            <Text style={styles.documentCategory}>
              {doc.category} • {doc.source.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Text>
            <Text style={styles.documentMeta}>
              {doc.fileType.toUpperCase()} • {new Date(doc.discoveredAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
        
        <View style={styles.documentActions}>
          <View 
            style={[
              styles.priorityBadge, 
              { backgroundColor: getPriorityColor(doc.priority) }
            ]}
          >
            <Text style={styles.priorityText}>
              {doc.priority.toUpperCase()}
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              shareDocument(doc);
            }}
            style={styles.shareButton}
          >
            <Ionicons name="share-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      {doc.contentProcessed && (
        <View style={styles.processedIndicator}>
          <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
          <Text style={styles.processedText}>Content processed</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderDocumentList = () => {
    const documentsToShow = showSearch ? searchResults.map(r => r.document) : getFilteredDocuments();

    if (documentsToShow.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="document-outline" size={64} color="#BDC3C7" />
          <Text style={styles.emptyStateText}>
            {showSearch ? 'No documents found for your search' : 'No documents available'}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.documentList} showsVerticalScrollIndicator={false}>
        {documentsToShow.map(renderDocumentItem)}
      </ScrollView>
    );
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Event Documents</Text>
          
          <TouchableOpacity 
            onPress={() => setShowSearch(!showSearch)} 
            style={styles.searchButton}
          >
            <Ionicons name="search" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        {showSearch && (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search documents..."
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity onPress={handleSearch} style={styles.searchButtonIcon}>
              <Ionicons name="search" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        )}

        {/* Statistics */}
        {!showSearch && renderStatistics()}

        {/* Filter Bar */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Filter:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.filterButton, filterCategory === 'all' && styles.activeFilter]}
              onPress={() => setFilterCategory('all')}
            >
              <Text style={[styles.filterText, filterCategory === 'all' && styles.activeFilterText]}>
                All
              </Text>
            </TouchableOpacity>
            
            {documentProcessingService.getAvailableCategories().map(category => (
              <TouchableOpacity
                key={category}
                style={[styles.filterButton, filterCategory === category && styles.activeFilter]}
                onPress={() => setFilterCategory(category)}
              >
                <Text style={[styles.filterText, filterCategory === category && styles.activeFilterText]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>
                {showSearch ? 'Searching documents...' : 'Loading documents...'}
              </Text>
            </View>
          ) : (
            renderDocumentList()
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  searchButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#F1F3F4',
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  searchButtonIcon: {
    marginLeft: 12,
    padding: 8,
  },
  statisticsContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  statisticsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingLeft: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginRight: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    backgroundColor: '#F1F3F4',
    borderRadius: 16,
  },
  activeFilter: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  documentList: {
    flex: 1,
  },
  documentItem: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  documentInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  documentIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  documentText: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  documentCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  documentMeta: {
    fontSize: 12,
    color: '#999',
  },
  documentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  shareButton: {
    padding: 4,
  },
  processedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingLeft: 36,
  },
  processedText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
});

export default DocumentBrowser;