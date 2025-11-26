import { Button } from './button';

/**
 * Visual test component for Button variants
 * This component demonstrates all button variants with the YouTube red theme
 */
export function ButtonVisualTest() {
  return (
    <div className="p-8 space-y-8 bg-background min-h-screen">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Button Variants - YouTube Red Theme</h2>
        
        {/* Default Variant */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Default (Primary Red)</h3>
          <div className="flex gap-4 items-center">
            <Button variant="default" size="sm">Small</Button>
            <Button variant="default">Default Size</Button>
            <Button variant="default" size="lg">Large</Button>
            <Button variant="default" size="icon">🎵</Button>
            <Button variant="default" disabled>Disabled</Button>
          </div>
        </div>

        {/* Outline Variant */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Outline</h3>
          <div className="flex gap-4 items-center">
            <Button variant="outline" size="sm">Small</Button>
            <Button variant="outline">Default Size</Button>
            <Button variant="outline" size="lg">Large</Button>
            <Button variant="outline" size="icon">🎵</Button>
            <Button variant="outline" disabled>Disabled</Button>
          </div>
        </div>

        {/* Secondary Variant */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Secondary (Darker Red)</h3>
          <div className="flex gap-4 items-center">
            <Button variant="secondary" size="sm">Small</Button>
            <Button variant="secondary">Default Size</Button>
            <Button variant="secondary" size="lg">Large</Button>
            <Button variant="secondary" size="icon">🎵</Button>
            <Button variant="secondary" disabled>Disabled</Button>
          </div>
        </div>

        {/* Ghost Variant */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Ghost</h3>
          <div className="flex gap-4 items-center">
            <Button variant="ghost" size="sm">Small</Button>
            <Button variant="ghost">Default Size</Button>
            <Button variant="ghost" size="lg">Large</Button>
            <Button variant="ghost" size="icon">🎵</Button>
            <Button variant="ghost" disabled>Disabled</Button>
          </div>
        </div>

        {/* Link Variant */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Link</h3>
          <div className="flex gap-4 items-center">
            <Button variant="link" size="sm">Small Link</Button>
            <Button variant="link">Default Link</Button>
            <Button variant="link" size="lg">Large Link</Button>
            <Button variant="link" disabled>Disabled Link</Button>
          </div>
        </div>

        {/* Destructive Variant */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Destructive</h3>
          <div className="flex gap-4 items-center">
            <Button variant="destructive" size="sm">Small</Button>
            <Button variant="destructive">Default Size</Button>
            <Button variant="destructive" size="lg">Large</Button>
            <Button variant="destructive" size="icon">🗑️</Button>
            <Button variant="destructive" disabled>Disabled</Button>
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t border-border pt-8">
        <h2 className="text-2xl font-bold text-foreground">Interactive States</h2>
        <div className="space-y-2">
          <p className="text-muted-foreground">Hover over buttons to see smooth color transitions (red to darker red)</p>
          <p className="text-muted-foreground">Click buttons to see active state with scale effect</p>
          <p className="text-muted-foreground">Disabled buttons have reduced opacity (50%)</p>
        </div>
      </div>
    </div>
  );
}
