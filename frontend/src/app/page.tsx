export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-slate-800">
          ClassMind
        </h1>
        <p className="text-slate-600">
          Professor-Controlled AI Learning Platform
        </p>

        <div className="flex gap-4 justify-center">
          <a
            href="/teacher"
            className="px-6 py-3 bg-blue-800 text-white rounded-lg shadow hover:bg-blue-900 transition"
          >
            Continue as Teacher
          </a>

          <a
            href="/student"
            className="px-6 py-3 bg-slate-800 text-white rounded-lg shadow hover:bg-slate-900 transition"
          >
            Continue as Student
          </a>
        </div>
      </div>
    </main>
  );
}