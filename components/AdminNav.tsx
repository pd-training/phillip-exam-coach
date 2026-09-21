'use client';

import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';

export default function AdminNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    { label: 'Dashboard', href: '/admin/dashboard' },
    { label: 'Papers', href: '/admin/papers' },
    { label: 'Users', href: '/admin/users' },
  ];

  const handleLogout = async () => {
    const loginUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/login`;
    await signOut({ redirect: true, callbackUrl: loginUrl });
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Navigation Links */}
        <div className="flex gap-8">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition ${
                pathname === item.href
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Right side - Account, Name & Logout */}
        <div className="flex items-center gap-6">
          <a
            href="/admin/account"
            className={`text-sm font-medium transition ${
              pathname === '/admin/account'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Account
          </a>
          <span className="text-sm font-medium text-gray-900">
            {session?.user?.name || 'Admin'}
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
