import { AppProviders } from './AppProviders';
import { AppRouter } from './AppRouter';
import './theme.css';

export const App = () => {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
};
