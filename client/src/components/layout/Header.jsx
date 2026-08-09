import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Bell, ChevronDown, Settings } from 'lucide-react';
import { notifications } from '../../data/dashboard';
import { Tooltip } from '../ui/Tooltip';

function MenuContent({ children }) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content align="end" sideOffset={12} className="z-[900] min-w-64 rounded-[7px] border border-[#17384b] bg-[#061725] p-2 text-sm text-[#d8e8ee] shadow-2xl">
        {children}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  );
}

export default function Header() {
  return (
    <header className="flex h-[86px] items-center justify-between">
      <div className="flex items-center gap-4 text-[19px]">
        <span className="text-white">Dashboard</span>
        <span className="text-[#647786]">&gt;</span>
        <span className="text-white">Fleet Dispatch</span>
      </div>

      <div className="flex items-center gap-6">
        <DropdownMenu.Root>
          <Tooltip label="Notifications">
            <DropdownMenu.Trigger asChild>
              <button type="button" className="relative text-[#b9c5ce] hover:text-white" aria-label="Open notifications">
                <Bell className="h-7 w-7" strokeWidth={1.8} />
                <span className="absolute -right-2 -top-3 grid h-6 w-6 place-items-center rounded-full bg-[#dc2626] text-xs font-bold text-white">3</span>
              </button>
            </DropdownMenu.Trigger>
          </Tooltip>
          <MenuContent>
            {notifications.map((item) => (
              <DropdownMenu.Item key={item} className="rounded px-3 py-2 outline-none hover:bg-[#09283b]">{item}</DropdownMenu.Item>
            ))}
          </MenuContent>
        </DropdownMenu.Root>

        <Tooltip label="Settings">
          <button type="button" className="text-[#b9c5ce] hover:text-white" aria-label="Open settings">
            <Settings className="h-7 w-7" strokeWidth={1.8} />
          </button>
        </Tooltip>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button type="button" className="flex items-center gap-4 text-white" aria-label="Open admin menu">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-[#056275] text-lg text-[#aaf8ff] shadow-[0_0_24px_rgba(0,175,199,.3)]">AD</span>
              <span className="text-lg">Admin</span>
              <ChevronDown className="h-5 w-5 text-[#9aaab6]" />
            </button>
          </DropdownMenu.Trigger>
          <MenuContent>
            {['Profile', 'Account Settings', 'Logout'].map((item) => (
              <DropdownMenu.Item key={item} className="rounded px-3 py-2 outline-none hover:bg-[#09283b]">{item}</DropdownMenu.Item>
            ))}
          </MenuContent>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
