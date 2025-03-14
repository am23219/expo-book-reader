import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';

interface BookItem {
  id: string;
  name: string;
  uri: string;
}

const HomeScreen = () => {
  const [books, setBooks] = useState<BookItem[]>([]);
  const navigation = useNavigation();

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      
      // Create a unique ID for the book
      const newBook: BookItem = {
        id: Date.now().toString(),
        name: file.name,
        uri: file.uri,
      };

      setBooks([...books, newBook]);
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
      console.error(error);
    }
  };

  const openPDF = (book: BookItem) => {
    navigation.navigate('PDFViewer' as never, { uri: book.uri, title: book.name } as never);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Arabic Book Reader</Text>
      
      <TouchableOpacity style={styles.button} onPress={pickDocument}>
        <Text style={styles.buttonText}>Add PDF Book</Text>
      </TouchableOpacity>
      
      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.bookItem}
            onPress={() => openPDF(item)}
          >
            <Text style={styles.bookTitle}>{item.name}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No books added yet. Tap "Add PDF Book" to get started.</Text>
        }
        style={styles.bookList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#4a6da7',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bookList: {
    flex: 1,
  },
  bookItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4a6da7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  bookTitle: {
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 30,
  },
});

export default HomeScreen; 