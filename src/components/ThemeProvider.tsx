// components/ThemeProvider.tsx
//
// Thin wrapper around next-themes that locks in:
// - attribute="class"  → toggles `.dark` on <html> (matches our Tailwind v4
//   @custom-variant dark in globals.css)
// - defaultTheme="system" + enableSystem → "system" follows the OS
// - disableTransitionOnChange → no transition flash when the user flips themes
//
// Dark mode is reserved for the in-app dashboard. Marketing pages (home,
// features, pricing, legal, etc.) and the login screen are forced to light
// so they don't render half-dark / half-light when the OS is in dark mode.
// next-themes' forcedTheme prop strips the `.dark` class on those routes,
// so `dark:` Tailwind variants simply don't fire there.

"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { usePathname } from "next/navigation";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isApp = pathname?.startsWith("/dashboard") ?? false;

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      forcedTheme={isApp ? undefined : "light"}
    >
      {children}
    </NextThemesProvider>
  );
}
