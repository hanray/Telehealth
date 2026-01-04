# Telehealth-FINAL

For demo app

**Version:** 0.1.0  
**Last Updated:** 1/3/2026, 12:50:53 PM  

## Exported Files

This design system export includes the following files:

- **tokens.json** - Complete token definitions with resolved values
- **components.json** - Component contracts, anatomy, and token overrides
- **tokens.css** - CSS custom properties for direct browser use
- **components.css** - Token-bound component styles for runtime
- **figma-variables.json** - Figma Variables import mapping
- **README.md** - This file

## Usage Guide

### For Developers

#### Using CSS Variables
```html
<link rel="stylesheet" href="tokens.css">
```

```css
/* Use tokens in your CSS */
.my-button {
  background-color: var(--color-accent-primary-base);
  color: var(--color-accent-primary-contrast);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
}
```

#### Using JSON Tokens
```typescript
import tokens from './tokens.json';
import components from './components.json';

// Access resolved global tokens
const primaryColor = tokens.computed.color.accent.primary.base;

// Access component tokens
const buttonTokens = components.components.button.baseResolved;
```

### For AI Agents & Code Generation

When generating components, follow these rules:

1. **Always use token references** from tokens.json, never hardcode values
2. **Respect component contracts** defined in components.json
3. **Implement all required states** listed in contract.requiredStates
4. **Never override forbidden properties** listed in contract.forbiddenOverrides
5. **Use semantic token names** (e.g., `color.text.primary` not `#000000`)

#### Component Contract Example
```typescript
// Button contract from components.json
const contract = components.components.button.contract;

// Required states to implement:
// default, hover, active, focus, disabled, loading, selected

// Forbidden overrides (do not customize these):
// borderRadiusCustom, arbitraryDropShadow
```

### For Designers

#### Importing to Figma

1. Use a Figma plugin that supports variable import (e.g., 'Variables Import')
2. Load `figma-variables.json`
3. Map collections to your Figma file
4. Variables will be created with proper scopes and types

The mapping includes:
- Color tokens → Color variables
- Spacing tokens → Number variables
- Typography tokens → Number/String variables
- Component tokens → Aliased variables (referencing global tokens)

## Token Structure

### Global Tokens

Global tokens are organized into categories:

- `color.*` - Color palette (surface, text, border, accent, danger)
- `font.*` - Font families and sizes
- `textRole.*` - Semantic text styles (display, heading, body, etc.)
- `space.*` - Spacing scale (0-8)
- `radius.*` - Border radius values
- `shadow.*` - Box shadow definitions
- `motion.*` - Animation duration and easing
- `weight.*` - Font weights
- `lineHeight.*` - Line height values

### Component Tokens

Each component has:

- **baseTokens** - Default appearance tokens
- **states** - State-specific overrides (hover, focus, disabled, etc.)
- **variants** - Named variations (size, intent, style)
- **contract** - Anatomical structure and semantic meaning

## Available Components

- **Button** (button)
- **Input** (input)
- **Card** (card)
- **Modal** (modal)
- **Dropdown/Select** (dropdown)
- **Checkbox** (checkbox)
- **Radio** (radio)
- **Toggle/Switch** (toggle)
- **Tabs** (tabs)
- **Badge** (badge)
- **Toast** (toast)
- **Tooltip** (tooltip)
- **Table** (table)
- **Navbar** (navbar)
- **Footer** (footer)
- **List Item** (list-item)
- **Divider** (divider)
- **Avatar** (avatar)
- **Date Picker** (date-picker)
- **Form** (form)
- **Pill Badge** (pill-badge)

## Forbidden Overrides

These properties must NOT be customized per component contract:

- **Button**: borderRadiusCustom, arbitraryDropShadow
- **Input**: borderRadiusCustom, boxShadowCustom
- **Card**: arbitraryDropShadow
- **Modal**: removeOverlay, customBackdropOpacity
- **Dropdown/Select**: removeBorder, arbitraryShadow
- **Checkbox**: removeFocusRing
- **Toggle/Switch**: removeKnob
- **Tabs**: removeIndicator
- **Badge**: extraShadow
- **Toast**: removePadding
- **Tooltip**: removePointerSpacing
- **Table**: removeRowPadding
- **Navbar**: removeShadow
- **Footer**: removePadding
- **List Item**: removeFocusState
- **Divider**: changeThickness
- **Avatar**: removeContrast
- **Date Picker**: removeFocusRing, arbitraryShadow
- **Form**: removeGap
- **Pill Badge**: addDropShadow

## System Philosophy

This is a **code-first** design system:

- Tokens + component contracts are the source of truth
- CSS is derived from tokens, not the other way around
- All styles must be token-driven (no magic numbers)
- Components must respect their contracts
- AI/agents should consume tokens + contracts to generate UI

## Support & Questions

For questions about this design system export:

1. Check the component contract in `components.json`
2. Verify token references in `tokens.json`
3. Review computed values for resolved token values
4. Ensure you're using semantic token names, not hardcoded values
