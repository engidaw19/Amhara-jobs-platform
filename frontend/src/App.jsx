import { AuthProvider } from './context/AuthContext';
import { LangProvider } from './context/LangContext';
import { ToastProvider } from './components/Toast';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <AuthProvider>
      <LangProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </LangProvider>
    </AuthProvider>
  );
}
