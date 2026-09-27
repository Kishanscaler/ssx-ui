import * as React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Button, buttonVariants } from '../Button';
import { IconButton } from '../IconButton';
import { ToggleButton, toggleButtonVariants } from '../ToggleButton';
import { cn } from '../../lib/cn';
import { Toolbar, ToolbarOverflow, ToolbarToggle } from './Toolbar';
import { MenuItem } from '../Menu';
import { Popover, PopoverContent, PopoverTrigger } from '../Popover';

const G = () => <svg aria-hidden="true" />;

const size = (name: string) => screen.getByRole('button', { name }).getAttribute('data-size');

describe('Toolbar size cascade', () => {
  it('sets the size of every Button, IconButton and ToggleButton inside it', () => {
    render(
      <Toolbar aria-label="Message options" size="sm">
        <Button variant="tertiary">Auto</Button>
        <IconButton variant="tertiary" aria-label="Attach a file">
          <G />
        </IconButton>
        <ToggleButton>Web search</ToggleButton>
        <ToggleButton aria-label="Pin chat" icon={<G />} />
        <ToolbarToggle aria-label="Bold">
          <G />
        </ToolbarToggle>
        <ToolbarOverflow aria-label="More">
          <MenuItem>Clear chat</MenuItem>
        </ToolbarOverflow>
      </Toolbar>,
    );
    expect(screen.getByRole('toolbar')).toHaveAttribute('data-size', 'sm');
    expect(size('Auto')).toBe('sm');
    expect(size('Attach a file')).toBe('icon-sm');
    expect(size('Web search')).toBe('sm');
    expect(size('Pin chat')).toBe('icon-sm');
    expect(size('More')).toBe('icon-sm');
  });

  it('maps md and lg to the matching text and square sizes', () => {
    render(
      <Toolbar aria-label="Big" size="lg">
        <Button>Send</Button>
        <IconButton aria-label="Attach">
          <G />
        </IconButton>
        <ToolbarToggle aria-label="Bold">
          <G />
        </ToolbarToggle>
        <ToolbarOverflow aria-label="More">
          <MenuItem>Clear chat</MenuItem>
        </ToolbarOverflow>
      </Toolbar>,
    );
    expect(size('Send')).toBe('lg');
    expect(size('Attach')).toBe('icon-lg');
    expect(size('More')).toBe('icon-lg');
    const toggle = screen.getByRole('button', { name: 'Bold' });
    expect(toggle.className).toContain('size-control-lg');
    expect(toggle.className).not.toContain('size-control-sm');
  });

  it('an explicit size on a child always wins', () => {
    render(
      <Toolbar aria-label="Mixed" size="sm">
        <Button size="lg">Send</Button>
        <Button size="icon-md" aria-label="Square">
          <G />
        </Button>
        <IconButton size="md" aria-label="Voice input">
          <G />
        </IconButton>
        <ToggleButton size="md">Web search</ToggleButton>
        <ToolbarOverflow aria-label="More" size="lg">
          <MenuItem>Clear chat</MenuItem>
        </ToolbarOverflow>
      </Toolbar>,
    );
    expect(size('Send')).toBe('lg');
    expect(size('Square')).toBe('icon-md');
    expect(size('Voice input')).toBe('icon-md');
    expect(size('Web search')).toBe('md');
    expect(size('More')).toBe('icon-lg');
  });

  it('a toggle labelled only through children elements still counts as text', () => {
    render(
      <Toolbar aria-label="T" size="md">
        <ToggleButton icon={<G />}>
          <span>Bookmark</span>
        </ToggleButton>
        <ToggleButton aria-label="Star">
          <G />
        </ToggleButton>
      </Toolbar>,
    );
    expect(size('Bookmark')).toBe('md');
    expect(size('Star')).toBe('icon-md');
  });
});

describe('Without a sized Toolbar, nothing changes', () => {
  it('controls outside any Toolbar keep their defaults, classes included', () => {
    render(
      <>
        <Button>Apply now</Button>
        <IconButton aria-label="Search">
          <G />
        </IconButton>
        <ToggleButton>Bookmark</ToggleButton>
      </>,
    );
    const button = screen.getByRole('button', { name: 'Apply now' });
    expect(button).toHaveAttribute('data-size', 'md');
    expect(button.className).toBe(cn(buttonVariants({ variant: 'primary', size: 'md' })));
    const icon = screen.getByRole('button', { name: 'Search' });
    expect(icon).toHaveAttribute('data-size', 'icon-md');
    expect(icon.className).toBe(cn(buttonVariants({ variant: 'primary', size: 'icon-md' })));
    const toggle = screen.getByRole('button', { name: 'Bookmark' });
    expect(toggle).toHaveAttribute('data-size', 'md');
    expect(toggle.className).toBe(
      cn(buttonVariants({ variant: 'secondary', size: 'md' }), toggleButtonVariants({ size: 'md' })),
    );
  });

  it('`size={null}` on Button still means "no size class"', () => {
    render(
      <Toolbar aria-label="T" size="lg">
        <Button size={null}>Plain</Button>
      </Toolbar>,
    );
    const button = screen.getByRole('button', { name: 'Plain' });
    expect(button).not.toHaveAttribute('data-size');
    expect(button.className).toBe(cn(buttonVariants({ variant: 'primary', size: null })));
  });

  it('an unsized Toolbar renders exactly what explicit defaults render', () => {
    // Rendered on the client (Toolbar's layout effects warn under a React 16
    // server render); generated ids are normalised, everything else must match.
    const tree = (explicit: boolean) =>
      render(
        <Toolbar aria-label="Notes">
          <Button {...(explicit ? { size: 'md' as const } : {})}>Save</Button>
          <IconButton aria-label="Attach" {...(explicit ? { size: 'md' as const } : {})}>
            <G />
          </IconButton>
          <ToggleButton {...(explicit ? { size: 'md' as const } : {})}>Pin</ToggleButton>
          <ToolbarToggle aria-label="Bold">
            <G />
          </ToolbarToggle>
          <ToolbarOverflow aria-label="More" {...(explicit ? { size: 'sm' as const } : {})}>
            <MenuItem>Clear</MenuItem>
          </ToolbarOverflow>
        </Toolbar>,
      ).container.innerHTML.replace(/(id|aria-controls|aria-labelledby)="[^"]*"/g, '$1=""');
    const implicit = tree(false);
    expect(implicit).toBe(tree(true));
    expect(implicit).not.toMatch(/data-slot="toolbar"[^>]*data-size/);
    expect(implicit).toContain('size-control-sm'); // ToolbarToggle stays icon-sm
  });

  it('an unsized Toolbar resets a size cascading from an outer one', () => {
    render(
      <Toolbar aria-label="Outer" size="lg">
        <Toolbar aria-label="Inner">
          <IconButton aria-label="Attach">
            <G />
          </IconButton>
        </Toolbar>
      </Toolbar>,
    );
    expect(size('Attach')).toBe('icon-md');
  });

  it('stops at an overlay: content opened from a sized toolbar keeps its own defaults', () => {
    render(
      <Toolbar aria-label="Message options" size="sm">
        <Popover open>
          <PopoverTrigger asChild>
            <Button variant="tertiary">Model</Button>
          </PopoverTrigger>
          <PopoverContent aria-label="Choose a model">
            <Button>Use this model</Button>
          </PopoverContent>
        </Popover>
      </Toolbar>,
    );
    expect(size('Model')).toBe('sm');
    expect(size('Use this model')).toBe('md');
  });
});

