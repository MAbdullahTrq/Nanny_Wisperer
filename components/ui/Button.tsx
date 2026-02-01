import { type ButtonHTMLAttributes, forwardRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-dark-green text-off-white hover:bg-dark-green/90 border border-dark-green',
  secondary:
    'bg-light-green text-pastel-black hover:bg-light-green/80 border border-light-green',
  ghost:
    'bg-transparent text-dark-green hover:bg-light-green/40 border border-transparent',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', children, className = '', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        className={`
          inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium
          transition-colors focus:outline-none focus:ring-2 focus:ring-dark-green/50 focus:ring-offset-2
          disabled:opacity-50 disabled:pointer-events-none
          ${variantStyles[variant]}
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
