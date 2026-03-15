export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fcfaf6]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#d7ccc8] border-t-[#4e342e] rounded-full animate-spin" />
        <p className="text-[#6d4c41] text-sm">Loading...</p>
      </div>
    </div>
  );
}
