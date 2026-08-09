import { ChevronRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { navItems } from '../../data/dashboard';

function WindLogo() {
  return (
    <div className="relative h-11 w-11">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="absolute left-1/2 top-1/2 h-2 w-8 origin-left rounded-full bg-[#00d5e8]"
          style={{ transform: `rotate(${i * 60}deg) translateX(2px)`, opacity: 0.95 - i * 0.09 }}
        />
      ))}
      <span className="absolute left-[14px] top-[14px] h-3 w-3 rounded-full bg-[#03121e]" />
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[260px] border-r border-[#123044] bg-[#03121e] lg:flex lg:flex-col">
      <div className="flex h-[112px] items-center gap-3 px-6">
        <WindLogo />
        <div>
          <div className="text-[25px] font-black leading-6 tracking-wide text-[#00afc7]">S-WINDS</div>
          <div className="text-sm text-[#9aaab6]">Fleet Intelligence</div>
        </div>
      </div>

      <nav className="mt-1 flex-1 space-y-4">
        {navItems.map(({ href, label, icon: Icon }) => (
          <NavLink
            key={href}
            to={href}
            className={({ isActive }) =>
              `relative flex h-[64px] items-center gap-4 px-7 text-[17px] transition ${
                isActive ? 'bg-[#074355] text-white' : 'text-[#9aaab6] hover:bg-[#061725] hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute left-0 top-0 h-full w-1 bg-[#00d5e8]" />}
                <Icon className={`h-7 w-7 ${isActive ? 'text-[#35e6f4]' : 'text-[#9aaab6]'}`} strokeWidth={1.8} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mb-8 flex items-center gap-3 px-7 text-sm text-[#d8f8de]">
        <span className="h-4 w-4 rounded-full bg-[#22c55e] shadow-[0_0_14px_rgba(34,197,94,.55)]" />
        <span className="flex-1">All Systems Operational</span>
        <ChevronRight className="h-4 w-4 text-[#9aaab6]" />
      </div>
    </aside>
  );
}
