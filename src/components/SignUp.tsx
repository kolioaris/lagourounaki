import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Button, TextInput, Card, Checkbox } from '@tremor/react';
import { RiDonutChartFill } from '@remixicon/react';

export function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newsletter, setNewsletter] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            newsletter
          }
        }
      });

      if (error) throw error;
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-1 flex-col justify-center px-4 lg:px-6">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h3 className="mt-6 text-center text-lg font-bold text-gray-50">
          Create new account
        </h3>
      </div>
      <Card className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded text-red-500 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="font-medium">
              Name
            </label>
            <TextInput
              type="text"
              id="name"
              name="name"
              autoComplete="name"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-2"
            />
          </div>
          <div>
            <label htmlFor="email" className="font-medium">
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
            <label htmlFor="password" className="font-medium">
              Password
            </label>
            <TextInput
              type="password"
              id="password"
              name="password"
              autoComplete="new-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-2"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="font-medium">
              Confirm password
            </label>
            <TextInput
              type="password"
              id="confirm-password"
              name="confirm-password"
              autoComplete="new-password"
              placeholder="Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mt-2"
            />
          </div>
          <Button
            type="submit"
            loading={loading}
            loadingText="Creating account..."
            className="mt-4 w-full"
          >
            Create account
          </Button>
          <p className="text-center text-xs text-gray-500">
            By signing in, you agree to our{' '}
            <a
              href="/terms"
              className="capitalize text-blue-500 hover:text-blue-600"
            >
              Terms of use
            </a>{' '}
            and{' '}
            <a
              href="/privacy"
              className="capitalize text-blue-500 hover:text-blue-600"
            >
              Privacy policy
            </a>
          </p>
        </form>
      </Card>
      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <a
          href="/login"
          className="font-medium text-blue-500 hover:text-blue-600"
        >
          Sign in
        </a>
      </p>
    </div>
  );
}
