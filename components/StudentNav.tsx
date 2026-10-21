"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import BrandLockup from "./BrandLockup";

const SIDEBAR_KEY = "student-sidebar";
const DESKTOP_QUERY = "(min-width: 768px)";

// Remembers the desktop sidebar choice across page changes. Each page renders its
// own StudentNav, so without this the sidebar would start expanded on every click
// and then collapse, which looked like flickering.
let sidebarCache: boolean | null = null;

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1v-10.5z" },
  { label: "Progress", href: "/dashboard/attempts", icon: "M4 19V10m6 9V5m6 14v-7m6 7V8" },
  { label: "Quick Guide", href: "/guide", icon: "M4 5a2 2 0 012-2h12v16H6a2 2 0 00-2 2V5zm0 0v16" },
];

export default function StudentNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  // Desktop: sidebar expanded (labels) or collapsed to an icon rail
  const [expanded, setExpanded] = useState<boolean>(() => sidebarCache ?? true);
  // Mobile: sidebar drawer open or closed
  const [drawer, setDrawer] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);

  const fullName = session?.user?.name || "Student";
  const email = session?.user?.email || "";
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  // Restore the desktop preference and keep track of the screen size
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const sync = () => setIsDesktop(mq.matches);
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(SIDEBAR_KEY);
    } catch {
      stored = null;
    }
    const value = stored !== "collapsed";
    sidebarCache = value;
    setExpanded(value);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Tells globals.css how far to push page content on desktop
  useEffect(() => {
    document.body.dataset.sidebar = expanded ? "open" : "collapsed";
    return () => {
      delete document.body.dataset.sidebar;
    };
  }, [expanded]);

  // Close the mobile drawer and the user menu when moving to another page
  useEffect(() => {
    setDrawer(false);
    setMenuOpen(false);
  }, [pathname]);

  // Position the user menu under its button. It is drawn in a portal so page
  // containers with overflow hidden cannot clip it.
  const openMenu = () => {
    const rect = menuButtonRef.current?.getBoundingClientRect();
    if (rect) setMenuPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    setMenuOpen(true);
  };
  const closeMenu = () => setMenuOpen(false);

  // Close on outside click, Escape, or scroll/resize (keeps the menu anchored)
  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuButtonRef.current?.contains(target) || menuPanelRef.current?.contains(target)) return;
      closeMenu();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeMenu();
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", closeMenu);
    window.addEventListener("scroll", closeMenu, true);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [menuOpen]);

  const toggleSidebar = () => {
    if (window.matchMedia(DESKTOP_QUERY).matches) {
      setExpanded((prev) => {
        const next = !prev;
        sidebarCache = next;
        try {
          window.localStorage.setItem(SIDEBAR_KEY, next ? "expanded" : "collapsed");
        } catch {
          // Storage can be blocked; the toggle still works for this page
        }
        return next;
      });
    } else {
      setDrawer((prev) => !prev);
    }
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const handleLogout = async () => {
    await signOut({ redirect: false });
    window.location.href = "/login";
  };

  // On desktop the labels and logo hide when collapsed; on mobile they always show
  const labelClass = expanded ? "" : "md:hidden";
  const collapsedLinkClass = expanded ? "" : "md:justify-center md:px-0";

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 ${
          drawer ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 ${expanded ? "md:w-60" : "md:w-16"}`}
        aria-label="Student navigation"
      >
        <div className={`h-16 flex items-center border-b border-gray-100 ${expanded ? "px-5" : "md:justify-center md:px-0 px-5"}`}>
          <div className={labelClass}>
            <BrandLockup href="/dashboard" variant="dark" stacked />
          </div>
        </div>
        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={expanded ? undefined : item.label}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${collapsedLinkClass} ${
                  active ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                <span className={labelClass}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile backdrop */}
      {drawer && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setDrawer(false)}
          className="md:hidden fixed inset-0 z-40 bg-slate-900/40"
        />
      )}

      {/* Top bar */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-expanded={isDesktop ? expanded : drawer}
            aria-label={
              isDesktop
                ? expanded
                  ? "Collapse sidebar"
                  : "Expand sidebar"
                : drawer
                ? "Close menu"
                : "Open menu"
            }
            className="p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path strokeLinecap="round" d="M9 4v16" />
            </svg>
          </button>
          {/* On mobile the logo shows in the top bar while the drawer is closed */}
          {!drawer && <div className="md:hidden"><BrandLockup href="/dashboard" variant="dark" /></div>}
        </div>

        {/* User menu: click the name to open Settings and Log out */}
        <div className="relative">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => (menuOpen ? closeMenu() : openMenu())}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className="flex items-center gap-3 rounded-full pl-1 pr-3 py-1 hover:bg-gray-100 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-900 text-white text-xs font-semibold">
              {initials || "S"}
            </span>
            <span className="text-sm font-medium text-gray-900 max-w-[10rem] truncate">{fullName}</span>
          </button>

          {menuOpen && menuPos && createPortal(
            <div
              ref={menuPanelRef}
              role="menu"
              style={{ top: menuPos.top, right: menuPos.right }}
              className="fixed w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white shadow-lg z-[60]"
            >
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
            </div>,
            document.body
          )}
        </div>
      </header>
    </>
  );
}
