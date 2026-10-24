import { AnimatedReveal } from './animated-reveal';

export const AnimatedMessage = ({
  message,
  className,
  role = 'status',
}: {
  message: string;
  className?: string;
  role?: 'status' | 'alert';
}) => (
  <AnimatedReveal open={Boolean(message)} contentKey={message}>
    <div className={className} role={role}>
      {message}
    </div>
  </AnimatedReveal>
);
