import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Button, TextInput, Card } from '@tremor/react';
import { RiDonutChartFill } from '@remixicon/react';

export function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we're in a password reset flow
    const hash = window.location.hash;
    if (!hash || !hash.includes('type=recovery')) {
      navigate('/login');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      // Password updated successfully
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <RiDonutChartFill
            className="mx-auto size-10 text-gray-50"
            aria-hidden={true}
          />
          <h3 className="mt-4 text-lg font-bold text-gray-50">
            Set New Password
          </h3>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500 rounded text-red-500 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="font-medium">
              New Password
            </label>
            <TextInput
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your new password"
              required
              className="mt-2"
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="font-medium">
              Confirm New Password
            </label>
            <TextInput
              type="password"
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
              required
              className="mt-2"
            />
          </div>

          <Button
            type="submit"
            loading={loading}
            loadingText="Updating password..."
            className="w-full"
          >
            Update Password
          </Button>
        </form>
      </Card>
    </div>
  );
}