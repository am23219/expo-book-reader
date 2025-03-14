import React, { useState } from 'react';
import { StyleSheet, View, Dimensions, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute } from '@react-navigation/native';

const PDFViewerScreen = () => {
  const route = useRoute();
  const { uri, title } = route.params as { uri: string; title: string };
  const [loading, setLoading] = useState(true);

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a6da7" />
        </View>
      )}
      
      <WebView
        source={{ uri }}
        style={styles.webview}
        onLoadEnd={() => setLoading(false)}
        onError={() => setLoading(false)}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  webview: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});

export default PDFViewerScreen; 