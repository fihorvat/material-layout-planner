import { AppProviders } from './AppProviders';
import { EditorPage } from '@/features/editor/EditorPage';
import './theme.css';

export const App = () => {
  return (
    <AppProviders>
      <EditorPage />
    </AppProviders>
  );
};
