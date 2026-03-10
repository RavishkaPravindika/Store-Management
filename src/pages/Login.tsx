import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter } from
'../components/ui/Card';
import { PackageIcon } from 'lucide-react';
export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate(from, {
        replace: true
      });
    }
  }, [user, navigate, from]);
  const handleMockGoogleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !name) {
      setError('Please provide both email and name for the mock login.');
      return;
    }
    setIsLoading(true);
    try {
      await loginWithGoogle(email, name);
      navigate(from, {
        replace: true
      });
    } catch (err) {
      setError('Failed to log in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  const loginAsSuperAdmin = () => {
    setEmail('ravishkapravinsika99@gmail.com');
    setName('Super Admin');
  };
  const loginAsAdmin = () => {
    setEmail('admin@example.com');
    setName('Store Admin');
  };
  const loginAsUser = () => {
    setEmail('user@example.com');
    setName('Store User');
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <PackageIcon className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Sign in to StoreSync
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Multi-Tenant Store & Inventory Management
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Mock Google Authentication</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleMockGoogleLogin} className="space-y-4">
              {error &&
              <div
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
                role="alert">

                  <span className="block sm:inline">{error}</span>
                </div>
              }

              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required />


              <Input
                label="Full Name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required />


              <Button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                isLoading={isLoading}>

                Sign in with Google (Mock)
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex-col gap-2 bg-gray-50">
            <p className="text-xs text-gray-500 mb-2 font-medium">
              Quick Login (For Testing):
            </p>
            <div className="flex flex-wrap gap-2 w-full">
              <Button
                variant="secondary"
                size="sm"
                onClick={loginAsSuperAdmin}
                className="flex-1 text-xs">

                Super Admin
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={loginAsAdmin}
                className="flex-1 text-xs">

                Admin
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={loginAsUser}
                className="flex-1 text-xs">

                User
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>);

};