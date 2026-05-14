// Wrapper container dengan padding konsisten di semua halaman
export default function Container({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto w-full max-w-6xl px-8 sm:px-12 lg:px-20 ${className}`}
    >
      {children}
    </div>
  );
}
