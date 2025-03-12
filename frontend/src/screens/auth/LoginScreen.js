import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity,
  Dimensions,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();

  const validateForm = () => {
    let newErrors = {};
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    // Clear any previous errors
    setErrors({});
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const userData = await login({ email, password });
      
      // Navigate based on account type
      if (userData.accountType === 'creator') {
        navigation.replace('CreatorHome');
      } else {
        navigation.replace('ExplorerHome');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Something went wrong. Please try again.';
      
      // Show error message in a banner at the top
      setErrors({ 
        banner: errorMessage,
        showSignUp: errorMessage.includes('Sign up for an account')
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterPress = () => {
    navigation.navigate('AccountType');
  };

  const handleBack = () => {
    navigation.dispatch({
      type: 'RESET',
      payload: {
        routes: [{ name: 'Welcome' }],
        index: 0,
      },
      immediate: true
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#232526', '#414345', '#232526']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.background}
      >
        <TouchableOpacity 
          style={styles.backIcon}
          onPress={handleBack}
        >
          <Ionicons name="arrow-back" size={28} color="#ffffff" />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.title}>Welcome Back</Text>
          
          {errors.banner && (
            <View style={styles.errorBanner}>
              <View style={styles.errorBannerContent}>
                <Ionicons name="alert-circle" size={20} color="#FF6B6B" />
                <Text style={styles.errorBannerText}>{errors.banner}</Text>
              </View>
              {errors.showSignUp && (
                <TouchableOpacity 
                  style={styles.signUpButton}
                  onPress={handleRegisterPress}
                >
                  <Text style={styles.signUpButtonText}>Sign up</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, errors.banner && styles.inputError]}
                placeholder="Email"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setErrors({});
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrapper}>
              <View style={[styles.passwordContainer, errors.banner && styles.inputError]}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Password"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setErrors({});
                  }}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  style={styles.visibilityIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off" : "eye"} 
                    size={24} 
                    color="rgba(255,255,255,0.7)" 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Log in</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  backIcon: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 40,
  },
  inputContainer: {
    gap: 15,
    marginBottom: 30,
  },
  inputWrapper: {
    gap: 5,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 15,
    borderRadius: 10,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: 'rgba(255, 107, 107, 0.5)',
    borderWidth: 1,
  },
  errorBanner: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B6B',
  },
  errorBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorBannerText: {
    color: '#ffffff',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  signUpButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  signUpButtonText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '600',
  },
  passwordContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    color: '#ffffff',
    fontSize: 16,
  },
  visibilityIcon: {
    padding: 10,
    marginRight: 5,
  },
  buttonContainer: {
    gap: 15,
  },
  button: {
    backgroundColor: '#414345',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
}); 