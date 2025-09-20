// Premium SaaS Color System for DevMeet AI
// Sophisticated color palette designed for professional technical hiring platform

export const colors = {
  // Primary Brand Colors - Deep Tech Blues
  primary: {
    50: '#f0f9ff',   // Very light blue
    100: '#e0f2fe',  // Light blue
    200: '#bae6fd',  // Soft blue
    300: '#7dd3fc',  // Medium light blue
    400: '#38bdf8',  // Bright blue
    500: '#0ea5e9',  // Primary blue
    600: '#0284c7',  // Dark blue
    700: '#0369a1',  // Darker blue
    800: '#075985',  // Deep blue
    900: '#0c4a6e',  // Very deep blue
    950: '#082f49'   // Darkest blue
  },

  // Secondary - Tech Purple
  secondary: {
    50: '#faf5ff',   // Very light purple
    100: '#f3e8ff',  // Light purple
    200: '#e9d5ff',  // Soft purple
    300: '#d8b4fe',  // Medium light purple
    400: '#c084fc',  // Bright purple
    500: '#a855f7',  // Primary purple
    600: '#9333ea',  // Dark purple
    700: '#7c3aed',  // Darker purple
    800: '#6b21a8',  // Deep purple
    900: '#581c87',  // Very deep purple
    950: '#3b0764'   // Darkest purple
  },

  // Accent - Success Green
  accent: {
    50: '#ecfdf5',   // Very light green
    100: '#d1fae5',  // Light green
    200: '#a7f3d0',  // Soft green
    300: '#6ee7b7',  // Medium light green
    400: '#34d399',  // Bright green
    500: '#10b981',  // Primary green
    600: '#059669',  // Dark green
    700: '#047857',  // Darker green
    800: '#065f46',  // Deep green
    900: '#064e3b',  // Very deep green
    950: '#022c22'   // Darkest green
  },

  // Warning - Amber
  warning: {
    50: '#fffbeb',   // Very light amber
    100: '#fef3c7',  // Light amber
    200: '#fde68a',  // Soft amber
    300: '#fcd34d',  // Medium light amber
    400: '#fbbf24',  // Bright amber
    500: '#f59e0b',  // Primary amber
    600: '#d97706',  // Dark amber
    700: '#b45309',  // Darker amber
    800: '#92400e',  // Deep amber
    900: '#78350f',  // Very deep amber
    950: '#451a03'   // Darkest amber
  },

  // Error - Rose
  error: {
    50: '#fff1f2',   // Very light rose
    100: '#ffe4e6',  // Light rose
    200: '#fecdd3',  // Soft rose
    300: '#fda4af',  // Medium light rose
    400: '#fb7185',  // Bright rose
    500: '#f43f5e',  // Primary rose
    600: '#e11d48',  // Dark rose
    700: '#be123c',  // Darker rose
    800: '#9f1239',  // Deep rose
    900: '#881337',  // Very deep rose
    950: '#4c0519'   // Darkest rose
  },

  // Neutral Grays - Cool toned for tech feel
  neutral: {
    50: '#f8fafc',   // Very light gray
    100: '#f1f5f9',  // Light gray
    200: '#e2e8f0',  // Soft gray
    300: '#cbd5e1',  // Medium light gray
    400: '#94a3b8',  // Medium gray
    500: '#64748b',  // Primary gray
    600: '#475569',  // Dark gray
    700: '#334155',  // Darker gray
    800: '#1e293b',  // Deep gray
    900: '#0f172a',  // Very deep gray
    950: '#020617'   // Darkest gray
  },

  // Background colors for different sections
  background: {
    main: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #312e81 50%, #1e293b 75%, #0f172a 100%)',
    card: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(49, 46, 129, 0.2) 50%, rgba(30, 41, 59, 0.4) 100%)',
    glassmorphism: 'backdrop-blur-xl bg-white/5 border border-white/10',
    overlay: 'rgba(15, 23, 42, 0.8)'
  },

  // Gradient combinations for different components
  gradients: {
    primary: 'linear-gradient(135deg, #0ea5e9 0%, #a855f7 100%)',
    secondary: 'linear-gradient(135deg, #a855f7 0%, #f43f5e 100%)',
    success: 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)',
    warning: 'linear-gradient(135deg, #f59e0b 0%, #f43f5e 100%)',
    feature1: 'linear-gradient(135deg, #0ea5e9 0%, #7c3aed 50%, #a855f7 100%)',
    feature2: 'linear-gradient(135deg, #a855f7 0%, #f43f5e 50%, #f59e0b 100%)',
    feature3: 'linear-gradient(135deg, #10b981 0%, #0ea5e9 50%, #7c3aed 100%)',
    feature4: 'linear-gradient(135deg, #f59e0b 0%, #f43f5e 50%, #a855f7 100%)',
    cta: 'linear-gradient(135deg, #0ea5e9 0%, #7c3aed 25%, #a855f7 50%, #f43f5e 75%, #f59e0b 100%)',
    navigation: 'linear-gradient(90deg, rgba(30, 41, 59, 0.6) 0%, rgba(49, 46, 129, 0.4) 50%, rgba(30, 41, 59, 0.6) 100%)'
  },

  // Shadows for depth
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    glow: '0 0 20px rgba(14, 165, 233, 0.3)',
    glowPurple: '0 0 20px rgba(168, 85, 247, 0.3)',
    glowGreen: '0 0 20px rgba(16, 185, 129, 0.3)'
  }
};

// Utility functions for dynamic color generation
export const getGradientByIndex = (index: number): string => {
  const gradients = [
    colors.gradients.feature1,
    colors.gradients.feature2,
    colors.gradients.feature3,
    colors.gradients.feature4
  ];
  return gradients[index % gradients.length];
};

export const getColorByStatus = (status: string) => {
  switch (status) {
    case 'active':
    case 'completed':
    case 'hired':
      return colors.accent[500];
    case 'pending':
    case 'scheduled':
    case 'in-progress':
      return colors.warning[500];
    case 'rejected':
    case 'cancelled':
    case 'failed':
      return colors.error[500];
    default:
      return colors.neutral[400];
  }
};

export const getGradientByStatus = (status: string) => {
  switch (status) {
    case 'active':
    case 'completed':
    case 'hired':
      return colors.gradients.success;
    case 'pending':
    case 'scheduled':
    case 'in-progress':
      return colors.gradients.warning;
    case 'rejected':
    case 'cancelled':
    case 'failed':
      return colors.gradients.secondary;
    default:
      return colors.gradients.primary;
  }
};