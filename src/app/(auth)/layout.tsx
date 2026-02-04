import { STORE_INFO } from '@/lib/data';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-primary py-4">
        <div className="container mx-auto px-4">
          <a href="/" className="text-2xl font-script text-white">
            {STORE_INFO.name}
          </a>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} {STORE_INFO.name}. All rights reserved.</p>
      </footer>
    </div>
  );
}
