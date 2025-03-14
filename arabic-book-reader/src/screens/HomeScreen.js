import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HomeScreen = ({ navigation }) => {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      const storedBooks = await AsyncStorage.getItem('books');
      if (storedBooks) {
        setBooks(JSON.parse(storedBooks));
      }
    } catch (error) {
      console.error('Error loading books:', error);
      Alert.alert('Error', 'Failed to load books');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true
      });
      
      if (result.canceled) {
        return;
      }
      
      const { uri, name } = result.assets[0];
      
      // Create a unique ID for the book
      const id = Date.now().toString();
      
      // Save the file to app's documents directory
      const newUri = FileSystem.documentDirectory + id + '.pdf';
      await FileSystem.copyAsync({
        from: uri,
        to: newUri
      });
      
      // Add the book to the list
      const newBook = { id, title: name, uri: newUri };
      const updatedBooks = [...books, newBook];
      setBooks(updatedBooks);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('books', JSON.stringify(updatedBooks));
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to import PDF');
    }
  };

  const openBook = (book) => {
    navigation.navigate('PDFViewer', { uri: book.uri, title: book.title });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.bookItem} 
      onPress={() => openBook(item)}
    >
      <Text style={styles.bookTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {books.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No books added yet</Text>
        </View>
      ) : (
        <FlatList
          data={books}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
      <TouchableOpacity style={styles.addButton} onPress={pickDocument}>
        <Text style={styles.addButtonText}>Add PDF</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
  },
  listContainer: {
    padding: 16,
  },
  bookItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    margin: 16,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default HomeScreen; 