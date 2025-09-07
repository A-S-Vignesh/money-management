// src/components/LayoutWrapper.tsx
"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/landingcomponents/Navbar";
import Footer from "@/landingcomponents/Footer";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");
  const isLogin = pathname.startsWith("/login");

   const hideLayout = isDashboard || isLogin;

  return (
    <>
      {!isDashboard && !isLogin && <Navbar />}
      {children}
      {!isDashboard && !isLogin && <Footer />}
    </>
  );
}
