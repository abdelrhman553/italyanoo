
import React, { useState, useMemo, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import JobCard from './components/JobCard';
import { Job, ServiceStatus, ServiceType, InvoiceItem, Product, SubscriptionTier, SubscriptionRequest } from './types';
import { askItalyanoAI } from './services/geminiService';

const STORAGE_KEY = 'italiano_workshop_jobs';
const PRICE_KEY = 'italiano_price_config';
const PRODUCTS_KEY = 'italiano_products_list';
const ADMIN_KEY = 'italiano_is_admin';
const SUB_REQUESTS_KEY = 'italiano_sub_requests';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'new-job' | 'portal' | 'products' | 'settings'>('portal');
  const [isAdmin, setIsAdmin] = useState(false);
  const [pin, setPin] = useState('');
  const [showLogin, setShowLogin] = useState(false);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [searchPlate, setSearchPlate] = useState('');
  const [subscriptionRequests, setSubscriptionRequests] = useState<SubscriptionRequest[]>([]);
  const [showSubModal, setShowSubModal] = useState<{tier: SubscriptionTier, label: string} | null>(null);
  const [subForm, setSubForm] = useState({ name: '', phone: '', plate: '' });
  const [subSuccess, setSubSuccess] = useState(false);
  
  const [priceConfig, setPriceConfig] = useState<string>(`
- غيار زيت شل: ٤٥٠ جنيه
- غيار زيت موبيل: ٥٠٠ جنيه
- تيل فرامل أمامى: ٢٥٠ جنيه
- تيل فرامل خلفى: ٢٠٠ جنيه
  `.trim());

  const [products, setProducts] = useState<Product[]>([
    { id: '1', name: 'زيت شل Advance', price: 450, category: 'زيوت', image: 'https://images.unsplash.com/photo-1635843104300-8809452b4676?q=80&w=400&auto=format&fit=crop', description: 'أفضل حماية لمحرك الموتوسيكل' },
    { id: '2', name: 'تيل فرامل أمامى بريمبو', price: 350, category: 'قطع غيار', image: 'https://images.unsplash.com/photo-1486326704275-cd27415d1fe5?q=80&w=400&auto=format&fit=crop', description: 'أداء فرملة استثنائي' }
  ]);

  const [newJob, setNewJob] = useState<Partial<Job>>({
    status: ServiceStatus.INSPECTING,
    serviceType: ServiceType.IN_SHOP,
    items: [],
    totalCost: 0,
    technicianNotes: '',
    client: { id: '', name: '', phone: '', model: '', dateIn: new Date().toISOString().split('T')[0], licensePlate: '', address: '' },
    inspection: {
      front: { handlebar: '', frontFork: '', tireRim: '', brakeSystem: '', lightsDashboard: '' },
      rear: { tireRim: '', suspension: '', exhaust: '', brakes: '', tailLight: '' },
      engine: { rightCover: '', leftCover: '', coolingSystem: '', performance: '' },
      driveSystem: { frontSprocket: '', rearSprocket: '', chain: '' }
    }
  });

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{role: 'user'|'bot', text: string}[]>([
    {role: 'bot', text: 'أهلاً بك في ايطاليانو! ابحث برقم لوحتك لتعرف حالة الصيانة والاشتراكات.'}
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedJobs = localStorage.getItem(STORAGE_KEY);
    if (savedJobs) setJobs(JSON.parse(savedJobs));
    const savedPrices = localStorage.getItem(PRICE_KEY);
    if (savedPrices) setPriceConfig(savedPrices);
    const savedProds = localStorage.getItem(PRODUCTS_KEY);
    if (savedProds) setProducts(JSON.parse(savedProds));
    const savedSubs = localStorage.getItem(SUB_REQUESTS_KEY);
    if (savedSubs) setSubscriptionRequests(JSON.parse(savedSubs));
    const adminSession = localStorage.getItem(ADMIN_KEY);
    if (adminSession === 'true') setIsAdmin(true);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    localStorage.setItem(SUB_REQUESTS_KEY, JSON.stringify(subscriptionRequests));
    localStorage.setItem(ADMIN_KEY, isAdmin.toString());
  }, [jobs, products, subscriptionRequests, isAdmin]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234') { 
      setIsAdmin(true);
      setShowLogin(false);
      setActiveTab('dashboard');
      setPin('');
    } else {
      alert('كلمة السر خطأ!');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setActiveTab('portal');
    localStorage.removeItem(ADMIN_KEY);
  };

  const handleSubscriptionRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showSubModal) return;
    const newReq: SubscriptionRequest = {
      id: Math.random().toString(36).substr(2, 6).toUpperCase(),
      clientName: subForm.name,
      phone: subForm.phone,
      licensePlate: subForm.plate,
      tier: showSubModal.tier,
      date: new Date().toLocaleDateString('ar-EG'),
      status: 'pending'
    };
    setSubscriptionRequests([newReq, ...subscriptionRequests]);
    setSubSuccess(true);
    setTimeout(() => {
      setShowSubModal(null);
      setSubSuccess(false);
      setSubForm({ name: '', phone: '', plate: '' });
    }, 3000);
  };

  const updateSubStatus = (id: string, status: 'completed' | 'cancelled') => {
    setSubscriptionRequests(subscriptionRequests.map(req => 
      req.id === id ? { ...req, status } : req
    ));
  };

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    const jobToAdd: Job = { 
      ...newJob, 
      id: Math.random().toString(36).substr(2, 6).toUpperCase()
    } as Job;
    setJobs([jobToAdd, ...jobs]);
    setActiveTab('dashboard');
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, {role: 'user', text: userMsg}]);
    setChatInput('');
    setIsTyping(true);
    const botResponse = await askItalyanoAI(userMsg, priceConfig);
    setChatMessages(prev => [...prev, {role: 'bot', text: botResponse}]);
    setIsTyping(false);
  };

  const clientHistory = useMemo(() => {
    if (!searchPlate) return [];
    return jobs
      .filter(j => j.client.licensePlate.trim().includes(searchPlate.trim()))
      .sort((a, b) => new Date(b.client.dateIn).getTime() - new Date(a.client.dateIn).getTime());
  }, [searchPlate, jobs]);

  const passportData = useMemo(() => {
    if (clientHistory.length === 0) return null;
    const totalSpent = clientHistory.reduce((sum, job) => sum + job.totalCost, 0);
    const lastJob = clientHistory[0];
    const visitCount = clientHistory.length;
    return { totalSpent, lastJob, visitCount };
  }, [clientHistory]);

  const subscriptions = [
    { tier: SubscriptionTier.SILVER, price: 1500, label: 'فضي', benefits: ['٤ غيارات زيت شل', 'فحص شامل مجاني', 'غسيل موتور مرتين'] },
    { tier: SubscriptionTier.GOLD, price: 3500, label: 'ذهبي', benefits: ['٨ غيارات زيت شل', 'تيل فرامل أمامى مجاني', 'خدمة الونش لمرة واحدة', 'غسيل دوري'] },
    { tier: SubscriptionTier.PLATINUM, price: 7000, label: 'بلاتينيوم', benefits: ['زيوت لا محدودة لسنة', 'تغيير فلاتر مجاني', 'أولوية في الورشة', 'خدمة الونش ٤ مرات', 'تلميع كامل'] }
  ];

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={isAdmin} onLogout={handleLogout}>
      {activeTab === 'portal' ? (
        <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700">
           <div className="logo-gradient text-white p-12 rounded-[4rem] shadow-2xl text-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <h2 className="text-5xl font-black italic tracking-tighter uppercase">Benvenuto!</h2>
            <p className="text-emerald-300 font-black italic uppercase tracking-widest text-xs">ايطاليانو - البروفايل الرقمي لمكنتك</p>
            <input 
              type="text" 
              placeholder="أدخل رقم اللوحة (مثلاً: أ ب ج ١٢٣)" 
              className="w-full max-w-xl p-6 rounded-[2rem] bg-white text-italiano-blue font-black text-center text-2xl shadow-inner focus:ring-8 focus:ring-emerald-400/30 outline-none transition-all" 
              value={searchPlate} 
              onChange={(e) => setSearchPlate(e.target.value)} 
            />
          </div>
          
          {searchPlate && passportData ? (
            <div className="space-y-10 animate-in slide-in-from-bottom-10">
              <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 flex flex-col md:flex-row">
                 <div className="logo-gradient text-white p-10 md:w-1/3 flex flex-col justify-between relative">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-white to-red-500"></div>
                    <div>
                       <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-2 italic">Motorcycle Passport</h3>
                       <p className="text-4xl font-black italic tracking-tighter">{passportData.lastJob.client.model}</p>
                       <p className="text-xl font-bold text-gray-300 mt-2">{searchPlate}</p>
                    </div>
                    <div className="mt-8 pt-8 border-t border-white/10">
                       <p className="text-xs font-black text-gray-400 uppercase">الرقم التعريفي للمكنة</p>
                       <p className="font-mono text-sm">ITA-PAS-ID-{passportData.lastJob.id}</p>
                    </div>
                 </div>
                 <div className="p-10 flex-grow grid grid-cols-2 gap-8">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-gray-400 uppercase">إجمالي الزيارات</p>
                       <p className="text-3xl font-black italic text-gray-800">{passportData.visitCount}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-gray-400 uppercase">إجمالي المنصرف</p>
                       <p className="text-3xl font-black italic text-emerald-600">{passportData.totalSpent} <small className="text-xs">ج.م</small></p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-gray-400 uppercase">آخر صيانة</p>
                       <p className="text-xl font-black italic text-gray-700">{passportData.lastJob.client.dateIn}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-gray-400 uppercase">الحالة الفنية</p>
                       <p className="text-xl font-black italic text-italiano-blue uppercase">Excellent</p>
                    </div>
                 </div>
              </div>
            </div>
          ) : (
             <div className="space-y-12">
               <div className="text-center space-y-4">
                  <h3 className="text-4xl font-black italic text-italiano-blue uppercase tracking-tighter">Maintenance Subscriptions</h3>
                  <div className="italian-flag-divider w-24 mx-auto" />
                  <p className="font-bold text-gray-500">اشتراكات ايطاليانو السنوية - اختار باقتك واحنا هنبلغ صاحب المركز فوراً</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
                     {subscriptions.map(sub => (
                        <div key={sub.tier} className={`p-8 rounded-[3rem] shadow-xl border-t-8 flex flex-col h-full transition-all hover:scale-105 ${sub.tier === SubscriptionTier.PLATINUM ? 'border-red-500 bg-white shadow-2xl ring-4 ring-red-50' : 'border-gray-200 bg-gray-50'}`}>
                           <h4 className="text-2xl font-black italic mb-2">{sub.label}</h4>
                           <div className="text-3xl font-black text-emerald-600 mb-6 italic">{sub.price} <small className="text-xs">ج.م / سنة</small></div>
                           <ul className="text-right space-y-3 mb-8 flex-grow">
                              {sub.benefits.map((b, i) => (
                                 <li key={i} className="text-xs font-bold text-gray-600 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    {b}
                                 </li>
                              ))}
                           </ul>
                           <button 
                            onClick={() => setShowSubModal({ tier: sub.tier, label: sub.label })}
                            className={`w-full py-5 rounded-2xl font-black italic text-sm shadow-lg transform transition active:scale-95 ${sub.tier === SubscriptionTier.PLATINUM ? 'logo-gradient text-white' : 'bg-italiano-blue text-white'}`}
                           >
                            اشترك الآن
                           </button>
                        </div>
                     ))}
                  </div>
               </div>
             </div>
          )}
        </div>
      ) : isAdmin && activeTab === 'dashboard' ? (
        <div className="space-y-10 animate-in slide-in-from-top-4">
          <div className="logo-gradient p-10 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between shadow-2xl gap-6">
             <div className="flex items-center gap-6">
                <div className="bg-white/20 p-5 rounded-3xl backdrop-blur-md">
                   <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1-1v10a1 1 0 001 1h1m8-1a1 1 0 011 1v2a1 1 0 01-1 1m-1-4h.01M21 16V9a5 5 0 00-5-5h-3v12m5-3h.01m-4 3h.01"></path></svg>
                </div>
                <div>
                   <h2 className="text-4xl font-black italic uppercase tracking-tighter">Workshop Control</h2>
                   <p className="text-emerald-400 font-bold italic tracking-widest text-xs uppercase">ايطاليانو - لوحة إدارة المركز</p>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Maintenance Jobs Column */}
            <div className="lg:col-span-2 space-y-6">
               <h3 className="text-xl font-black italic text-gray-800 border-r-8 border-italiano-blue pr-4 uppercase">حالات الصيانة ({jobs.length})</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {jobs.map(job => <JobCard key={job.id} job={job} onClick={(j) => setSelectedJob(j)} />)}
               </div>
            </div>

            {/* Subscription Requests Column */}
            <div className="space-y-6">
               <h3 className="text-xl font-black italic text-red-600 border-r-8 border-red-500 pr-4 uppercase">طلبات الاشتراك ({subscriptionRequests.filter(r => r.status === 'pending').length})</h3>
               <div className="space-y-4">
                  {subscriptionRequests.filter(r => r.status === 'pending').map(req => (
                     <div key={req.id} className="bg-white p-6 rounded-[2.5rem] shadow-lg border border-red-100 space-y-4 animate-pulse-slow">
                        <div className="flex justify-between items-start">
                           <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase">طلب جديد</p>
                              <h4 className="font-black italic text-gray-800">{req.clientName}</h4>
                              <p className="text-xs font-bold text-italiano-blue">{req.phone}</p>
                           </div>
                           <span className="bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase italic">{req.tier}</span>
                        </div>
                        <p className="text-xs font-bold text-gray-500">رقم اللوحة: {req.licensePlate}</p>
                        <div className="flex gap-2">
                           <button onClick={() => updateSubStatus(req.id, 'completed')} className="flex-1 bg-emerald-500 text-white py-2 rounded-xl text-[10px] font-black uppercase">تم التواصل</button>
                           <button onClick={() => updateSubStatus(req.id, 'cancelled')} className="flex-1 bg-gray-100 text-gray-400 py-2 rounded-xl text-[10px] font-black uppercase">إلغاء</button>
                        </div>
                     </div>
                  ))}
                  {subscriptionRequests.filter(r => r.status === 'pending').length === 0 && (
                     <div className="bg-gray-100/50 p-10 rounded-[2.5rem] text-center border-2 border-dashed border-gray-200">
                        <p className="text-xs font-bold text-gray-400 italic">لا توجد طلبات اشتراك جديدة</p>
                     </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'products' ? (
        <div className="space-y-12 animate-in zoom-in duration-500">
          <div className="text-center space-y-2">
            <h2 className="text-6xl font-black italic tracking-tighter text-italiano-blue uppercase">Store Catalog</h2>
            <div className="italian-flag-divider w-24 mx-auto mb-4" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map(prod => (
              <div key={prod.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl group border border-gray-100 hover:shadow-2xl transition-all relative">
                <div className="h-64 overflow-hidden relative">
                   <img src={prod.image} alt={prod.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                   <div className="absolute top-4 right-4 bg-italiano-blue text-white px-4 py-1 rounded-full text-[10px] font-black italic shadow-lg uppercase">{prod.category}</div>
                </div>
                <div className="p-6 space-y-3">
                  <h3 className="text-2xl font-black italic text-gray-800">{prod.name}</h3>
                  <p className="text-xs font-bold text-gray-400 leading-relaxed italic line-clamp-2">{prod.description}</p>
                  <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                    <span className="text-3xl font-black text-emerald-600 italic tracking-tighter">{prod.price} <small className="text-sm">ج.م</small></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'new-job' ? (
        <div className="max-w-4xl mx-auto bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100">
          <h2 className="text-3xl font-black italic mb-8 border-b-4 border-italiano-blue pb-4 uppercase">New Record</h2>
          <form onSubmit={handleCreateJob} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input required type="text" placeholder="اسم العميل" className="w-full border-2 p-4 rounded-2xl focus:border-italiano-blue outline-none font-bold bg-gray-50" value={newJob.client?.name} onChange={(e) => setNewJob({...newJob, client: {...newJob.client!, name: e.target.value}})} />
              <input required type="tel" placeholder="رقم الموبايل" className="w-full border-2 p-4 rounded-2xl focus:border-italiano-blue outline-none font-bold bg-gray-50" value={newJob.client?.phone} onChange={(e) => setNewJob({...newJob, client: {...newJob.client!, phone: e.target.value}})} />
              <input required type="text" placeholder="الموديل" className="w-full border-2 p-4 rounded-2xl focus:border-italiano-blue outline-none font-bold bg-gray-50" value={newJob.client?.model} onChange={(e) => setNewJob({...newJob, client: {...newJob.client!, model: e.target.value}})} />
              <input required type="text" placeholder="رقم اللوحة" className="w-full border-2 p-4 rounded-2xl focus:border-italiano-blue outline-none font-black text-center bg-gray-50" value={newJob.client?.licensePlate} onChange={(e) => setNewJob({...newJob, client: {...newJob.client!, licensePlate: e.target.value}})} />
            </div>
            <button type="submit" className="w-full logo-gradient text-white font-black py-6 rounded-[2rem] shadow-xl italic uppercase text-2xl">حفظ في السجل</button>
          </form>
        </div>
      ) : null}

      {/* Subscription Request Modal */}
      {showSubModal && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
           <div className="bg-white rounded-[3rem] p-10 w-full max-w-md shadow-2xl text-center space-y-6 animate-in zoom-in duration-300 relative">
              {!subSuccess ? (
                <>
                  <div className="w-20 h-20 logo-gradient text-white rounded-full flex items-center justify-center mx-auto shadow-xl">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black italic text-gray-800">طلب اشتراك {showSubModal.label}</h2>
                    <p className="font-bold text-gray-400 italic">املأ البيانات وصاحب المركز هيتواصل معاك</p>
                  </div>
                  <form onSubmit={handleSubscriptionRequest} className="space-y-4">
                    <input required type="text" placeholder="اسمك الكامل" className="w-full p-4 rounded-2xl bg-gray-100 font-bold outline-none border-2 focus:border-italiano-blue" value={subForm.name} onChange={(e) => setSubForm({...subForm, name: e.target.value})} />
                    <input required type="tel" placeholder="رقم الموبايل" className="w-full p-4 rounded-2xl bg-gray-100 font-bold outline-none border-2 focus:border-italiano-blue" value={subForm.phone} onChange={(e) => setSubForm({...subForm, phone: e.target.value})} />
                    <input required type="text" placeholder="رقم اللوحة" className="w-full p-4 rounded-2xl bg-gray-100 font-black text-center outline-none border-2 focus:border-italiano-blue" value={subForm.plate} onChange={(e) => setSubForm({...subForm, plate: e.target.value})} />
                    <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setShowSubModal(null)} className="flex-1 bg-gray-100 text-gray-500 font-black py-4 rounded-2xl uppercase italic">إلغاء</button>
                      <button type="submit" className="flex-1 logo-gradient text-white font-black py-4 rounded-2xl shadow-lg italic uppercase">إرسال الطلب</button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="py-12 space-y-4">
                  <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <h3 className="text-3xl font-black italic text-emerald-600">Grazie!</h3>
                  <p className="font-bold text-gray-500">تم إرسال طلبك بنجاح لمركز ايطاليانو. استنى مكالمتنا!</p>
                </div>
              )}
           </div>
        </div>
      )}

      {/* Admin Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
           <div className="bg-white rounded-[3rem] p-12 w-full max-w-md shadow-2xl text-center space-y-8 animate-in zoom-in duration-300">
              <div className="w-20 h-20 logo-gradient text-white rounded-full flex items-center justify-center mx-auto shadow-xl">
                 <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              </div>
              <h2 className="text-3xl font-black italic text-gray-800 uppercase">Owner Access</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                 <input type="password" placeholder="••••" className="w-full p-6 rounded-2xl bg-gray-100 text-center text-3xl font-black tracking-[0.5em] focus:ring-4 focus:ring-italiano-blue/20 outline-none" value={pin} onChange={(e) => setPin(e.target.value)} autoFocus />
                 <button type="submit" className="w-full logo-gradient text-white font-black py-4 rounded-2xl shadow-lg italic uppercase">دخول</button>
                 <button type="button" onClick={() => setShowLogin(false)} className="w-full text-xs font-bold text-gray-400 pt-2">إغلاق</button>
              </form>
           </div>
        </div>
      )}

      {/* Selected Job / Passport View */}
      {selectedJob && (
        <div className="fixed inset-0 z-[60] bg-italiano-blue/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
           <div className="bg-white rounded-[3.5rem] w-full max-w-4xl shadow-2xl relative my-auto overflow-hidden animate-in zoom-in duration-300">
              <button onClick={() => setSelectedJob(null)} className="absolute top-8 left-8 p-3 bg-gray-100 rounded-full z-20"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
              
              <div className="p-12 space-y-10">
                 <div className="flex justify-between items-end border-b-4 border-gray-100 pb-8">
                    <div>
                      <h3 className="text-5xl font-black italic text-gray-900 tracking-tighter uppercase">{selectedJob.client.model}</h3>
                      <p className="font-black text-italiano-blue italic text-xl mt-2">{selectedJob.client.licensePlate}</p>
                    </div>
                    <div className="text-left">
                       <p className="text-[10px] font-black text-gray-400 uppercase">Service Date</p>
                       <p className="text-2xl font-black italic text-gray-800">{selectedJob.client.dateIn}</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-4">
                       <h4 className="font-black italic text-italiano-blue uppercase text-sm border-l-4 border-italiano-blue pl-4">Customer Info</h4>
                       <div className="bg-gray-50 p-8 rounded-[2.5rem] space-y-4 shadow-inner">
                          <p className="font-bold flex justify-between"><span>الاسم:</span> <span className="text-gray-900">{selectedJob.client.name}</span></p>
                          <p className="font-bold flex justify-between"><span>الحالة:</span> <span className={`italic font-black ${selectedJob.status === ServiceStatus.READY ? 'text-emerald-600' : 'text-amber-500'}`}>{selectedJob.status}</span></p>
                       </div>
                    </div>
                    <div className="space-y-4">
                       <h4 className="font-black italic text-italiano-blue uppercase text-sm border-l-4 border-italiano-blue pl-4">Cost Summary</h4>
                       <div className="bg-gray-50 p-8 rounded-[2.5rem] space-y-4 shadow-inner">
                          <div className="flex justify-between font-black text-3xl text-italiano-blue italic">
                             <span className="text-xs text-gray-400 self-center uppercase">TOTAL</span>
                             <span>{selectedJob.totalCost} ج.م</span>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Floating Chat */}
      <div className={`fixed bottom-6 left-6 z-[100] transition-all duration-500 ${isChatOpen ? 'w-[350px] h-[550px]' : 'w-18 h-18'}`}>
        {!isChatOpen ? (
          <button onClick={() => setIsChatOpen(true)} className="w-full h-full logo-gradient text-white rounded-full shadow-[0_15px_40px_rgba(11,74,153,0.4)] flex items-center justify-center hover:scale-110 transition-transform">
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
          </button>
        ) : (
          <div className="w-full h-full bg-white rounded-[3rem] shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-20">
            <div className="logo-gradient p-6 text-white flex justify-between items-center">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-white/20 rounded-full animate-pulse"></div>
                 <p className="font-black text-sm italic">ايطاليانو AI</p>
               </div>
               <button onClick={() => setIsChatOpen(false)}><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>
            <div className="flex-grow p-5 overflow-y-auto space-y-4 bg-gray-50/50">
               {chatMessages.map((msg, i) => (
                 <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[85%] p-4 rounded-[1.5rem] text-xs font-bold leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-italiano-blue text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border'}`}>
                     {msg.text}
                   </div>
                 </div>
               ))}
               {isTyping && <div className="text-[10px] font-black text-emerald-500 italic animate-pulse px-4">ايطاليانو يجهز الرد...</div>}
               <div ref={chatEndRef} />
            </div>
            <div className="p-4 bg-white border-t flex gap-2">
               <input type="text" placeholder="اسأل المساعد الذكي..." className="flex-grow bg-gray-100 p-4 rounded-2xl text-xs font-bold outline-none focus:bg-white transition-colors" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} />
               <button onClick={handleSendMessage} className="bg-italiano-blue text-white w-12 h-12 rounded-2xl shadow-lg flex items-center justify-center hover:scale-105 transition-transform"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg></button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default App;
