import type { ReactNode } from 'react';

export type AppProvidersProps = { children: ReactNode };

export const AppProviders = ({ children }: AppProvidersProps) => {
  return <>{children}</>;
};
