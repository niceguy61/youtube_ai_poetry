import { Input } from './input';

/**
 * Visual Test Component for Input
 * 
 * This component demonstrates all the enhanced Input features:
 * - YouTube red focus ring with smooth transitions
 * - Error state styling
 * - Loading state with spinner
 * - Disabled state
 * 
 * To test:
 * 1. Import this component in your app
 * 2. Observe the focus ring color (YouTube red) when clicking inputs
 * 3. Notice the smooth transition animations
 * 4. See the loading spinner in the loading state
 * 5. Verify disabled state styling
 */
export function InputVisualTest() {
  return (
    <div className="p-8 space-y-6 bg-background min-h-screen">
      <h1 className="text-2xl font-bold text-foreground mb-8">
        Input Component Visual Test
      </h1>

      <div className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">
            Normal Input (Focus to see YouTube red ring)
          </label>
          <Input placeholder="Type something..." />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">
            Input with Value
          </label>
          <Input defaultValue="This is some text" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">
            Error State (Red border and focus ring)
          </label>
          <Input error placeholder="This field has an error" />
          <p className="text-sm text-destructive mt-1">
            This is an error message
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">
            Loading State (Disabled with spinner)
          </label>
          <Input loading placeholder="Loading..." />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">
            Disabled State (Reduced opacity)
          </label>
          <Input disabled placeholder="This input is disabled" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">
            Password Input
          </label>
          <Input type="password" placeholder="Enter password" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">
            Email Input
          </label>
          <Input type="email" placeholder="email@example.com" />
        </div>
      </div>

      <div className="mt-8 p-4 bg-card rounded-lg border border-border">
        <h2 className="text-lg font-semibold mb-2 text-card-foreground">
          Features Demonstrated:
        </h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li>YouTube red focus ring (--ring: 0 100% 50%)</li>
          <li>Smooth focus transitions (300ms ease-in-out)</li>
          <li>Error state with red border and enhanced shadow</li>
          <li>Loading state with animated spinner</li>
          <li>Disabled state with reduced opacity (50%)</li>
          <li>Proper ARIA attributes (aria-invalid, aria-busy)</li>
        </ul>
      </div>
    </div>
  );
}
