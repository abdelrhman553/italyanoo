
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'new-job' | 'portal' | 'products' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'new-job' | 'portal' | 'products' | 'settings') => void;
  isAdmin: boolean;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, isAdmin, onLogout }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="italian-flag-divider w-full fixed top-0 z-[60]" />
      
      <header className="logo-gradient text-white sticky top-0 z-50 shadow-lg border-b border-white/10 pt-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-inner overflow-hidden border-2 border-emerald-500 transition-transform group-hover:rotate-12">
                 <span className="text-italiano-blue font-black text-2xl italic tracking-tighter">ITALI</span>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-red-600 text-[10px] px-1 rounded font-bold">ANO</div>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight leading-none">
                ITALI<span className="text-red-500 italic">ANO</span>
              </h1>
              <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest mt-1">Workshop Management</p>
            </div>
          </div>
          
          <nav className="flex gap-1 bg-black/20 p-1 rounded-xl overflow-x-auto max-w-full no-scrollbar">
            {isAdmin && (
              <>
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-4 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-white text-italiano-blue shadow-lg' : 'text-white/70 hover:text-white'}`}
                >
                  الرئيسية
                </button>
                <button 
                  onClick={() => setActiveTab('new-job')}
                  className={`px-4 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap ${activeTab === 'new-job' ? 'bg-white text-italiano-blue shadow-lg' : 'text-white/70 hover:text-white'}`}
                >
                  فحص جديد
                </button>
              </>
            )}
            <button 
              onClick={() => setActiveTab('portal')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap ${activeTab === 'portal' ? 'bg-emerald-500 text-white shadow-lg' : 'text-white/70 hover:text-white'}`}
            >
              بوابة العميل
            </button>
            <button 
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap ${activeTab === 'products' ? 'bg-white text-italiano-blue shadow-lg' : 'text-white/70 hover:text-white'}`}
            >
              المتجر
            </button>
            {isAdmin && (
              <button 
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap ${activeTab === 'settings' ? 'bg-gray-800 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
              >
                ⚙️
              </button>
            )}
            {isAdmin && (
              <button onClick={onLogout} className="px-3 py-2 text-white/50 hover:text-red-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-right">
          <div>
            <h4 className="font-black text-italiano-blue mb-2 italic">ITALIANO Motorcycles</h4>
            <p className="text-xs text-gray-500 font-bold leading-relaxed">أول كوبري العمرانية | 01225822202</p>
          </div>
          <div className="flex flex-col items-center">
            <h4 className="font-black text-gray-800 mb-2 italic tracking-widest uppercase text-[10px]">Thinking of the power</h4>
            <div className="italian-flag-divider w-24 rounded-full" />
          </div>
          <div className="flex flex-col items-center md:items-end">
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">&copy; {new Date().getFullYear()} ايطاليانو - جميع الحقوق محفوظة</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
