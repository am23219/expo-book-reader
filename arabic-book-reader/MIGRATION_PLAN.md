# Migration Plan for Arabic Book Reader

This document outlines the steps to migrate the existing codebase to the new structure.

## Migration Steps

### 1. Set Up Directory Structure (Completed)
- Created the new directory structure in `src/`
- Set up path aliases in `tsconfig.json` and `babel.config.js`
- Created base files for types, constants, utils, and hooks

### 2. Move Common Types
- Move all type definitions to `src/types/index.ts`
- Update imports in existing files

### 3. Move Constants
- Move theme constants to `src/constants/theme.ts`
- Move other constants to `src/constants/index.ts`
- Update imports in existing files

### 4. Move Utility Functions
- Move utility functions to `src/utils/index.ts`
- Update imports in existing files

### 5. Move Hooks
- Move custom hooks to `src/hooks/`
- Create an index file for easier imports
- Update imports in existing files

### 6. Reorganize Components
- Move UI components to `src/components/ui/`
- Move layout components to `src/components/layout/`
- Create index files for easier imports
- Update imports in existing files

### 7. Organize by Feature
- Create feature directories in `src/features/`
- Move feature-specific components, hooks, and utils to their respective feature directories
- Create index files for each feature
- Update imports in existing files

### 8. Update Pages
- Move page components to `src/pages/`
- Update imports in existing files

### 9. Update App Entry Point
- Update `App.tsx` to use the new imports
- Test the application to ensure everything works

### 10. Clean Up
- Remove old directories and files
- Update documentation

## Migration Checklist

- [ ] Move common types
- [ ] Move constants
- [ ] Move utility functions
- [ ] Move hooks
- [ ] Reorganize components
- [ ] Organize by feature
- [ ] Update pages
- [ ] Update App entry point
- [ ] Clean up old files
- [ ] Update documentation

## Best Practices During Migration

1. **One Feature at a Time**: Migrate one feature at a time to minimize disruption
2. **Test Frequently**: Test the application after each significant change
3. **Update Imports**: Be diligent about updating import paths
4. **Use Path Aliases**: Use the new path aliases for cleaner imports
5. **Maintain Type Safety**: Ensure TypeScript types are properly maintained
6. **Document Changes**: Update documentation as you go 