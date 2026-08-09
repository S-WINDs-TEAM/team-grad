export function Button({ children, className = '', variant = 'default', ...props }) {
  const variants = {
    default: 'border-[#1d4c62] bg-[#082335] text-[#e8f6f8] hover:border-[#00d5e8]',
    cyan: 'border-[#00afc7] bg-[#063545] text-[#dffcff] hover:bg-[#084a5b]',
    green: 'border-[#15803d] bg-[#0f5627] text-[#dcfce7] hover:bg-[#166534]',
    orange: 'border-[#a16207] bg-[#3e2b07] text-[#fde68a] hover:bg-[#4a3309]',
    red: 'border-[#7f1d1d] bg-[#451517] text-[#fecaca] hover:bg-[#5b1a1d]',
    ghost: 'border-transparent bg-transparent text-[#9aaab6] hover:text-white',
  };
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-[6px] border px-3 py-2 text-sm transition ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
