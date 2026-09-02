# Task: Vite + Tailwind CSS + shadcn/ui Setup

## Metadata
- **Priority:** P0 - Critical
- **Deadline:** 2026-09-04
- **Status:** TODO
- **Assignee:** TBD
- **Tags:** frontend, tooling, ui, required
- **Dependencies:** 01-project-setup-group-contract.md, 03-graphify-architecture-artifacts.md
- **Estimated Effort:** 3h

## Requirements

- Modern frontend build tool (Vite)
- Utility-first CSS (Tailwind CSS)
- Accessible component library (shadcn/ui)

## User Stories

- As a frontend developer, I want a shared accessible UI foundation so that feature branches can build consistent screens without editing the scaffold.
- As a user, I want the interface to work on the required demo viewport sizes so that the presentation is reliable.
- Fast development experience
- Production-ready build output

## Design

### Tech Stack

```
Build Tool:     Vite 6.x
CSS Framework:  Tailwind CSS 4.x
Components:     shadcn/ui (Radix UI primitives)
Icons:          Lucide React
Animation:      tailwindcss-animate
```

### Project Structure

```
src/frontend/
├── src/
│   ├── components/
│   │   └── ui/           # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── select.tsx
│   │       ├── table.tsx
│   │       ├── badge.tsx
│   │       ├── avatar.tsx
│   │       ├── dropdown-menu.tsx
│   │       └── ...
│   ├── lib/
│   │   └── utils.ts      # cn() utility
│   └── ...
├── components.json       # shadcn/ui config
├── tailwind.config.js
├── postcss.config.js
└── vite.config.ts
```

### shadcn/ui Installation

```bash
# Initialize shadcn/ui
npx shadcn@latest init

# Add components as needed
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add select
npx shadcn@latest add table
npx shadcn@latest add badge
npx shadcn@latest add avatar
npx shadcn@latest add dropdown-menu
npx shadcn@latest add form
npx shadcn@latest add label
npx shadcn@latest add tabs
npx shadcn@latest add toast
npx shadcn@latest add skeleton
```

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
      },
    },
  },
});
```

### Tailwind Configuration

```javascript
// tailwind.config.js
import tailwindAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [tailwindAnimate],
};
```

### CSS Variables (src/index.css)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### Utility Function (src/lib/utils.ts)

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## Tasks

- [ ] Initialize Vite React TypeScript project
- [ ] Install and configure Tailwind CSS
- [ ] Setup shadcn/ui with components.json
- [ ] Install core shadcn/ui components
- [ ] Configure path aliases in vite.config.ts
- [ ] Setup CSS variables for theming
- [ ] Create cn() utility function
- [ ] Configure Vite proxy for API calls
- [ ] Add dark mode support
- [ ] Test component rendering

## Done Criteria

- [ ] Vite dev server starts correctly
- [ ] Tailwind classes are applied
- [ ] shadcn/ui components render properly
- [ ] Path aliases work (@/components)
- [ ] API proxy is configured
- [ ] Dark mode toggle works
- [ ] Hot module replacement works
- [ ] Production build succeeds

## Notes

- Use `npx shadcn@latest add <component>` to add new components
- shadcn/ui components are copied into your project, not installed as a package
- You can customize the components after adding them
- Use the `cn()` utility for merging Tailwind classes

## Questions to Resolve

- [ ] Which shadcn/ui components do we need initially?
- [ ] Should we use dark mode from the start?
- [ ] Custom color palette or default shadcn colors?
