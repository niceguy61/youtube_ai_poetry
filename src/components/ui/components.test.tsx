import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './button';
import { Input } from './input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from './card';
import { Slider } from './slider';
import { ToggleGroup, ToggleGroupItem } from './toggle-group';
import { Badge } from './badge';

describe('Shadcn/ui Components', () => {
  describe('Button', () => {
    it('should render button component', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('should render with different variants', () => {
      const { rerender } = render(<Button variant="default">Default</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
      
      rerender(<Button variant="outline">Outline</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
      
      rerender(<Button variant="secondary">Secondary</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Input', () => {
    it('should render input component', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText(/enter text/i)).toBeInTheDocument();
    });

    it('should accept value prop', () => {
      render(<Input value="test value" readOnly />);
      expect(screen.getByDisplayValue(/test value/i)).toBeInTheDocument();
    });

    it('should render with error state', () => {
      render(<Input error placeholder="Enter text" />);
      const input = screen.getByPlaceholderText(/enter text/i);
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should render with loading state', () => {
      render(<Input loading placeholder="Enter text" />);
      const input = screen.getByPlaceholderText(/enter text/i);
      expect(input).toHaveAttribute('aria-busy', 'true');
      expect(input).toBeDisabled();
    });

    it('should render loading spinner when loading', () => {
      const { container } = render(<Input loading placeholder="Enter text" />);
      const spinner = container.querySelector('svg.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
      render(<Input disabled placeholder="Enter text" />);
      const input = screen.getByPlaceholderText(/enter text/i);
      expect(input).toBeDisabled();
    });
  });

  describe('Card', () => {
    it('should render card with header and content', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
          <CardContent>Card content goes here</CardContent>
        </Card>
      );
      
      expect(screen.getByText(/card title/i)).toBeInTheDocument();
      expect(screen.getByText(/card content goes here/i)).toBeInTheDocument();
    });

    it('should apply glassmorphism effect', () => {
      const { container } = render(
        <Card>
          <CardContent>Content</CardContent>
        </Card>
      );
      
      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass('glass');
    });

    it('should render with all sub-components', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
            <CardDescription>Test Description</CardDescription>
          </CardHeader>
          <CardContent>Test Content</CardContent>
          <CardFooter>Test Footer</CardFooter>
        </Card>
      );
      
      expect(screen.getByText(/test title/i)).toBeInTheDocument();
      expect(screen.getByText(/test description/i)).toBeInTheDocument();
      expect(screen.getByText(/test content/i)).toBeInTheDocument();
      expect(screen.getByText(/test footer/i)).toBeInTheDocument();
    });

    it('should have proper typography hierarchy in CardTitle', () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
        </Card>
      );
      
      const title = screen.getByText(/title/i);
      expect(title).toHaveClass('text-2xl');
      expect(title).toHaveClass('font-bold');
    });

    it('should have proper spacing in CardContent', () => {
      const { container } = render(
        <Card>
          <CardContent>Content</CardContent>
        </Card>
      );
      
      const content = screen.getByText(/content/i);
      expect(content).toHaveClass('p-6');
      expect(content).toHaveClass('pt-0');
    });

    it('should have proper spacing in CardFooter', () => {
      const { container } = render(
        <Card>
          <CardFooter>Footer</CardFooter>
        </Card>
      );
      
      const footer = screen.getByText(/footer/i);
      expect(footer).toHaveClass('p-6');
      expect(footer).toHaveClass('pt-0');
      expect(footer).toHaveClass('flex');
      expect(footer).toHaveClass('items-center');
    });
  });

  describe('Slider', () => {
    it('should render slider component', () => {
      render(<Slider defaultValue={[50]} max={100} step={1} />);
      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
    });
  });

  describe('ToggleGroup', () => {
    it('should render toggle group with items', () => {
      render(
        <ToggleGroup type="single">
          <ToggleGroupItem value="a">Option A</ToggleGroupItem>
          <ToggleGroupItem value="b">Option B</ToggleGroupItem>
        </ToggleGroup>
      );
      
      expect(screen.getByText(/option a/i)).toBeInTheDocument();
      expect(screen.getByText(/option b/i)).toBeInTheDocument();
    });
  });

  describe('Badge', () => {
    it('should render badge component', () => {
      render(<Badge>New</Badge>);
      expect(screen.getByText(/new/i)).toBeInTheDocument();
    });

    it('should render with different variants', () => {
      const { rerender } = render(<Badge variant="default">Default</Badge>);
      expect(screen.getByText(/default/i)).toBeInTheDocument();
      
      rerender(<Badge variant="secondary">Secondary</Badge>);
      expect(screen.getByText(/secondary/i)).toBeInTheDocument();
      
      rerender(<Badge variant="destructive">Destructive</Badge>);
      expect(screen.getByText(/destructive/i)).toBeInTheDocument();
    });
  });
});
