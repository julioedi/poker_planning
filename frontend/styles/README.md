# SASS Structure

This directory contains the modular SASS files for the Poker Planning application.

## File Structure

```
styles/
├── main.scss              # Main entry point - imports all modules
├── _variables.scss        # CSS variables and SASS variables
├── _base.scss            # Base styles and typography
├── _buttons.scss         # Button components and variants
├── _forms.scss           # Form elements and input styles
├── _cards.scss           # Card components and layouts
├── _dashboard.scss       # Dashboard-specific styles (sidebar, navigation)
├── _dropdowns.scss       # Dropdown menus and components
├── _tables.scss          # Table styles and components
├── _status.scss          # Status badges and indicators
├── _modals.scss          # Modal components and overlays
└── README.md             # This file
```

## Usage

### Importing Styles
The main SASS file (`main.scss`) is imported in `app/layout.tsx` and automatically includes all modules.

### Adding New Styles
1. Create a new `_filename.scss` file in the `styles/` directory
2. Import it in `main.scss`
3. Use the `@import 'variables';` directive to access shared variables

### CSS Variables
All theme variables are defined in `_variables.scss` and can be used throughout the application:
- Light theme variables in `:root`
- Dark theme variables in `.dark`
- SASS variables for common values

### Tailwind Integration
The SASS files work alongside Tailwind CSS:
- Use `@apply` directive to apply Tailwind classes
- CSS variables for theme-aware styling
- Custom components that extend Tailwind's utility classes

## Benefits of This Structure

1. **Modularity**: Each component type has its own file
2. **Maintainability**: Easy to find and modify specific styles
3. **Reusability**: Shared variables and mixins
4. **Theme Support**: CSS variables for light/dark themes
5. **Performance**: Only imports what's needed
6. **Scalability**: Easy to add new components and styles

## Best Practices

1. Always import `_variables.scss` in new SASS files
2. Use CSS variables for theme-aware colors
3. Use Tailwind's `@apply` directive when possible
4. Keep component styles in their respective files
5. Use SASS nesting for related styles
6. Follow the existing naming conventions 