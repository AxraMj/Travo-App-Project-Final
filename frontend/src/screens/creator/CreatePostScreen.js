import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useAuth } from '../../context/AuthContext';
import { postsAPI } from '../../services/api/';
import { showErrorAlert } from '../../utils/errorHandler';

export default function CreatePostScreen({ navigation }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [description, setDescription] = useState('');
  const [travelTips, setTravelTips] = useState(['']);

  // Pick image from library
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        // Create the data URL from base64
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setImage(base64Image);
      }
    } catch (error) {
      console.error('Image picking error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Get current location
  const getCurrentLocation = async () => {
    setIsLocationLoading(true);
    try {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied');
        setIsLocationLoading(false);
        return;
      }

      // Get location
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Reverse geocode to get address
      const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
      
      // Get weather data
      const weatherData = await fetchWeatherData(latitude, longitude);

      // Update state
      setCurrentLocation({ latitude, longitude });
      setLocationName(`${address.city || address.region}, ${address.country}`);
      setWeatherData(weatherData);
    } catch (error) {
      console.log('Location error:', error);
      Alert.alert('Location Error', 'Could not fetch location data');
    } finally {
      setIsLocationLoading(false);
    }
  };

  // Mock function to fetch weather data
  const fetchWeatherData = async (lat, lon) => {
    // In a real app, you would fetch this from a weather API
    // This is a placeholder
    return {
      temp: 28,
      description: 'Sunny',
      icon: 'partly-sunny'
    };
  };

  // Add travel tip
  const addTravelTip = () => {
    setTravelTips(prev => [...prev, '']);
  };

  // Update travel tip
  const updateTravelTip = (index, value) => {
    const updatedTips = [...travelTips];
    updatedTips[index] = value;
    setTravelTips(updatedTips);
  };

  // Remove travel tip
  const removeTravelTip = (index) => {
    if (travelTips.length === 1) {
      // Keep at least one tip field
      setTravelTips(['']);
    } else {
      const updatedTips = travelTips.filter((_, i) => i !== index);
      setTravelTips(updatedTips);
    }
  };

  // Submit post
  const handleSubmit = async () => {
    if (!image) {
      Alert.alert('Error', 'Please select an image');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Starting post creation...');

      const postData = {
        image: image,
        description: description.trim(),
        location: currentLocation ? {
          name: locationName || 'Unknown Location',
          coordinates: {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude
          }
        } : {
          name: 'Unknown Location',
          coordinates: {
            latitude: 0,
            longitude: 0
          }
        },
        weather: weatherData || {
          temp: 0,
          description: 'Unknown',
          icon: 'unknown'
        },
        travelTips: travelTips.filter(tip => tip.trim() !== '')
      };

      console.log('Submitting post with data:', {
        ...postData,
        image: postData.image ? 'Image present' : 'No image'
      });

      const response = await postsAPI.createPost(postData);
      console.log('Post created successfully:', response);

      // No need for an alert, just reset navigation directly
      navigation.reset({
        index: 1,
        routes: [
          { name: 'Home' }, // Reset to home screen first
          { 
            name: 'Profile', 
            params: { refresh: true } // Add refresh param to ensure profile data is updated
          }
        ],
      });
    } catch (error) {
      console.error('Post creation error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      Alert.alert(
        'Error',
        'Failed to create post. Please try again.',
        [
          {
            text: 'OK',
            // Don't navigate on error, just stay on the current screen
          }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#232526', '#414345']}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.headerButton}
          >
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Post</Text>
          <TouchableOpacity 
            style={[styles.headerButton, isLoading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.shareText}>Share</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Image Picker */}
          <TouchableOpacity 
            style={styles.imageContainer} 
            onPress={pickImage}
          >
            {image ? (
              <Image 
                source={{ uri: image }} 
                style={styles.selectedImage} 
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={40} color="#ffffff" />
                <Text style={styles.imagePlaceholderText}>Tap to add photo</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Location Picker */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.locationContainer}>
              <View style={styles.locationInput}>
                {locationName ? (
                  <Text style={styles.locationText}>{locationName}</Text>
                ) : (
                  <Text style={styles.locationPlaceholder}>Add location</Text>
                )}
              </View>
              <TouchableOpacity 
                style={styles.locationButton}
                onPress={getCurrentLocation}
                disabled={isLocationLoading}
              >
                {isLocationLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Ionicons name="location-outline" size={24} color="#FF6B6B" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Weather Info (shown if available) */}
          {weatherData && (
            <View style={styles.weatherContainer}>
              <Ionicons name="partly-sunny" size={24} color="#FFD93D" />
              <Text style={styles.weatherText}>
                {weatherData.temp}°C, {weatherData.description}
              </Text>
            </View>
          )}

          {/* Description */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Description</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Write a caption..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              multiline
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* Travel Tips */}
          <View style={styles.sectionContainer}>
            <View style={styles.tipsHeader}>
              <Text style={styles.sectionTitle}>Travel Tips</Text>
              <TouchableOpacity onPress={addTravelTip}>
                <Ionicons name="add-circle-outline" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            
            {travelTips.map((tip, index) => (
              <View key={index} style={styles.tipInputContainer}>
                <TextInput
                  style={styles.tipInput}
                  placeholder="Add a travel tip..."
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={tip}
                  onChangeText={(text) => updateTravelTip(index, text)}
                />
                <TouchableOpacity onPress={() => removeTravelTip(index)}>
                  <Ionicons name="close-circle-outline" size={24} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  shareText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  imageContainer: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 10,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
  },
  locationText: {
    color: '#ffffff',
    fontSize: 16,
  },
  locationPlaceholder: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
  },
  locationButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
  },
  weatherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  weatherText: {
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 10,
  },
  descriptionInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
    color: '#ffffff',
    fontSize: 16,
    height: 100,
    textAlignVertical: 'top',
  },
  tipsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tipInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tipInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
    color: '#ffffff',
    fontSize: 16,
    marginRight: 10,
  },
}); 