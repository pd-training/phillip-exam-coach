"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import BrandLockup from "./BrandLockup";

const SIDEBAR_KEY = "student-sidebar";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1v-10.5z" },
  { label: "Progress", href: "/dashboard/attempts", icon: "M4 19V10m6 9V5m6 14v-7m6 7V8" },
  { label: "Quick Guide", href: "/guide", icon: "M4 5a2 2 0 012-2h12v16H6a2 2 0 00-2 2V5zm0 0v16" },
];

export default function StudentNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const fullName = session?.user?.name || "Student";
  const email = session?.user?.email || "";
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  // Restore the desktop sidebar preference. Mobile always starts closed.
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)").matches;
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(SIDEBAR_KEY);
    } catch {
      stored = null;
    }
    setOpen(desktop ? stored !== "closed" : false);
  }, []);

  // Pushes page content right of the sidebar on desktop (see globals.css)
  useEffect(() => {
    if (open) document.body.dataset.sidebar = "open";
    else delete document.body.dataset.sidebar;
    return () => {
      delete document.body.dataset.sidebar;
    };
  }, [open]);

  // Close the sidebar on mobile, and the user menu, when moving to another page
  useEffect(() => {
    if (!window.matchMedia("(min-width: 768px)").matches) setOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  // Close the user menu on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const toggleSidebar = () => {
    setOpen((prev) => {
      const next = !prev;
      if (window.matchMedia("(min-width: 768px)").matches) {
        try {
          window.localStorage.setItem(SIDEBAR_KEY, next ? "open" : "closed");
        } catch {
          // Storage can be blocked; the toggle still works for this page
        }
      }
      return next;
    });
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const handleLogout = async () => {
    await signOut({ redirect: false });
    window.location.href = "/login";
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        } ${open ? "md:flex" : "md:hidden"}`}
        aria-label="Student navigation"
      >
        <div className="h-16 flex items-center px-5 border-b border-gray-100">
          <BrandLockup href="/dashboard" variant="dark" stacked />
        </div>
        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  active ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile backdrop */}
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-slate-900/40"
        />
      )}

      {/* Top bar */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-expanded={open}
            aria-label={open ? "Hide sidebar" : "Show sidebar"}
            className="p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path strokeLinecap="round" d="M9 4v16" />
            </svg>
          </button>
          {/* Logo shows in the top bar whenever the sidebar is hidden */}
          {!open && <BrandLockup href="/dashboard" variant="dark" />}
        </div>

        {/* User menu: name shows, hover or focus reveals full name, email, Settings and Log out */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className="flex items-center gap-3 rounded-full pl-1 pr-3 py-1 hover:bg-gray-100 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-900 text-white text-xs font-semibold">
              {initials || "S"}
            </span>
            <span className="text-sm font-medium text-gray-900 max-w-[10rem] truncate">{fullName}</span>
          </button>

          {menuOpen && (
          <div role="menu" className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-gray-200 bg-white shadow-lg z-50">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900 truncate">{fullName}</p>
              {email && <p className="text-xs text-gray-500 truncate mt-0.5">{email}</p>}
            </div>
            <div className="py-1">
              <Link role="menuitem" href="/account" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900">
                Settings
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              >
                Log out
              </button>
            </div>
          </div>
          )}
        </div>
      </header>
    </>
  );
}
