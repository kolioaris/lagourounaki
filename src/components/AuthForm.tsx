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
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      setView('update_password');
    }

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

  const PasswordInput = (props) => {
    if (props.type !== 'password') return <input {...props} />;

    return (
      <div className="space-y-2">
        <div className="relative">
          <input
            {...props}
            type={showPassword ? 'text' : 'password'}
            className={props.className}
          />
          <PasswordToggle />
        </div>
        {view === 'sign_up' && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={tosAgreed}
              onChange={(e) => {
                setTosAgreed(e.target.checked);
                setError('');
              }}
              className="w-4 h-4 rounded border-gray-600 text-primary-500 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-300">
              I agree to the{' '}
              <a
                href="/terms"
                target="_blank"
                className="text-primary-300 hover:text-primary-200"
                onClick={(e) => {
                  e.preventDefault();
                  window.open('/terms', '_blank');
                }}
              >
                TOS
              </a>
              {' '}and{' '}
              <a
                href="/privacy"
                target="_blank"
                className="text-primary-300 hover:text-primary-200"
                onClick={(e) => {
                  e.preventDefault();
                  window.open('/privacy', '_blank');
                }}
              >
                Privacy Policy
              </a>
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8">
        <h1 className="text-2xl font-bold text-center mb-8 text-white">
          {view === 'update_password' ? 'Set New Password' : 'Welcome'}
        </h1>
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
            },
            className: {
              container: 'text-gray-100',
              button: 'bg-primary-500 hover:bg-primary-600 transition-colors',
              input: 'bg-gray-700 border-gray-600 focus:border-primary-500 focus:ring-primary-500',
              label: 'text-gray-300',
              loader: 'text-primary-500',
              divider: 'bg-gray-700',
              message: view === 'forgotten_password' ? 'text-black' : 'text-gray-100',
            }
          }}
          localization={{
            variables: {
              sign_in: {
                email_label: 'Email',
                password_label: 'Password',
                button_label: 'Sign In',
                loading_button_label: 'Signing in...',
                password_input_placeholder: 'Your password',
                email_input_placeholder: 'Your email',
                forgot_password_label: 'Forgot password?',
                link_text: "Already have an account? Sign in",
              },
              sign_up: {
                email_label: 'Email',
                password_label: 'Password',
                button_label: 'Sign Up',
                loading_button_label: 'Signing up...',
                link_text: "Don't have an account? Sign up",
                confirmation_text: 'Check your email for the confirmation link',
              },
              forgotten_password: {
                email_label: 'Email',
                password_label: 'Password',
                button_label: 'Send Reset Instructions',
                loading_button_label: 'Sending reset instructions...',
                confirmation_text: 'Check your email for the password reset link',
                link_text: 'Forgot your password?'
              },
              update_password: {
                password_label: 'New Password',
                button_label: 'Update Password',
                loading_button_label: 'Updating password...',
                confirmation_text: 'Your password has been updated successfully'
              }
            }
          }}
          customComponents={{
            Input: PasswordInput
          }}
        />
      </div>
    </div>
  );
}