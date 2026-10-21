"use client";

import SideNav, { NavItem } from "./SideNav";

const ADMIN_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1v-10.5z" },
  { label: "Papers", href: "/admin/papers", icon: "M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1zm7 0v5h5" },
  { label: "Exam Attempts", href: "/admin/attempts", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { label: "Assign Papers", href: "/admin/assign-papers", icon: "M13.8 10.2a4 4 0 005.7 0l2.5-2.5a4 4 0 00-5.7-5.7l-1.4 1.4M10.2 13.8a4 4 0 00-5.7 0l-2.5 2.5a4 4 0 005.7 5.7l1.4-1.4" },
];

export default function AdminNav() {
  return <SideNav navItems={ADMIN_ITEMS} homeHref="/admin/dashboard" settingsHref="/admin/account" fallbackName="Admin" />;
}
