import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TextInput, Button, KeyboardAvoidingView, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

export default function App() {
  const [pdfUrl, setPdfUrl] = useState('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
  const [inputUrl, setInputUrl] = useState('');

  // HTML to display PDF in WebView
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body, html {
          margin: 0;
          padding: 0;
          height: 100%;
          overflow: hidden;
        }
        iframe {
          width: 100%;
          height: 100%;
          border: none;
        }
      </style>
    </head>
    <body>
      <iframe src="${pdfUrl}"></iframe>
    </body>
    </html>
  `;
  
  const loadPdf = () => {
    if (inputUrl) {
      setPdfUrl(inputUrl);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.header}>Arabic Book Reader</Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputUrl}
            onChangeText={setInputUrl}
            placeholder="Enter PDF URL"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Button title="Load PDF" onPress={loadPdf} />
        </View>
        
        <View style={styles.pdfContainer}>
          <WebView
            originWhitelist={['*']}
            source={{ html: htmlContent }}
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            onError={(error) => console.log('WebView error:', error)}
          />
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F5EB',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    marginHorizontal: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 8,
    marginRight: 10,
  },
  pdfContainer: {
    flex: 1,
    marginHorizontal: 10,
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  webview: {
    flex: 1,
  },
}); 