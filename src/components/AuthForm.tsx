import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

export function AuthForm() {
  const [view, setView] = useState('sign_in');
  const [showPassword, setShowPassword] = useState(false);
  const [tosAgreed, setTosAgreed] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleViewChange = (newView) => {
    setView(newView);
    setError('');
  };

  const PasswordToggle = () => (
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
    >
      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
    </button>
  );

  const Input = (props) => {
    if (props.type !== 'password') return <input {...props} />;

    return (
      <div className="relative">
        <input
          {...props}
          type={showPassword ? 'text' : 'password'}
          className={props.className}
        />
        <PasswordToggle />
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8">
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded text-red-500 text-sm">
            {error}
          </div>
        )}
        <Auth
          supabaseClient={supabase}
          view={view}
          showLinks={true}
          providers={[]}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#213555',
                  brandAccent: '#476FA7',
                  inputBackground: '#374151',
                  inputBorder: '#4B5563',
                  inputText: '#F3F4F6',
                  inputPlaceholder: '#9CA3AF',
                  backgroundSecondary: '#1f2937',
                  backgroundPrimary: '#111827',
                }
              }
            },
            style: {
              button: {
                borderRadius: '0.5rem',
                padding: '0.625rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                height: 'auto',
                backgroundColor: '#213555',
                color: 'white',
                border: '2px solid #1a2942',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: '#476FA7',
                  border: '2px solid #7593BD',
                },
                '&:disabled': {
                  opacity: '0.5',
                  cursor: 'not-allowed',
                  backgroundColor: '#213555',
                  border: '2px solid #1a2942',
                }
              },
              input: {
                borderRadius: '0.5rem',
                padding: '0.625rem 1rem',
                fontSize: '0.875rem',
                paddingRight: '2.5rem',
              },
              anchor: {
                color: '#7593BD',
                textDecoration: 'none',
              },
              message: {
                color: '#692229',
                fontSize: '0.875rem',
                marginBottom: '0.5rem',
              },
              label: {
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
              },
              divider: {
                backgroundColor: '#4B5563',
                margin: '1.5rem 0',
                position: 'relative',
                '&::after': {
                  content: '"or"',
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: '#1f2937',
                  padding: '0 0.5rem',
                  color: '#9CA3AF',
                  fontSize: '0.875rem',
                }
              }
            }
          }
          }
          localization={{
            variables: {
              sign_in: {
                email_label: 'Email',
                password_label: 'Password',
                button_label: 'Sign In',
                loading_button_label: 'Signing in...',
                password_input_placeholder: 'Your password',
                email_input_placeholder: 'Your email',
                link_text: "Already have an account? Sign in",
              },
              sign_up: {
                email_label: 'Email',
                password_label: 'Password',
                button_label: 'Sign Up',
                loading_button_label: 'Signing up...',
                link_text: "Don't have an account? Sign up",
              }
            }
          }}
          customComponents={{
            Input
          }}
          onViewChange={handleViewChange}
          submitButtonDisabled={view === 'sign_up' && !tosAgreed}
        />
        {view === 'sign_up' && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              id="tos-checkbox"
              checked={tosAgreed}
              onChange={(e) => setTosAgreed(e.target.checked)}
              className="h-4 w-4 rounded border-gray-600 text-primary-500 focus:ring-primary-500"
            />
            <label htmlFor="tos-checkbox">
              I agree to the{' '}
              <a
                href="/terms-of-service"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-500 hover:underline"
              >
                TOS and Privacy Policy
              </a>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
