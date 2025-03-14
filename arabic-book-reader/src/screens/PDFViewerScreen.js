import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';

const PDFViewerScreen = ({ route }) => {
  const { uri, title } = route.params;

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri }}
        style={styles.webview}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  webview: {
    flex: 1,
  }
});

export default PDFViewerScreen; 