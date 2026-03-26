import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { ToastContainer } from "react-toastify";

export const metadata: Metadata = {
  title: "CodeMentor AI",
  description: "A project made with loves",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
      >
        <AuthProvider>
          <ToastContainer
          position="top-right"
          autoClose={1500}
           />
          {children}
        </AuthProvider>

      </body>
    </html>
  );
}
