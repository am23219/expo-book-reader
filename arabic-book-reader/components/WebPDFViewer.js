import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

const WebPDFViewer = ({ source }) => {
  // Extract the URI from the source object
  const uri = source?.uri || '';
  
  return (
    <View style={styles.container}>
      <WebView
        source={{ uri }}
        style={styles.pdf}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pdf: {
    flex: 1,
  },
});

export default WebPDFViewer; 