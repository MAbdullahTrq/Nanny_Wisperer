import { type HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  image?: string | null;
  imageAlt?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Card({
  image,
  imageAlt = '',
  footer,
  children,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`
        overflow-hidden rounded-xl border border-light-green/40 bg-off-white
        shadow-sm transition-shadow hover:shadow-md
        ${className}
      `}
      {...props}
    >
      {image && (
        <div className="aspect-video w-full overflow-hidden bg-light-pink/50">
          <img
            src={image}
            alt={imageAlt}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="p-4">{children}</div>
      {footer && (
        <div className="border-t border-light-green/30 bg-light-pink/20 px-4 py-3">
          {footer}
        </div>
      )}
    </div>
  );
}
