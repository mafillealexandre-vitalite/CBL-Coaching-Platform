/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        /* Legacy aliases kept for existing components */
        brand: '#0EA5E9',
        'brand-dim': '#0284C7',
        danger: '#EF4444',
        warn: '#F59E0B',
        success: '#10B981',
        surface: '#FFFFFF',
        'surface-2': '#F0EFE9',
        'surface-3': '#E2E8F0',
        border: '#CBD5E1',
        'text-primary': '#0F1923',
        'text-muted': '#4A5568',
        'text-faint': '#94A3B8',
        /* Premium Slate system */
        'bg-base':     '#F0EFE9',
        'bg-surface':  '#FFFFFF',
        'bg-elevated': '#FAFAF8',
        'bg-inverse':  '#1A2332',
        'accent-cyan':   '#0EA5E9',
        'accent-amber':  '#F59E0B',
        'accent-green':  '#10B981',
        'accent-red':    '#EF4444',
        'accent-purple': '#8B5CF6',
      },
      fontFamily: {
        display: ['"DM Sans"', '"Inter"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      letterSpacing: {
        tighter: '-0.03em',
        tight: '-0.015em',
      },
      boxShadow: {
        card:  '0 1px 3px rgba(15,25,35,0.08), 0 4px 16px rgba(15,25,35,0.06)',
        modal: '0 8px 40px rgba(15,25,35,0.16)',
      },
      backgroundImage: {
        'grid-pattern': "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230F1923' fill-opacity='0.025'%3E%3Cpath d='M0 0h40v1H0zM0 0v40h1V0z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
      animation: {
        'pulse-slow':  'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in':     'fadeIn 0.4s ease-out',
        'slide-up':    'slideUp 0.4s ease-out',
        'scale-in':    'scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        'pulse-ring':  'pulseRing 1.5s ease-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:   { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        scaleIn:   { from: { opacity: 0, transform: 'scale(0.85)' }, to: { opacity: 1, transform: 'scale(1)' } },
        pulseRing: { '0%': { transform: 'scale(0.85)', opacity: 1 }, '100%': { transform: 'scale(1.4)', opacity: 0 } },
      },
    },
  },
  plugins: [],
}
