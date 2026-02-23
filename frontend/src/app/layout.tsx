import "./globals.css";
import ModeBadge from "@/components/ModeBadge";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-800">
        <header className="w-full px-8 py-4 bg-white shadow-sm flex justify-between items-center">
          <h1 className="text-xl font-semibold text-blue-900">ClassMind</h1>

          <div className="flex gap-3">
            <ModeBadge label="🧠 Guided Learning" />
            <ModeBadge label="🔒 Source Locked" variant="secondary" />
          </div>
        </header>

        <main className="p-8">{children}</main>
      </body>
    </html>
  );
}
