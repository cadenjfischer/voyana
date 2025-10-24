'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';

export default function UserProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/sign-in');
        return;
      }
      setUser(user);
      setEmail(user.email || '');
      setLoading(false);
    });
  }, []);

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      setMessage('Check your new email to confirm the change.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update email');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h1>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Email
                </label>
                <p className="text-gray-900">{user?.email}</p>
              </div>

              <form onSubmit={handleUpdateEmail} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Update Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#078FA5] focus:border-[#078FA5]"
                  />
                </div>

                {message && (
                  <div className={`rounded-md p-4 ${message.includes('Check') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    <p className="text-sm">{message}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={updating || email === user?.email}
                  className="w-full bg-[#078FA5] hover:bg-[#065a6b] text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? 'Updating...' : 'Update Email'}
                </button>
              </form>

              <div className="pt-6 border-t border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Account Information</h2>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">User ID</dt>
                    <dd className="text-sm text-gray-900 font-mono">{user?.id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                    <dd className="text-sm text-gray-900">
                      {new Date(user?.created_at).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
