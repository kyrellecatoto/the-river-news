export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      <div className="h-16 bg-[#111111] border-b border-[#222222]" />
      <div className="flex-grow max-w-[1400px] mx-auto w-full px-4 md:px-8 py-8">
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#667eea]"></div>
        </div>
      </div>
    </div>
  );
}