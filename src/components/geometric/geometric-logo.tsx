export function GeometricLogo() {
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-3 w-3 rounded-full border border-bauhaus-black bg-bauhaus-red" />
      <div className="h-3 w-3 border border-bauhaus-black bg-bauhaus-blue" />
      <div className="h-0 w-0 border-b-[10px] border-l-[6px] border-r-[6px] border-b-bauhaus-yellow border-l-transparent border-r-transparent drop-shadow-[0_1px_0_black]" />
      <span className="ml-1 font-black uppercase tracking-tighter text-xl">RunEase</span>
    </div>
  );
}
