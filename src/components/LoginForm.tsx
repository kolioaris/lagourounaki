import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Button, TextInput, Card, Divider } from '@tremor/react';
import { RiDonutChartFill, RiGithubFill, RiGoogleFill } from '@remixicon/react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-screen flex-1 flex-col justify-center px-4 lg:px-6">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center space-x-2.5">
          <RiDonutChartFill
            className="size-7 text-gray-50"
            aria-hidden={true}
          />
          <p className="font-medium text-gray-50">
            La Gourounaki
          </p>
        </div>
        <h3 className="mt-6 text-lg font-semibold text-gray-50">
          Sign in to your account
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Don't have an account?{' '}
          <a
            href="/signup"
            className="font-medium text-blue-500 hover:text-blue-600"
          >
            Sign up
          </a>
        </p>
        <div className="mt-8 flex flex-col gap-2">
          <Button 
            variant="secondary" 
            onClick={() => handleSocialLogin('github')}
            className="max-w-[240px] mx-auto w-full"
          >
            <span className="inline-flex items-center gap-2">
              <RiGithubFill className="size-5 shrink-0" aria-hidden={true} />
              Sign in with GitHub
            </span>
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => handleSocialLogin('google')}
            className="max-w-[240px] mx-auto w-full"
          >
            <span className="inline-flex items-center gap-2">
              <RiGoogleFill className="size-4" aria-hidden={true} />
              Sign in with Google
            </span>
          </Button>
        </div>
        <Divider>or</Divider>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded text-red-500 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="text-sm font-medium text-gray-50"
            >
              Email
            </label>
            <TextInput
              type="email"
              id="email"
              name="email"
              autoComplete="email"
              placeholder="john@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-2"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-50"
            >
              Password
            </label>
            <TextInput
              type="password"
              id="password"
              name="password"
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-2"
            />
          </div>
          <Button
            type="submit"
            loading={loading}
            loadingText="Signing in..."
            className="mt-4 w-full"
          >
            Sign in
          </Button>
        </form>
        <p className="mt-6 text-sm text-gray-500">
          Forgot your password?{' '}
          <a
            href="/forgot-password"
            className="font-medium text-blue-500 hover:text-blue-600"
          >
            Reset password
          </a>
        </p>
      </div>
    </div>
  );
}
