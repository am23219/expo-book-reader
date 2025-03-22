# Storage Architecture

This document explains the storage architecture for the Barakaat Makkiyyah app, particularly focusing on how state persistence works.

## Overview

The app uses a dedicated storage service to centralize all persistence logic. This service handles saving and loading of app state, including:

- Current page position
- Section completion status
- Reading streak data
- Last viewed pages for each section
- Book metadata

## Key Components

### 1. StorageService (utils/storageService.ts)

This is the central service responsible for all persistence operations. It provides:

- Structured access to AsyncStorage with consistent error handling
- Type safety for stored data
- Validation of stored values to prevent corruption
- Advanced debugging capabilities

### 2. Hooks that use StorageService

- `useSectionNavigation` - Handles section and page navigation and persistence
- `useReadingStreak` - Manages reading streak and history
- `useKhatmCompletion` - Tracks khatm completion and persistence

## Persistence Strategy

### State Restoration Logic

The app uses a multi-layered approach to ensure reliable state restoration:

1. When the app opens, it first tries to load the user's last viewed page
2. It validates this page is within the valid range of a section
3. For each section, it stores a dedicated "last viewed page" to ensure returning to the exact same place
4. When switching between sections, it remembers the last page viewed in each section

### Corruption Prevention

The storage service includes several safeguards:

- Value validation before saving (e.g., page numbers within valid ranges)
- Consistency checking when loading data
- Fallback to default values if corruption is detected
- Detection of unusual section jumps (e.g., from Manzil 2 to Manzil 7)

## Troubleshooting Common Issues

### App Forgets Position After Closing

If the app doesn't remember your position after a complete close (swipe up):

1. Check if any iOS background processes are killing the app
2. The app might be experiencing corruption in the saved page data
3. Try resetting the app data in the settings menu

### Random Jumps to End of Book

This could be due to:

1. Corruption in the saved page data
2. The app detects an invalid page number and defaults to page 1, but section detection logic fails
3. Memory issues when iOS terminates the app in the background

## Migration from Old Storage

The `storageService` provides backward compatibility with the old storage methods through exported constants:

```typescript
// For backward compatibility
export const {
  loadSections,
  saveSections,
  loadCurrentPage,
  saveCurrentPage,
  loadLastViewedPages,
  saveLastViewedPage,
  getLastViewedPage,
  clearAllData,
  saveReaderProgress,
  getReaderProgress,
  cacheBookData,
  getCachedBookData
} = storageService;
```

These allow for a gradual migration of existing code to the new storage service. 