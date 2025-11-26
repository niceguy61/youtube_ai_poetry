# Input Component Customization

This document describes the customizations made to the Shadcn/ui Input component for the Music Poetry Canvas project.

## Overview

The Input component has been enhanced with YouTube red theme integration, smooth transitions, error states, and loading states while maintaining full accessibility.

## Features

### 1. YouTube Red Focus Ring

**Implementation:**
- Uses CSS variable `--ring: 0 100% 50%` (YouTube red #FF0000)
- Applied via `focus-visible:ring-2 focus-visible:ring-ring`
- Includes ring offset for better visibility

**Visual Effect:**
```css
focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
```

### 2. Smooth Focus Transitions

**Implementation:**
- 300ms transition duration with ease-in-out easing
- Transitions applied to all properties (border, shadow, ring)
- Border color changes to primary on focus

**CSS Classes:**
```css
transition-all duration-300 ease-in-out
focus-visible:border-primary
focus-visible:shadow-[0_0_0_3px_rgba(255,0,0,0.1)]
```

### 3. Error State Styling

**Props:**
```typescript
interface InputProps {
  error?: boolean;
}
```

**Implementation:**
- Red border using `--destructive` color
- Enhanced shadow with more opacity
- Sets `aria-invalid="true"` for accessibility

**Visual Effect:**
```css
border-destructive
focus-visible:ring-destructive
focus-visible:shadow-[0_0_0_3px_rgba(255,0,0,0.2)]
```

### 4. Loading State

**Props:**
```typescript
interface InputProps {
  loading?: boolean;
}
```

**Implementation:**
- Displays animated spinner on the right side
- Automatically disables input during loading
- Sets `aria-busy="true"` for accessibility
- Adds right padding to prevent text overlap with spinner

**Spinner:**
- YouTube red color (`text-primary`)
- Smooth rotation animation
- Positioned absolutely on the right side

### 5. Disabled State

**Implementation:**
- Reduced opacity (50%)
- Cursor changes to `not-allowed`
- Muted background color
- Inherits from Shadcn/ui defaults

**CSS Classes:**
```css
disabled:cursor-not-allowed
disabled:opacity-50
disabled:bg-muted/50
```

## Usage Examples

### Basic Input
```tsx
<Input placeholder="Enter text..." />
```

### Input with Error
```tsx
<Input 
  error 
  placeholder="Email address" 
  aria-describedby="email-error"
/>
<span id="email-error" className="text-destructive">
  Invalid email address
</span>
```

### Input with Loading State
```tsx
<Input 
  loading 
  placeholder="Searching..." 
  value={searchQuery}
/>
```

### Disabled Input
```tsx
<Input 
  disabled 
  placeholder="Not available" 
  value="Read only value"
/>
```

### Combined States
```tsx
// Error state takes precedence over loading
<Input 
  error 
  loading 
  placeholder="Processing..."
/>
```

## Accessibility

The Input component maintains full accessibility compliance:

### ARIA Attributes
- `aria-invalid="true"` when `error` prop is true
- `aria-busy="true"` when `loading` prop is true
- `aria-hidden="true"` on loading spinner (decorative)

### Keyboard Navigation
- Full keyboard support (Tab, Shift+Tab)
- Visible focus indicators with YouTube red ring
- Disabled state prevents keyboard interaction

### Screen Readers
- Error state announced via `aria-invalid`
- Loading state announced via `aria-busy`
- Proper labeling with associated `<label>` elements

## Design Tokens

The Input component uses the following CSS variables from the YouTube red theme:

```css
--primary: 0 100% 50%;        /* YouTube red #FF0000 */
--ring: 0 100% 50%;           /* Focus ring color */
--destructive: 0 100% 50%;    /* Error state color */
--input: 0 0% 17.5%;          /* Border color */
--background: 0 0% 7%;        /* Background color */
--muted: 0 0% 17.5%;          /* Muted elements */
```

## Transition Timing

All transitions use consistent timing:
- **Duration:** 300ms
- **Easing:** ease-in-out
- **Properties:** all (border, shadow, ring, colors)

This creates smooth, polished interactions that feel responsive without being jarring.

## Browser Compatibility

The Input component uses modern CSS features:
- CSS custom properties (CSS variables)
- `focus-visible` pseudo-class
- Backdrop filters (for glassmorphism)
- CSS animations

**Supported Browsers:**
- Chrome/Edge 88+
- Firefox 85+
- Safari 14+

## Performance Considerations

- CSS transitions are hardware-accelerated
- No JavaScript animations
- Minimal re-renders (only on prop changes)
- Spinner SVG is inline (no external requests)

## Testing

The Input component includes comprehensive tests:

```typescript
// Basic rendering
it('should render input component', () => {
  render(<Input placeholder="Enter text" />);
  expect(screen.getByPlaceholderText(/enter text/i)).toBeInTheDocument();
});

// Error state
it('should render with error state', () => {
  render(<Input error placeholder="Enter text" />);
  const input = screen.getByPlaceholderText(/enter text/i);
  expect(input).toHaveAttribute('aria-invalid', 'true');
});

// Loading state
it('should render with loading state', () => {
  render(<Input loading placeholder="Enter text" />);
  const input = screen.getByPlaceholderText(/enter text/i);
  expect(input).toHaveAttribute('aria-busy', 'true');
  expect(input).toBeDisabled();
});
```

## Visual Testing

Use the `InputVisualTest` component to manually verify all states:

```tsx
import { InputVisualTest } from '@/components/ui/input-visual-test';

function App() {
  return <InputVisualTest />;
}
```

This displays all Input variants side-by-side for visual inspection.

## Requirements Validation

This implementation satisfies the following requirements:

- **2.1:** Focus indicators with smooth transitions ✓
- **2.2:** Visual feedback through border colors and shadows ✓
- **2.3:** Disabled state with appropriate styling ✓
- **2.4:** Error state with clear visual indicators ✓
- **2.5:** Loading state with elegant animations ✓

## Future Enhancements

Potential improvements for future iterations:

1. **Success State:** Green border/ring for validated inputs
2. **Size Variants:** Small, medium, large sizes
3. **Icon Support:** Left/right icon slots
4. **Character Counter:** Show remaining characters
5. **Clear Button:** X button to clear input value
6. **Autocomplete:** Dropdown suggestions
7. **Validation Messages:** Built-in error message display

## Related Components

- **Button:** Uses same YouTube red theme
- **Card:** Container for input groups
- **Badge:** Status indicators for forms
- **Slider:** Alternative input for numeric values

## References

- [Shadcn/ui Input Documentation](https://ui.shadcn.com/docs/components/input)
- [Radix UI Primitives](https://www.radix-ui.com/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [YouTube Brand Guidelines](https://www.youtube.com/howyoutubeworks/resources/brand-resources/)
