export default function RefusalCard() {
  return (
    <div className="animate-fade-up rounded-xl border border-amber-300 bg-amber-50 p-4" role="alert" aria-live="polite">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-200 text-amber-900" aria-hidden="true">
          !
        </span>
        <div>
          <div className="font-semibold text-amber-900">
            This question is not covered in the uploaded course materials.
          </div>
          <div className="mt-1 text-sm text-amber-800">
            Try rephrasing your question or refer to a specific lecture.
          </div>
        </div>
      </div>
    </div>
  );
}
