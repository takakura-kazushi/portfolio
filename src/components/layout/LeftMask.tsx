export function LeftMask() {
  return (
    // border-r border-black で右側に境界線を引きます
    // flex-shrink-0 で、右側のCanvasが大きくなってもこのマスクが縮まないようにします
    <div className="w-[30%] max-w-[400px] min-w-[280px] h-full bg-[#e5e5e5] border-r border-black flex-shrink-0 flex flex-col justify-center px-12 z-20 shadow-[2px_0_10px_rgba(0,0,0,0.05)]">
      
      {/* 上の短い線 */}
      <div className="w-8 h-[1px] bg-black mb-6"></div>
      
      {/* タイトル */}
      <h1 className="text-2xl leading-snug tracking-wider font-light text-black">
        Takakura Kazushi<br />
        Portfolio
      </h1>
      
      {/* 下の短い線 */}
      <div className="w-8 h-[1px] bg-black mt-6"></div>
      
    </div>
  );
}