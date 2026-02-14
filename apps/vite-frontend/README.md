# Vite Frontend Boilerplate

A modern, fully-typed, and scalable frontend boilerplate built with:

- Vite
- React
- TypeScript
- Tailwind CSS
- React Hook Form
- Zod
- React Query
- react-i18next (i18n, English + 中文)

---

## Features

- API integration layer using **React Query**
- Built-in **form validation** with Zod + React Hook Form
- Strong typing throughout
- Tailwind + Radix UI components
- Localization with react-i18next (English, 中文)

## Examples

See the codebase for examples using Zod, React Hook Form, React Query, and react-i18next.

---

## Build Configuration

### Production Optimization

The Vite build is optimized for production with code splitting strategy:

```typescript
// vite.config.ts
build: {
  target: 'es2022',
  sourcemap: false,
  minify: 'esbuild',
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom', 'react-router-dom'],
        'vendor-radix': ['@radix-ui/...'],
        'vendor-query': ['@tanstack/react-query', '@tanstack/react-query-devtools'],
      },
    },
  },
}
```

**Benefits:**

- Reduces initial bundle size by splitting vendor code
- Enables better browser caching (vendor chunks rarely change)
- Improves loading performance for end users

**Customization:**

- Adjust `manualChunks` if you add large dependencies
- Consider splitting by route for larger applications
- Target can be adjusted based on browser support requirements
