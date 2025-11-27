# Transition and Animation System

This document describes the transition timing and animation utilities available in the Music Poetry Canvas design system.

## Design System Variables

The following CSS variables are defined for consistent timing across the application:

```css
--transition-fast: 150ms
--transition-normal: 300ms
--transition-slow: 500ms
--transition-easing: cubic-bezier(0.4, 0, 0.2, 1)
```

## Transition Utility Classes

### Timing Classes

Apply these classes to control transition duration:

- `.transition-fast` - 150ms transitions
- `.transition-normal` - 300ms transitions (default)
- `.transition-slow` - 500ms transitions

All timing classes use the design system easing function: `cubic-bezier(0.4, 0, 0.2, 1)`

### Property-Specific Transitions

These classes define which properties should transition:

- `.transition-colors` - Transitions color-related properties (color, background-color, border-color, etc.)
- `.transition-opacity` - Transitions opacity only
- `.transition-transform` - Transitions transform only
- `.transition-shadow` - Transitions box-shadow only
- `.transition-all` - Transitions all properties

### Combined Transitions

For convenience, these classes combine property and timing:

- `.transition-colors-fast` - Color transitions with fast timing (150ms)
- `.transition-colors-slow` - Color transitions with slow timing (500ms)

## Animation Classes

### Fade-in Animations

- `.animate-fade-in` - Fade in over 500ms (slow)
- `.animate-fade-in-normal` - Fade in over 300ms
- `.animate-fade-in-fast` - Fade in over 150ms

### Slide-in Animations

- `.animate-slide-in-from-top` - Slide in from top with fade
- `.animate-slide-in-from-bottom` - Slide in from bottom with fade

### Loading Animations

- `.animate-spin` - Continuous rotation (1s per rotation)
- `.animate-spin-fast` - Fast rotation (0.5s per rotation)
- `.animate-spin-slow` - Slow rotation (2s per rotation)
- `.animate-pulse` - Pulsing opacity effect

### Scale Animations

- `.animate-scale-in` - Scale from 0.95 to 1.0 with fade

### Dialog Animations

- `.animate-dialog-enter` - Combined scale and slide animation for dialogs
- `.animate-backdrop-fade-in` - Backdrop fade-in for modal overlays

### Hover Effects

- `.hover-scale` - Scale to 1.05 on hover
- `.hover-lift` - Lift element with shadow on hover
- `.hover-brighten` - Increase brightness on hover

## Component Integration

All Shadcn/ui components have been updated to use the design system transitions:

### Button Component

```tsx
<Button>Click Me</Button>
// Has transition-all transition-normal by default
// Includes active:scale-95 for click feedback
```

### Input Component

```tsx
<Input placeholder="Type here..." />
// Has transition-all transition-normal by default
// Smooth focus ring and border transitions
```

### Card Component

```tsx
<Card>Content</Card>
// Has transition-shadow transition-normal
// Smooth shadow changes on hover
```

### Slider Component

```tsx
<Slider value={[50]} />
// Track has transition-colors-fast
// Range has transition-all-fast
// Thumb has transition-all-normal with hover:scale-110
```

### Badge Component

```tsx
<Badge>Status</Badge>
// Has transition-colors-fast
// Quick color changes for status updates
```

### Toggle/ToggleGroup Component

```tsx
<Toggle>Option</Toggle>
// Has transition-all-fast
// Quick state changes
```

## Usage Examples

### Basic Transition

```tsx
<div className="transition-colors hover:bg-primary">
  Hover me
</div>
```

### Custom Timing

```tsx
<div className="transition-fast hover:opacity-50">
  Fast fade on hover
</div>
```

### Multiple Properties

```tsx
<div className="transition-all hover:scale-105 hover:shadow-lg">
  Scale and shadow on hover
</div>
```

### Fade-in on Mount

```tsx
{showContent && (
  <div className="animate-fade-in">
    Content appears smoothly
  </div>
)}
```

### Loading Spinner

```tsx
<div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
```

### Dialog with Backdrop

```tsx
{showDialog && (
  <>
    <div className="fixed inset-0 bg-black/50 animate-backdrop-fade-in" />
    <div className="fixed inset-0 flex items-center justify-center">
      <Card className="animate-dialog-enter">
        Dialog content
      </Card>
    </div>
  </>
)}
```

## Best Practices

1. **Use Design System Variables**: Always use the predefined timing classes instead of custom durations
2. **Match Timing to Action**: 
   - Fast (150ms) for immediate feedback (hover, active states)
   - Normal (300ms) for standard transitions (focus, color changes)
   - Slow (500ms) for entrance animations (fade-in, slide-in)
3. **Limit Animated Properties**: Only animate properties that need to change for better performance
4. **Use Hardware-Accelerated Properties**: Prefer `transform` and `opacity` for smooth 60fps animations
5. **Provide Feedback**: Always give visual feedback for user interactions
6. **Test Performance**: Ensure animations maintain 60fps on target devices

## Performance Considerations

- All animations use CSS, not JavaScript, for better performance
- Transform and opacity are hardware-accelerated
- Transitions are applied only to necessary properties
- Animation frame rates are optimized for 60fps

## Accessibility

- Animations respect user preferences (consider adding `prefers-reduced-motion` support)
- Focus indicators have clear transitions for keyboard navigation
- Loading states are clearly indicated with animations
- All interactive elements provide immediate visual feedback

## Visual Testing

To see all transitions and animations in action, use the visual test component:

```tsx
import { TransitionsVisualTest } from '@/components/ui/transitions-visual-test';

// In your app
<TransitionsVisualTest />
```

This component demonstrates all available transitions and animations with interactive examples.
