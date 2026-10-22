"use client";

import SideNav, { NavItem } from "./SideNav";

const STUDENT_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1v-10.5z" },
  { label: "Progress", href: "/dashboard/attempts", icon: "M4 19V10m6 9V5m6 14v-7m6 7V8" },
];

export default function StudentNav() {
  return <SideNav navItems={STUDENT_ITEMS} homeHref="/dashboard" settingsHref="/account" fallbackName="Student" />;
}
