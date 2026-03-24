export default function SkeletonCard({ lines = 3 }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <div key={i} className={`h-3 bg-gray-100 rounded mb-2 ${i % 2 === 0 ? 'w-full' : 'w-2/3'}`} />
      ))}
    </div>
  );
}
