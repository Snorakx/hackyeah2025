# SCSS Structure

This project uses a modular SCSS architecture with the following structure:

## Files

### `main.scss`
Main entry point that imports all other SCSS files.

### `_variables.scss`
Contains all SCSS variables:
- Colors (`$bg-primary`, `$text-primary`, etc.)
- Typography (`$font-family`, `$font-size-*`)
- Spacing (`$spacing-*`)
- Border radius (`$border-radius-*`)
- Shadows (`$shadow-*`)
- Breakpoints (`$breakpoint-*`)

### `_mixins.scss`
Contains reusable SCSS mixins:
- `@mixin glass-effect()` - Glass morphism effect
- `@mixin flex-center()`, `@mixin flex-between()` - Flex utilities
- `@mixin text-gradient()` - Text gradient effects
- `@mixin safe-area()` - Safe area handling
- `@mixin mobile()`, `@mixin tablet()`, `@mixin desktop()` - Responsive breakpoints
- `@mixin transition()`, `@mixin hover-lift()` - Animation utilities
- `@mixin button-base()`, `@mixin button-glass()` - Button styles

### `_components.scss`
Contains component-specific styles:
- `.glass-card` - Glass morphism cards
- `.card-3d` - 3D card effects
- `.btn-neo` - Modern button styles
- `.input-neo` - Form input styles
- `.spinner-neo` - Loading spinner
- `.progress-3d` - Progress bars

### `_animations.scss`
Contains keyframe animations and animation classes:
- `@keyframes gradient-shift` - Animated gradients
- `@keyframes float` - Floating animation
- `@keyframes pulse-glow` - Pulse glow effect
- `@keyframes spin` - Spinning animation

## Usage

To use these styles in your components:

1. **Variables**: Use SCSS variables directly in your component styles
2. **Mixins**: Include mixins in your component styles
3. **Classes**: Apply utility classes to your HTML elements

## Example

```scss
.my-component {
  @include glass-effect(15px, 0.1);
  @include flex-center;
  color: $text-primary;
  padding: $spacing-md;
  
  &:hover {
    @include hover-lift;
  }
}
```

## CSS Custom Properties

CSS custom properties are automatically generated from SCSS variables in `main.scss`.
