# Arabic Book Reader - Code Organization

This document outlines the code organization and best practices for the Arabic Book Reader application.

## Directory Structure

```
src/
├── assets/           # Static assets like images, fonts, etc.
├── components/       # Reusable UI components
│   ├── ui/           # Basic UI components (buttons, inputs, etc.)
│   ├── layout/       # Layout components (headers, footers, etc.)
│   └── index.ts      # Export all components
├── constants/        # Application constants
│   ├── theme.ts      # Theme constants (colors, fonts, etc.)
│   └── index.ts      # Export all constants
├── features/         # Feature-based modules
│   ├── bookReader/   # Book reader feature
│   │   ├── components/ # Components specific to this feature
│   │   ├── hooks/      # Hooks specific to this feature
│   │   ├── utils/      # Utilities specific to this feature
│   │   ├── types.ts    # Types for this feature
│   │   └── index.ts    # Export all from this feature
│   └── ...           # Other features
├── hooks/            # Custom hooks
│   ├── useTheme.ts   # Theme hook
│   └── index.ts      # Export all hooks
├── pages/            # Screen components
│   ├── BookPage.tsx  # Book reader screen
│   └── ...           # Other screens
├── types/            # TypeScript type definitions
│   └── index.ts      # Export all types
└── utils/            # Utility functions
    └── index.ts      # Export all utilities
```

## Import Conventions

Use path aliases for cleaner imports:

```typescript
// Good
import { Button } from '@components/ui';
import { colors } from '@constants/theme';
import { useTheme } from '@hooks';

// Avoid
import { Button } from '../../components/ui/Button';
import { colors } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
```

## Naming Conventions

- **Files**: Use PascalCase for components and camelCase for utilities, hooks, etc.
- **Components**: Use PascalCase for component names
- **Functions**: Use camelCase for function names
- **Constants**: Use UPPER_SNAKE_CASE for constants
- **Types/Interfaces**: Use PascalCase for types and interfaces

## Component Structure

Components should follow this structure:

```typescript
/**
 * Component description
 */
import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './styles';

interface ComponentProps {
  // Props definition
}

export const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // Component logic

  return (
    <View>
      {/* Component JSX */}
    </View>
  );
};
```

## Feature-Based Organization

Features should be organized in a modular way:

- Each feature should have its own directory
- Features should be self-contained with their own components, hooks, utils, etc.
- Features should export a clear public API

## Type Safety

- Use TypeScript for all files
- Define interfaces for all component props
- Use proper type definitions for all variables and functions

## Best Practices

- Keep components small and focused
- Extract reusable logic into custom hooks
- Use constants for magic values
- Write meaningful comments
- Follow the DRY (Don't Repeat Yourself) principle 