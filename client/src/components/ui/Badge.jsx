const tones = {
  green: 'border-[#155f35] bg-[#0e3f25] text-[#84f6aa]',
  orange: 'border-[#7c5208] bg-[#37270b] text-[#facc15]',
  red: 'border-[#7f1d1d] bg-[#451717] text-[#ff8a8a]',
  cyan: 'border-[#0b6576] bg-[#083744] text-[#72f3ff]',
};

export function Badge({ children, tone = 'cyan', className = '' }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-[5px] border px-2.5 py-1 text-xs ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}
