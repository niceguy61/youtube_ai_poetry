/**
 * Visual test component for transition and animation utilities
 * This component demonstrates all the transition timing and animation classes
 */

import { Button } from './button';
import { Input } from './input';
import { Card, CardHeader, CardTitle, CardContent } from './card';
import { Badge } from './badge';
import { Slider } from './slider';
import { useState } from 'react';

export function TransitionsVisualTest() {
  const [showFadeIn, setShowFadeIn] = useState(false);
  const [showSlideIn, setShowSlideIn] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [sliderValue, setSliderValue] = useState([50]);

  return (
    <div className="p-8 space-y-8 bg-background min-h-screen">
      <h1 className="text-3xl font-bold text-foreground mb-8">
        Transition & Animation Visual Tests
      </h1>

      {/* Transition Timing Tests */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Transition Timing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Fast (150ms)</p>
            <Button className="transition-fast hover:scale-105">
              Hover Me - Fast
            </Button>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-2">Normal (300ms)</p>
            <Button className="transition-normal hover:scale-105">
              Hover Me - Normal
            </Button>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-2">Slow (500ms)</p>
            <Button className="transition-slow hover:scale-105">
              Hover Me - Slow
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Color Transitions */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Color Transitions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="default">
            Default Button (has transition-all)
          </Button>
          
          <Button variant="outline">
            Outline Button (has transition-all)
          </Button>
          
          <Button variant="secondary">
            Secondary Button (has transition-all)
          </Button>
          
          <Badge>Status Badge (has transition-colors-fast)</Badge>
        </CardContent>
      </Card>

      {/* Input Focus Transitions */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Input Focus Transitions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Focus me to see transition" />
          <Input placeholder="With error state" error />
          <Input placeholder="Loading state" loading />
        </CardContent>
      </Card>

      {/* Slider Transitions */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Slider Transitions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Drag the slider to see smooth transitions
          </p>
          <Slider
            value={sliderValue}
            onValueChange={setSliderValue}
            max={100}
            step={1}
          />
          <p className="text-sm text-muted-foreground mt-2">
            Value: {sliderValue[0]}
          </p>
        </CardContent>
      </Card>

      {/* Fade-in Animation */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Fade-in Animations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => setShowFadeIn(!showFadeIn)}>
            Toggle Fade-in
          </Button>
          
          {showFadeIn && (
            <div className="space-y-2">
              <Card className="glass animate-fade-in-fast">
                <CardContent className="p-4">
                  <p>Fast fade-in (150ms)</p>
                </CardContent>
              </Card>
              
              <Card className="glass animate-fade-in-normal">
                <CardContent className="p-4">
                  <p>Normal fade-in (300ms)</p>
                </CardContent>
              </Card>
              
              <Card className="glass animate-fade-in">
                <CardContent className="p-4">
                  <p>Slow fade-in (500ms)</p>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Slide-in Animations */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Slide-in Animations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => setShowSlideIn(!showSlideIn)}>
            Toggle Slide-in
          </Button>
          
          {showSlideIn && (
            <div className="space-y-2">
              <Card className="glass animate-slide-in-from-top">
                <CardContent className="p-4">
                  <p>Slide from top</p>
                </CardContent>
              </Card>
              
              <Card className="glass animate-slide-in-from-bottom">
                <CardContent className="p-4">
                  <p>Slide from bottom</p>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading Spinner Animations */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Loading Spinner Animations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Normal spin (1s)</p>
          </div>
          
          <div className="flex gap-4 items-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin-fast" />
            <p className="text-sm">Fast spin (0.5s)</p>
          </div>
          
          <div className="flex gap-4 items-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin-slow" />
            <p className="text-sm">Slow spin (2s)</p>
          </div>
        </CardContent>
      </Card>

      {/* Pulse Animation */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Pulse Animation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="w-4 h-4 bg-primary rounded-full animate-pulse" />
            <p className="text-sm">Pulsing indicator</p>
          </div>
        </CardContent>
      </Card>

      {/* Hover Effects */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Hover Effects</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Card className="glass hover-scale cursor-pointer">
            <CardContent className="p-4">
              <p>Hover to scale (1.05x)</p>
            </CardContent>
          </Card>
          
          <Card className="glass hover-lift cursor-pointer">
            <CardContent className="p-4">
              <p>Hover to lift with shadow</p>
            </CardContent>
          </Card>
          
          <Card className="glass hover-brighten cursor-pointer">
            <CardContent className="p-4">
              <p>Hover to brighten (1.1x)</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Dialog Animation */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Dialog Entry Animation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => setShowDialog(!showDialog)}>
            Toggle Dialog
          </Button>
          
          {showDialog && (
            <>
              <div className="fixed inset-0 bg-black/50 animate-backdrop-fade-in z-40" />
              <div className="fixed inset-0 flex items-center justify-center z-50">
                <Card className="glass animate-dialog-enter max-w-md">
                  <CardHeader>
                    <CardTitle>Dialog Example</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">
                      This dialog enters with scale and fade animation
                    </p>
                    <Button onClick={() => setShowDialog(false)}>
                      Close
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Scale-in Animation */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Scale-in Animation</CardTitle>
        </CardHeader>
        <CardContent>
          <Card className="glass animate-scale-in">
            <CardContent className="p-4">
              <p>This card scales in on mount</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
