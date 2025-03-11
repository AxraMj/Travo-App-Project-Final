import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Text,
  Keyboard,
  Alert
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../context/AuthContext';
import { postsAPI } from '../../services/api';

const { width, height } = Dimensions.get('window');

// Dark map style to match app theme
const darkMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#212121"
      }
    ]
  },
  {
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#212121"
      }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "administrative.country",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#bdbdbd"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#181818"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#1b1b1b"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#2c2c2c"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#8a8a8a"
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#373737"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#3c3c3c"
      }
    ]
  },
  {
    "featureType": "road.highway.controlled_access",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#4e4e4e"
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#000000"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#3d3d3d"
      }
    ]
  }
];

export default function MapScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const mapRef = useRef(null);
  const [region, setRegion] = useState({
    latitude: 20,
    longitude: 0,
    latitudeDelta: 100,
    longitudeDelta: 100,
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await postsAPI.getAllPosts();
      // Filter posts that have valid location data
      const postsWithLocation = response.filter(post =>
        post.location?.coordinates?.latitude &&
        post.location?.coordinates?.longitude
      );
      setPosts(postsWithLocation);
      setFilteredPosts(postsWithLocation);
    } catch (error) {
      console.error('Error fetching posts for map:', error);
      Alert.alert(
        'Error',
        'Failed to load posts. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Use goBack() to return to the previous screen
  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleSearch = () => {
    if (searchQuery.trim() === '') {
      setFilteredPosts(posts);
      return;
    }
    
    setIsSearching(true);
    try {
      // Filter posts directly based on location name
      const searchResults = posts.filter(post => 
        post.location?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      setFilteredPosts(searchResults.length > 0 ? searchResults : []);
      
      // If we have results, move the map to the first result
      if (searchResults.length > 0) {
        const firstResult = searchResults[0];
        mapRef.current?.animateToRegion({
          latitude: firstResult.location.coordinates.latitude,
          longitude: firstResult.location.coordinates.longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }, 1000);
      }
      
      // Close the search modal if we have results
      if (searchResults.length > 0) {
        setIsSearchVisible(false);
      } else {
        // Show a message if no results found
        Alert.alert(
          'No Results',
          `No locations found matching "${searchQuery}"`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error searching locations:', error);
      Alert.alert(
        'Search Error',
        'Failed to search locations. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSearching(false);
      Keyboard.dismiss();
    }
  };

  const handleLocationSelect = (post) => {
    // Filter to show only this post
    setFilteredPosts([post]);
    
    // Move the map to the selected location
    mapRef.current?.animateToRegion({
      latitude: post.location.coordinates.latitude,
      longitude: post.location.coordinates.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    }, 1000);
    
    setIsSearchVisible(false);
    Keyboard.dismiss();
  };

  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible);
    if (!isSearchVisible) {
      setSearchQuery('');
    } else {
      // Reset to show all posts when closing search
      setFilteredPosts(posts);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setFilteredPosts(posts);
  };

  const renderSearchItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.searchResultItem}
      onPress={() => handleLocationSelect(item)}
    >
      <View style={styles.searchResultContent}>
        <Ionicons name="location" size={20} color="#4a90e2" />
        <View style={styles.searchResultTextContainer}>
          <Text style={styles.searchResultText}>{item.location.name}</Text>
          <Text style={styles.searchResultSubtext}>
            Posted by {item.userId.username || 'Unknown'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  // Filter posts based on search query for the search modal
  const searchResults = searchQuery.trim() === '' 
    ? posts 
    : posts.filter(post => 
        post.location?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#232526', '#414345']}
        style={styles.container}
      >
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={region}
          onRegionChangeComplete={setRegion}
          customMapStyle={darkMapStyle}
        >
          {filteredPosts.map((post) => (
            <Marker
              key={post._id}
              coordinate={{
                latitude: post.location.coordinates.latitude,
                longitude: post.location.coordinates.longitude
              }}
              title={post.location.name}
              description={`Posted by ${post.userId.username || 'Unknown'}`}
              pinColor="#4a90e2"
              onPress={() => navigation.navigate('UserProfile', { userId: post.userId._id })}
            />
          ))}
        </MapView>

        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <View style={styles.backButtonCircle}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </View>
        </TouchableOpacity>

        {/* Search Button */}
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={toggleSearch}
        >
          <View style={styles.backButtonCircle}>
            <Ionicons name="search" size={24} color="#ffffff" />
          </View>
        </TouchableOpacity>

        {/* Reset Filter Button - Only show when filtered */}
        {filteredPosts.length !== posts.length && (
          <TouchableOpacity 
            style={styles.resetButton}
            onPress={() => setFilteredPosts(posts)}
          >
            <View style={styles.resetButtonContainer}>
              <Ionicons name="refresh" size={18} color="#ffffff" />
              <Text style={styles.resetButtonText}>Show All</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Search Modal */}
        <Modal
          visible={isSearchVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsSearchVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.searchContainer}>
              <View style={styles.searchHeader}>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setIsSearchVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.searchTitle}>Find Locations</Text>
                <View style={{ width: 24 }} />
              </View>
              
              <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search for a location..."
                  placeholderTextColor="#999"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                  autoFocus={true}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={clearSearch}>
                    <Ionicons name="close-circle" size={20} color="#999" />
                  </TouchableOpacity>
                )}
              </View>
              
              <TouchableOpacity 
                style={styles.searchButton2}
                onPress={handleSearch}
                disabled={searchQuery.trim() === ''}
              >
                <Text style={styles.searchButtonText}>Search</Text>
              </TouchableOpacity>
              
              {isSearching ? (
                <ActivityIndicator size="large" color="#ffffff" style={styles.searchLoading} />
              ) : (
                <FlatList
                  data={searchResults}
                  renderItem={renderSearchItem}
                  keyExtractor={(item) => item._id}
                  style={styles.searchResults}
                  ListEmptyComponent={
                    searchQuery.length > 0 ? (
                      <View style={styles.emptyResultContainer}>
                        <Ionicons name="search-outline" size={50} color="#666" />
                        <Text style={styles.emptyResultText}>No locations found</Text>
                        <Text style={styles.emptyResultSubtext}>Try a different search term</Text>
                      </View>
                    ) : (
                      <View style={styles.initialSearchState}>
                        <Ionicons name="location-outline" size={50} color="#666" />
                        <Text style={styles.initialSearchText}>Search for a location</Text>
                        <Text style={styles.initialSearchSubtext}>Find posts by location name</Text>
                      </View>
                    )
                  }
                />
              )}
            </View>
          </View>
        </Modal>
      </LinearGradient>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#232526',
  },
  map: {
    width: width,
    height: height,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  searchButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  resetButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    zIndex: 10,
  },
  resetButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  resetButtonText: {
    color: '#ffffff',
    marginLeft: 5,
    fontWeight: '600',
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  searchContainer: {
    backgroundColor: '#232526',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    height: height * 0.7,
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    padding: 5,
  },
  searchTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    color: '#ffffff',
    fontSize: 16,
  },
  searchButton2: {
    backgroundColor: '#4a90e2',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  searchButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  searchResults: {
    flex: 1,
  },
  searchResultItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchResultContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchResultTextContainer: {
    marginLeft: 10,
  },
  searchResultText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  searchResultSubtext: {
    color: '#999',
    fontSize: 14,
    marginTop: 2,
  },
  searchLoading: {
    marginTop: 20,
  },
  emptyResultContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
  },
  emptyResultText: {
    color: '#999',
    textAlign: 'center',
    marginTop: 15,
    fontSize: 18,
    fontWeight: '500',
  },
  emptyResultSubtext: {
    color: '#777',
    textAlign: 'center',
    marginTop: 5,
    fontSize: 14,
  },
  initialSearchState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
  },
  initialSearchText: {
    color: '#999',
    textAlign: 'center',
    marginTop: 15,
    fontSize: 18,
    fontWeight: '500',
  },
  initialSearchSubtext: {
    color: '#777',
    textAlign: 'center',
    marginTop: 5,
    fontSize: 14,
  }
});