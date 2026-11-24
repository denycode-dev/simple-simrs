import { Theme } from '@astryxdesign/core/theme';
import { themes, defaultThemeSlug } from './astryx-themes';
import { GlobalErrorProvider } from '@/contexts/GlobalErrorContext';
import { GlobalErrorModal } from '@/components/layout/GlobalErrorModal';
import { AuthProvider } from '@/features/auth';
import { AppRouter } from '@/routes';

export function App() {
  return (
    <GlobalErrorProvider>
      <Theme theme={themes[defaultThemeSlug]} mode="light">
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </Theme>
      <GlobalErrorModal />
    </GlobalErrorProvider>
  );
}

export default App;
