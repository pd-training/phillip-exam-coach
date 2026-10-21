"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import BrandLockup from './BrandLockup';

export default function StudentNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Progress', href: '/dashboard/attempts' },
    { label: 'Quick Guide', href: '/guide' },
  ];

  // Close the mobile menu when the student moves to another page
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const handleLogout = async () => {
    await signOut({ redirect: false });
    window.location.href = '/login';
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
        <div className="flex items-center gap-10">
          <BrandLockup href="/dashboard" variant="dark" />
          {/* Desktop navigation links */}
          <div className="hidden md:flex gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition ${
                  isActive(item.href) ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Desktop account area */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/account"
            className={`text-sm font-medium transition ${
              pathname === '/account' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
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

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="student-mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="md:hidden p-2 -mr-2 text-gray-700 hover:text-gray-900"
        >
          {open ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu panel */}
      {open && (
        <div id="student-mobile-menu" className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-6 py-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block py-3 text-base font-medium border-b border-gray-100 ${
                  isActive(item.href) ? 'text-blue-600' : 'text-gray-700'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/account"
              className={`block py-3 text-base font-medium border-b border-gray-100 ${
                pathname === '/account' ? 'text-blue-600' : 'text-gray-700'
              }`}
            >
              Account
            </Link>
          </div>
          <div className="px-6 py-4 flex items-center justify-between bg-gray-50">
            <span className="text-sm font-medium text-gray-900">{session?.user?.name || 'Student'}</span>
            <button onClick={handleLogout} className="text-sm font-medium text-blue-600 hover:text-blue-700">
              Log out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
