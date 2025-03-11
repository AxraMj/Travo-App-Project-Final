export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    const status = error.response.status;
    const message = error.response.data?.message;

    switch (status) {
      case 400:
        return message || 'Invalid request. Please check your input.';
      case 401:
        return message || 'Authentication failed. Please login again.';
      case 403:
        return message || 'You do not have permission to perform this action.';
      case 404:
        return message || 'Resource not found.';
      case 409:
        return message || 'This resource already exists.';
      case 422:
        return message || 'Validation failed. Please check your input.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return message || 'An unexpected error occurred.';
    }
  } else if (error.request) {
    // Request made but no response
    return 'Network error. Please check your internet connection.';
  } else {
    // Something else happened
    return error.message || 'An unexpected error occurred.';
  }
};

export const showErrorAlert = (title, error) => {
  Alert.alert(
    title,
    handleApiError(error),
    [{ text: 'OK', style: 'default' }]
  );
};

// Add more specific error handlers
export const handleNetworkError = async (error, retry) => {
  if (!navigator.onLine) {
    Alert.alert(
      'No Internet Connection',
      'Please check your connection and try again',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Retry', onPress: retry }
      ]
    );
  }
}; 