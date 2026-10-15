'use client';

import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import BrandLockup from './BrandLockup';

export default function StudentNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'My Progress', href: '/dashboard/attempts' },
    { label: 'Explore', href: '/explore' },
    { label: 'Help', href: '/help' },
  ];

  const handleLogout = async () => {
    await signOut({ redirect: false });
    window.location.href = '/login';
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <BrandLockup href="/dashboard" variant="dark" />
        {/* Navigation Links */}
        <div className="flex gap-8">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition ${
                  isActive
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        </div>

        {/* Right side - Account, Name & Logout */}
        <div className="flex items-center gap-6">
          <Link
            href="/account"
            className={`text-sm font-medium transition ${
              pathname === '/account'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Account
          </Link>
          <span className="text-sm font-medium text-gray-900">
            {session?.user?.name || 'Student'}
          </span>
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}
