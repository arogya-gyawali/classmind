export default function RefusalCard() {
  return (
    <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
      <div className="flex items-start gap-3">
        <div className="text-2xl">⚠️</div>
        <div>
          <div className="font-semibold text-amber-800">
            This question is not covered in the uploaded course materials.
          </div>
          <div className="text-sm text-amber-700 mt-1">
            Try rephrasing your question or refer to a specific lecture.
          </div>
        </div>
      </div>
    </div>
  );
}
