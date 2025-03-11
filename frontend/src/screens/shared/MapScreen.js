import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Alert,
  Image,
  Animated,
  PanResponder
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../context/AuthContext';
import { postsAPI, guidesAPI } from '../../services/api';

const { width, height } = Dimensions.get('window');
const BOTTOM_SHEET_MAX_HEIGHT = height * 0.6;
const BOTTOM_SHEET_MIN_HEIGHT = 120;
const BOTTOM_SHEET_INITIAL_HEIGHT = height * 0.25;

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

export default function MapScreen({ navigation, route }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [guides, setGuides] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [filteredGuides, setFilteredGuides] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationPosts, setLocationPosts] = useState([]);
  const [locationGuides, setLocationGuides] = useState([]);
  const [selectedItemType, setSelectedItemType] = useState(null); // 'post' or 'guide'
  const mapRef = useRef(null);
  const [region, setRegion] = useState({
    latitude: 20,
    longitude: 0,
    latitudeDelta: 100,
    longitudeDelta: 100,
  });
  
  // Bottom sheet animation
  const bottomSheetAnimation = useRef(new Animated.Value(0.5)).current;
  const [bottomSheetExpanded, setBottomSheetExpanded] = useState(false);
  const lastGestureDy = useRef(0);
  
  // Create pan responder for bottom sheet drag gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Store the current position when touch starts
        lastGestureDy.current = bottomSheetAnimation.__getValue();
        bottomSheetAnimation.setOffset(lastGestureDy.current);
        bottomSheetAnimation.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        // Calculate new position based on drag
        const newValue = -gestureState.dy / (BOTTOM_SHEET_MAX_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT);
        // Clamp the value between 0 and 1
        const clampedValue = Math.min(Math.max(0, newValue + lastGestureDy.current), 1);
        bottomSheetAnimation.setValue(clampedValue - lastGestureDy.current);
      },
      onPanResponderRelease: (_, gestureState) => {
        // Reset offset
        bottomSheetAnimation.flattenOffset();
        
        // Get the current position
        const currentValue = bottomSheetAnimation.__getValue();
        
        // Determine which position to snap to based on velocity and position
        if (gestureState.vy > 0.5) {
          // Fast downward swipe - collapse
          snapToPosition(0.5);
          setBottomSheetExpanded(false);
        } else if (gestureState.vy < -0.5) {
          // Fast upward swipe - expand
          snapToPosition(1);
          setBottomSheetExpanded(true);
        } else if (currentValue > 0.75) {
          // Above 75% - expand
          snapToPosition(1);
          setBottomSheetExpanded(true);
        } else if (currentValue < 0.25) {
          // Below 25% - collapse to minimum
          snapToPosition(0);
          setBottomSheetExpanded(false);
        } else {
          // Between 25% and 75% - go to initial position
          snapToPosition(0.5);
          setBottomSheetExpanded(false);
        }
      }
    })
  ).current;

  useEffect(() => {
    Promise.all([fetchPosts(), fetchGuides()])
      .then(() => setLoading(false))
      .catch((error) => {
        console.error('Error loading data:', error);
        setLoading(false);
      });
  }, []);

  // Handle navigation params if coming from a post or guide
  useEffect(() => {
    if (route.params?.selectedLocation) {
      const { selectedLocation, initialPost, initialGuide } = route.params;
      
      // Set the selected location
      setSelectedLocation(selectedLocation);
      
      // If we have coordinates, move the map to that location
      if (selectedLocation.coordinates?.latitude && selectedLocation.coordinates?.longitude) {
        const newRegion = {
          latitude: selectedLocation.coordinates.latitude,
          longitude: selectedLocation.coordinates.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        
        // Update region state
        setRegion(newRegion);
        
        // Animate map to the location
        setTimeout(() => {
          mapRef.current?.animateToRegion(newRegion, 1000);
        }, 500);
      }
      
      // If we have an initial post, show it in the bottom sheet
      if (initialPost) {
        setLocationPosts([initialPost]);
        snapToPosition(1);
        setBottomSheetExpanded(true);
      } 
      // If we have an initial guide, show related posts
      else if (initialGuide) {
        // Find posts with the same location name
        fetchGuides().then(() => {
          const postsWithSameLocation = posts.filter(post => 
            post.location?.name?.toLowerCase() === selectedLocation.name.toLowerCase()
          );
          
          if (postsWithSameLocation.length > 0) {
            setLocationPosts(postsWithSameLocation);
          } else {
            // If no posts found, show a message
            setLocationPosts([]);
          }
          
          snapToPosition(1);
          setBottomSheetExpanded(true);
        });
      }
    }
  }, [route.params, posts]);

  // Set initial posts for bottom sheet when posts are loaded
  useEffect(() => {
    if (posts.length > 0 && !selectedLocation) {
      setLocationPosts(posts.slice(0, 10)); // Show first 10 posts initially
    }
  }, [posts]);

  const snapToPosition = (position) => {
    Animated.spring(bottomSheetAnimation, {
      toValue: position,
      useNativeDriver: false,
      bounciness: 4,
      speed: 12
    }).start();
  };

  const fetchPosts = async () => {
    try {
      const response = await postsAPI.getAllPosts();
      // Filter posts that have valid location data
      const postsWithLocation = response.filter(post =>
        post.location?.coordinates?.latitude &&
        post.location?.coordinates?.longitude
      );
      setPosts(postsWithLocation);
      setFilteredPosts(postsWithLocation);
      return postsWithLocation; // Return posts for use in navigation params handler
    } catch (error) {
      console.error('Error fetching posts for map:', error);
      Alert.alert(
        'Error',
        'Failed to load posts. Please try again.',
        [{ text: 'OK' }]
      );
      return [];
    }
  };

  const fetchGuides = async () => {
    try {
      const response = await guidesAPI.getAllGuides();
      // Filter guides that have valid location data
      const guidesWithLocation = response.filter(guide =>
        guide.location && guide.coordinates?.latitude && guide.coordinates?.longitude
      );
      setGuides(guidesWithLocation);
      setFilteredGuides(guidesWithLocation);
      return guidesWithLocation;
    } catch (error) {
      console.error('Error fetching guides for map:', error);
      Alert.alert(
        'Error',
        'Failed to load guides. Please try again.'
      );
      return [];
    }
  };

  // Use goBack() to return to the previous screen
  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleSearch = () => {
    if (searchQuery.trim() === '') {
      setFilteredPosts(posts);
      setFilteredGuides(guides);
      return;
    }
    
    setIsSearching(true);
    try {
      // Filter posts and guides based on location name
      const searchResults = posts.filter(post => 
        post.location?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      const guideResults = guides.filter(guide => 
        guide.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      setFilteredPosts(searchResults);
      setFilteredGuides(guideResults);
      
      // If we have results, move the map to the first result
      if (searchResults.length > 0) {
        const firstResult = searchResults[0];
        mapRef.current?.animateToRegion({
          latitude: firstResult.location.coordinates.latitude,
          longitude: firstResult.location.coordinates.longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }, 1000);
      } else if (guideResults.length > 0) {
        const firstGuide = guideResults[0];
        mapRef.current?.animateToRegion({
          latitude: firstGuide.coordinates.latitude,
          longitude: firstGuide.coordinates.longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }, 1000);
      }
      
      // Close the search modal if we have results
      if (searchResults.length > 0 || guideResults.length > 0) {
        setIsSearchVisible(false);
      } else {
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

  const handleMarkerPress = (item, type) => {
    setSelectedItemType(type);
    
    if (type === 'post') {
      // Find all posts and guides with the same location name
      const postsAtLocation = posts.filter(p => 
        p.location?.name === item.location?.name
      );
      const guidesAtLocation = guides.filter(g => 
        g.location?.toLowerCase() === item.location?.name?.toLowerCase()
      );
      
      setSelectedLocation(item.location);
      setLocationPosts(postsAtLocation);
      setLocationGuides(guidesAtLocation);
    } else {
      // For guides, find posts at the same location
      const postsAtLocation = posts.filter(p => 
        p.location?.name?.toLowerCase() === item.location?.toLowerCase()
      );
      const guidesAtLocation = guides.filter(g => 
        g.location?.toLowerCase() === item.location?.toLowerCase()
      );
      
      setSelectedLocation({
        name: item.location,
        coordinates: item.coordinates
      });
      setLocationPosts(postsAtLocation);
      setLocationGuides(guidesAtLocation);
    }
    
    // Expand the bottom sheet
    snapToPosition(1);
    setBottomSheetExpanded(true);
  };

  const expandBottomSheet = useCallback(() => {
    setBottomSheetExpanded(true);
    snapToPosition(1);
  }, []);

  const collapseBottomSheet = useCallback(() => {
    setBottomSheetExpanded(false);
    snapToPosition(0.5);
    
    // Reset to show all posts if a location was selected
    if (selectedLocation) {
      setSelectedLocation(null);
      setLocationPosts(posts.slice(0, 10));
    }
  }, [posts, selectedLocation]);

  const toggleBottomSheet = useCallback(() => {
    if (bottomSheetExpanded) {
      collapseBottomSheet();
    } else {
      expandBottomSheet();
    }
  }, [bottomSheetExpanded, collapseBottomSheet, expandBottomSheet]);

  const bottomSheetHeight = bottomSheetAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, BOTTOM_SHEET_INITIAL_HEIGHT, BOTTOM_SHEET_MAX_HEIGHT],
  });

  // Calculate additional styles based on animation value
  const indicatorRotation = bottomSheetAnimation.interpolate({
    inputRange: [0.5, 1],
    outputRange: ['0deg', '180deg'],
    extrapolate: 'clamp',
  });

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

  const renderLocationPost = ({ item }) => (
    <TouchableOpacity 
      style={styles.locationPostItem}
      onPress={() => navigation.navigate('UserProfile', { userId: item.userId._id })}
    >
      {item.images && item.images.length > 0 && (
        <Image 
          source={{ uri: item.images[0] }} 
          style={styles.postImage}
          resizeMode="cover"
        />
      )}
      <View style={styles.postContent}>
        <Text style={styles.postTitle} numberOfLines={1}>
          {item.title || 'Travel Post'}
        </Text>
        <Text style={styles.postDescription} numberOfLines={2}>
          {item.description || 'No description available'}
        </Text>
        <View style={styles.postFooter}>
          <View style={styles.userInfo}>
            {item.userId.profileImage ? (
              <Image 
                source={{ uri: item.userId.profileImage }} 
                style={styles.userAvatar}
              />
            ) : (
              <View style={[styles.userAvatar, styles.defaultAvatar]}>
                <Text style={styles.avatarText}>
                  {item.userId.username ? item.userId.username.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            )}
            <Text style={styles.username}>{item.userId.username || 'Unknown'}</Text>
          </View>
          <View style={styles.postStats}>
            <Ionicons name="heart" size={16} color="#ff4757" />
            <Text style={styles.statsText}>{item.likes?.length || 0}</Text>
            <Ionicons name="chatbubble" size={16} color="#4a90e2" style={styles.commentIcon} />
            <Text style={styles.statsText}>{item.comments?.length || 0}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderGuideItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.guideItem}
      onPress={() => navigation.navigate('UserProfile', { userId: item.userId })}
    >
      <View style={styles.guideContent}>
        <View style={styles.guideHeader}>
          <View style={styles.guideUserInfo}>
            {item.user?.profileImage ? (
              <Image 
                source={{ uri: item.user.profileImage }} 
                style={styles.guideUserAvatar}
              />
            ) : (
              <View style={[styles.guideUserAvatar, styles.defaultAvatar]}>
                <Text style={styles.avatarText}>
                  {item.user?.username ? item.user.username.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            )}
            <Text style={styles.guideUsername}>{item.user?.username || 'Unknown'}</Text>
          </View>
          <View style={styles.guideStats}>
            <Ionicons name="thumbs-up" size={16} color="#4a90e2" />
            <Text style={styles.guideStatsText}>{item.likes || 0}</Text>
          </View>
        </View>
        
        <View style={styles.guideDetails}>
          <Text style={styles.guideLocationNote}>{item.locationNote || 'No additional notes'}</Text>
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
          {/* Post Markers */}
          {filteredPosts.map((post) => (
            <Marker
              key={`post-${post._id}`}
              coordinate={{
                latitude: post.location.coordinates.latitude,
                longitude: post.location.coordinates.longitude
              }}
              title={post.location.name}
              description={`Posted by ${post.userId.username || 'Unknown'}`}
              pinColor="#4a90e2"
              onPress={() => handleMarkerPress(post, 'post')}
            />
          ))}

          {/* Guide Markers */}
          {filteredGuides.map((guide) => (
            <Marker
              key={`guide-${guide._id}`}
              coordinate={{
                latitude: guide.coordinates.latitude,
                longitude: guide.coordinates.longitude
              }}
              title={guide.location}
              description={`Guide by ${guide.username || 'Unknown'}`}
              pinColor="#FF6B6B"
              onPress={() => handleMarkerPress(guide, 'guide')}
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

        {/* Bottom Sheet for Location Posts */}
        <Animated.View 
          style={[styles.bottomSheet, { height: bottomSheetHeight }]}
        >
          <LinearGradient
            colors={['#232526', '#414345']}
            style={styles.bottomSheetContent}
          >
            <View 
              {...panResponder.panHandlers}
              style={styles.dragHandle}
            >
              <View style={styles.bottomSheetHeader}>
                <View style={styles.bottomSheetHandle} />
                <Animated.View style={{ transform: [{ rotate: indicatorRotation }] }}>
                  <Ionicons name="chevron-up" size={24} color="#ffffff" />
                </Animated.View>
              </View>
            </View>
            
            <View style={styles.locationHeader}>
              <Ionicons 
                name={selectedItemType === 'guide' ? "compass" : "location"} 
                size={24} 
                color={selectedItemType === 'guide' ? "#FF6B6B" : "#4a90e2"} 
              />
              <Text style={styles.locationName}>
                {selectedLocation ? selectedLocation.name : 'Explore Travel Posts'}
              </Text>
            </View>
            
            {/* Guides Section */}
            {locationGuides.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Travel Guides</Text>
                  <Text style={styles.sectionCount}>{locationGuides.length}</Text>
                </View>
                <FlatList
                  data={locationGuides}
                  renderItem={renderGuideItem}
                  keyExtractor={(item) => `guide-${item._id}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.guidesContainer}
                />
              </>
            )}

            {/* Posts Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Posts</Text>
              <Text style={styles.sectionCount}>{locationPosts.length}</Text>
            </View>
            
            <FlatList
              data={locationPosts}
              renderItem={renderLocationPost}
              keyExtractor={(item) => `post-${item._id}`}
              contentContainerStyle={styles.locationPostsList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyLocationPosts}>
                  <Ionicons name="images-outline" size={50} color="#666" />
                  <Text style={styles.emptyLocationText}>No posts at this location</Text>
                </View>
              }
            />
          </LinearGradient>
        </Animated.View>

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
    bottom: BOTTOM_SHEET_INITIAL_HEIGHT + 10,
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
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
    zIndex: 100,
  },
  bottomSheetContent: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
  },
  dragHandle: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 10,
  },
  bottomSheetHeader: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    width: '100%',
  },
  bottomSheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    marginBottom: 10,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 5,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 10,
  },
  locationName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
    flex: 1,
  },
  postsTitle: {
    color: '#999',
    fontSize: 14,
    marginBottom: 15,
  },
  locationPostsList: {
    paddingBottom: 20,
  },
  locationPostItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#333',
  },
  postContent: {
    padding: 15,
  },
  postTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  postDescription: {
    color: '#cccccc',
    fontSize: 14,
    marginBottom: 10,
    lineHeight: 20,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  defaultAvatar: {
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  username: {
    color: '#ffffff',
    fontSize: 13,
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    color: '#cccccc',
    fontSize: 12,
    marginLeft: 3,
    marginRight: 8,
  },
  commentIcon: {
    marginLeft: 8,
  },
  emptyLocationPosts: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 30,
    paddingBottom: 30,
  },
  emptyLocationText: {
    color: '#999',
    textAlign: 'center',
    marginTop: 15,
    fontSize: 16,
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
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 15,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  sectionCount: {
    color: '#999',
    fontSize: 16,
    fontWeight: '500',
  },
  guidesContainer: {
    paddingBottom: 15,
  },
  guideItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 15,
    marginRight: 12,
    width: 280,
  },
  guideContent: {
    gap: 10,
  },
  guideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  guideUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  guideUserAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  guideUsername: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  guideStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  guideStatsText: {
    color: '#cccccc',
    fontSize: 14,
  },
  guideDetails: {
    marginTop: 5,
  },
  guideLocationNote: {
    color: '#cccccc',
    fontSize: 14,
    lineHeight: 20,
  },
});