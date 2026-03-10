import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlertIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';
export const Unauthorized: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center space-y-8">
        <ShieldAlertIcon className="mx-auto h-24 w-24 text-red-500" />
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          Access Denied
        </h2>
        <p className="mt-2 text-lg text-gray-600">
          You don't have permission to access this page.
        </p>
        <div className="mt-8">
          <Link to="/">
            <Button variant="primary">Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>);

};