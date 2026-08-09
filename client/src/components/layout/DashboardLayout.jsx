import BottomStatusBar from './BottomStatusBar';
import Header from './Header';
import Sidebar from './Sidebar';

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#020d16] text-[#f3f7fa]">
      <Sidebar />
      <main className="min-h-screen bg-[radial-gradient(circle_at_50%_-20%,rgba(0,175,199,.1),transparent_36%),linear-gradient(180deg,#020d16,#03111d)] px-5 pb-4 lg:ml-[260px]">
        <Header />
        {children}
        <BottomStatusBar />
      </main>
    </div>
  );
}
