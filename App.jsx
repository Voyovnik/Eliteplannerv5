import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, Utensils, Dumbbell, BarChart, User, Plus, ImageIcon, 
  Play, Square, Save, Edit2, Trash2, Clock, ChevronLeft, ChevronRight,
  Youtube, Activity, Target, Sparkles, CheckCircle2, X, Camera, FolderPlus, Flame,
  Pause, Scale, History, Info, RefreshCw, ChevronRightSquare, BookOpen, Filter, TrendingDown, TrendingUp
} from 'lucide-react';

// --- API & AI HELPERS (WITH SMART SIMULATION) ---
// Google'a para ödememek için burayı BOŞ bırakıyoruz. Sistem otomatik olarak Simülasyon AI'ye geçecek!
const apiKey = ""; 

const callGemini = async (prompt, imageBase64 = null) => {
  // --- AKILLI SİMÜLASYON (OFFLINE AI) ---
  const mockResponse = () => {
    if (prompt.includes("Yemeği/Metni analiz et")) {
       return JSON.stringify({
         cal: Math.floor(Math.random() * 200) + 300,
         pro: Math.floor(Math.random() * 20) + 15,
         carb: Math.floor(Math.random() * 30) + 20,
         fat: Math.floor(Math.random() * 15) + 5,
         fiber: Math.floor(Math.random() * 8) + 2,
         sugar: Math.floor(Math.random() * 10) + 2,
         comment: "Yapay Zeka (Simülasyon): Bu öğün oldukça dengeli görünüyor! Akyapı'da ofiste geçen uzun bir gün için ideal bir enerji kaynağı. Özellikle protein oranı kas onarımı için harika."
       });
    } else if (prompt.includes("Trend Analizi") || prompt.includes("karşılaştır")) {
       return "Yapay Zeka (Simülasyon): Geçen döneme göre karbonhidrat alımını çok daha iyi dengelemişsin! Kondisyon antrenmanlarına sadık kalıp masa başı satış işinin getirdiği hareketsizliği bu şekilde kırmaya devam et. Harika gidiyorsun!";
    } else {
       return "Yapay Zeka Koçu (Simülasyon): Hedefine odaklanmış durumdasın. Her gün takım elbise giyip o stresi yönetmek kolay değil ama disiplinin bunu aşıyor. Unutma: Eat less, Work hard, Move more and Smile!";
    }
  };

  // Eğer API key yoksa direkt simülasyonu çalıştır (1.5 saniye bekleme efektiyle)
  if (!apiKey || apiKey.trim() === "") {
    await new Promise(r => setTimeout(r, 1500)); 
    return mockResponse();
  }

  // --- GERÇEK API BAĞLANTISI ---
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const contents = [{ parts: [{ text: prompt }] }];
  if (imageBase64) {
    const base64Data = imageBase64.split(',')[1] || imageBase64;
    contents[0].parts.push({ inlineData: { mimeType: "image/jpeg", data: base64Data } });
  }
  const payload = { contents };
  const retries = [1000, 2000];
  
  for (let i = 0; i < retries.length; i++) {
    try {
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error('API Request Failed');
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || mockResponse();
    } catch (err) {
      if (i === retries.length - 1) return mockResponse(); // Hata verirse çökmek yerine yine simülasyonu ver
      await new Promise(resolve => setTimeout(resolve, retries[i]));
    }
  }
};

// --- CONSTANTS & DUMMY DATA ---
const DIET_TYPES = ["Standart Dengeli", "Ketojenik (Keto)", "Aralıklı Oruç (IF)", "Akdeniz Diyeti", "Vegan", "Vejetaryen", "Düşük Karbonhidrat", "DASH", "Glutensiz"];

const INITIAL_MUSCLE_GROUPS = [
  "Boyun", "Trap (trapezius)", "Omuz (deltoids)", "Göğüs (pectoralis)", "Biceps (biceps brachii)",
  "Ön Kol (brachioradialis)", "Karın (rectus abdominis)", "Ön Bacak (quadriceps)", "Baldır (gastrocnemius)",
  "Triceps (triceps brachii)", "Kanat (latissimus dorsi)", "Sırt (rhomboids)", "Alt Sırt",
  "Kalça", "Arka Bacak (biceps femoris)", "Tüm Vücut", "Kardiyo"
];

const DIET_SUGGESTIONS = {
  "Akdeniz Diyeti": [
    { 
      kahvalti: { name: "Zeytinyağlı Domatesli Peynir Tabağı", ingredients: ["2 dilim tam buğday ekmeği", "1 büyük domates", "50g az yağlı beyaz peynir", "2 yk sızma zeytinyağı", "Kekik"], recipe: "Domatesleri halka halka dilimleyin. Üzerine zeytinyağı ve kekiği gezdirin. Peynir ve kızarmış tam buğday ekmeği ile tabağı hazırlayıp servis yapın." }, 
      ogle: { name: "Izgara Somon ve Akdeniz Salata", ingredients: ["150g somon fileto", "Bol yeşillik (roka, marul)", "5 adet siyah zeytin", "1 tatlı kaşığı kapari", "Limon ve zeytinyağı"], recipe: "Somonu önceden ısıtılmış fırında veya ızgarada 15-20 dk pişirin. Yeşillikleri doğrayıp zeytin, kapari, limon ve yağ ile harmanlayarak salatayı hazırlayın." }, 
      aksam: { name: "Zeytinyağlı Enginar", ingredients: ["1 adet ayıklanmış enginar", "Yarım soğan", "1 havuç, 1 patates", "Zeytinyağı ve limon", "4 yk süzme yoğurt"], recipe: "Soğanı hafif soteleyin, garnitürleri ekleyin. Enginar çanağını tencereye alıp garnitürleri içine doldurun. Limonlu su ve zeytinyağı ekleyip kısık ateşte pişirin." }, 
      ara: { name: "Ceviz ve Meyve", ingredients: ["1 avuç tam ceviz içi", "1 adet orta boy taze elma"], recipe: "Meyveyi dilimleyin, ceviz ile birlikte tüketerek kan şekerinizi dengeleyin." }
    }
  ]
};
const getDietSuggestionsList = (type) => DIET_SUGGESTIONS[type] || DIET_SUGGESTIONS["Akdeniz Diyeti"];

// --- MOCK DATA GENERATOR ---
const generateMockData = () => {
  const dLog = {};
  const tLine = [];
  const today = new Date();
  
  for(let i=60; i>=0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    const weight = 76 + (i * 0.05) + (Math.random() * 0.4);
    dLog[dateStr] = { weight: weight.toFixed(1), chest: 98, waist: 84 - (60-i)*0.03, arm: 36, leg: 55 };
    
    if(i > 0) { 
      const complianceCal = 2400 * (0.85 + (60-i)*0.002 + Math.random() * 0.1); 
      const compliancePro = 160 * (0.8 + Math.random() * 0.2);
      const complianceCarb = 250 * (1.15 - (60-i)*0.004 + Math.random() * 0.2);
      const complianceFat = 80 * (0.9 + Math.random() * 0.2);
      
      tLine.push({
        id: `mock_m_${dateStr}`, date: dateStr, time: '12:00', type: 'meal', status: 'completed',
        data: { name: 'Günlük Toplam', cal: complianceCal, pro: compliancePro, carb: complianceCarb, fat: complianceFat, fiber: 20 + Math.random()*15, sugar: 40 - (60-i)*0.2 + Math.random()*10 }
      });
    }
  }
  return { dLog, tLine };
};

const initialMock = generateMockData();

// --- SVG MUSCLE MAP ---
const MuscleMapAdvanced = ({ activeMuscles }) => {
  const check = (list) => list.some(m => activeMuscles.includes(m)) ? "#22c55e" : "#e2e8f0";
  return (
    <div className="flex gap-2 h-full w-full justify-center">
      <svg viewBox="0 0 100 200" className="h-full drop-shadow-sm">
        <text x="50" y="10" fontSize="8" textAnchor="middle" fill="#64748b" fontWeight="bold">ÖN</text>
        <circle cx="50" cy="20" r="8" fill={check(["Tüm Vücut", "Boyun"])} />
        <path d="M 38 30 Q 50 25 62 30 L 68 45 L 32 45 Z" fill={check(["Omuz (deltoids)"])} />
        <path d="M 33 46 L 67 46 L 62 65 L 38 65 Z" fill={check(["Göğüs (pectoralis)"])} />
        <path d="M 39 67 L 61 67 L 57 95 L 43 95 Z" fill={check(["Karın (rectus abdominis)"])} />
        <path d="M 30 47 L 22 75 L 32 75 Z" fill={check(["Biceps (biceps brachii)"])} />
        <path d="M 70 47 L 78 75 L 68 75 Z" fill={check(["Biceps (biceps brachii)"])} />
        <path d="M 22 77 L 15 105 L 26 105 Z" fill={check(["Ön Kol (brachioradialis)"])} />
        <path d="M 78 77 L 85 105 L 74 105 Z" fill={check(["Ön Kol (brachioradialis)"])} />
        <path d="M 41 97 L 30 145 L 45 145 L 49 97 Z" fill={check(["Ön Bacak (quadriceps)"])} />
        <path d="M 59 97 L 70 145 L 55 145 L 51 97 Z" fill={check(["Ön Bacak (quadriceps)"])} />
        <path d="M 32 147 L 25 190 L 38 190 L 41 147 Z" fill={check(["Baldır (gastrocnemius)"])} />
        <path d="M 68 147 L 75 190 L 62 190 L 59 147 Z" fill={check(["Baldır (gastrocnemius)"])} />
      </svg>
      <svg viewBox="0 0 100 200" className="h-full drop-shadow-sm">
        <text x="50" y="10" fontSize="8" textAnchor="middle" fill="#64748b" fontWeight="bold">ARKA</text>
        <circle cx="50" cy="20" r="8" fill={check(["Tüm Vücut", "Boyun"])} />
        <path d="M 45 28 L 55 28 L 65 42 L 35 42 Z" fill={check(["Trap (trapezius)"])} />
        <path d="M 35 43 L 65 43 L 55 75 L 45 75 Z" fill={check(["Kanat (latissimus dorsi)", "Sırt (rhomboids)"])} />
        <path d="M 45 76 L 55 76 L 58 92 L 42 92 Z" fill={check(["Alt Sırt"])} />
        <path d="M 33 43 L 20 75 L 30 75 Z" fill={check(["Triceps (triceps brachii)"])} />
        <path d="M 67 43 L 80 75 L 70 75 Z" fill={check(["Triceps (triceps brachii)"])} />
        <path d="M 38 94 L 62 94 L 68 115 L 32 115 Z" fill={check(["Kalça"])} />
        <path d="M 33 117 L 28 145 L 43 145 L 48 117 Z" fill={check(["Arka Bacak (biceps femoris)"])} />
        <path d="M 67 117 L 72 145 L 57 145 L 52 117 Z" fill={check(["Arka Bacak (biceps femoris)"])} />
        <path d="M 30 147 L 25 190 L 38 190 L 41 147 Z" fill={check(["Baldır (gastrocnemius)"])} />
        <path d="M 70 147 L 75 190 L 62 190 L 59 147 Z" fill={check(["Baldır (gastrocnemius)"])} />
      </svg>
    </div>
  );
};

// --- MAIN APP ---
export default function ElitePlannerApp() {
  const [activeTab, setActiveTab] = useState('planlama');
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [userProfile, setUserProfile] = useState({
    name: 'Kullanıcı', age: 28, gender: 'Erkek', weight: 76, height: 173, dietType: 'Akdeniz Diyeti', goal: 'Daha fit olmak',
    profilePic: null, measurements: { chest: '', waist: '', arm: '', leg: '' }
  });
  
  const [categories, setCategories] = useState(INITIAL_MUSCLE_GROUPS);
  const [exercises, setExercises] = useState([
    { id: 'e1', name: 'Şınav (Push-up)', category: 'Kuvvet', muscles: ['Göğüs (pectoralis)', 'Triceps (triceps brachii)', 'Omuz (deltoids)'], desc: 'Temel vücut ağırlığı.', imageBase64: null },
    { id: 'e2', name: 'Squat', category: 'Kuvvet', muscles: ['Ön Bacak (quadriceps)', 'Kalça', 'Arka Bacak (biceps femoris)'], desc: 'Alt vücut kondisyonu.', imageBase64: null },
  ]);
  const [mealTemplates, setMealTemplates] = useState([
    { id: 'm1', name: 'Klasik Yulaf Ezmesi', type: 'Kahvaltı', cal: 350, pro: 15, carb: 50, fat: 8, fiber: 5, sugar: 4, imageBase64: null, manualText: '' }
  ]);
  
  const [timeline, setTimeline] = useState(initialMock.tLine); 
  const [performanceHistory, setPerformanceHistory] = useState([]);
  const [dailyLog, setDailyLog] = useState(initialMock.dLog);

  const targetMacros = { cal: 2400, pro: 160, carb: 250, fat: 80 };

  const dateStr = (date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };
  const selectedDateStr = dateStr(currentDate);
  const todaysTimeline = timeline.filter(t => t.date === selectedDateStr).sort((a, b) => a.time.localeCompare(b.time));

  const handleImageUpload = (file, callback) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => callback(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const Header = () => (
    <div className="bg-white pt-4 pb-3 px-6 shadow-sm sticky top-0 z-10 flex flex-col items-center border-b border-gray-50">
      <h1 className="text-[22px] font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500 tracking-wide uppercase">Elite Planner</h1>
      <p className="text-[9px] text-green-600 font-bold tracking-[0.2em] mt-0.5 uppercase italic opacity-90">eat less, work hard, move more and smile</p>
    </div>
  );

  const BottomNav = () => {
    const tabs = [
      { id: 'planlama', icon: CalendarIcon, label: 'Planlama' },
      { id: 'beslenme', icon: Utensils, label: 'Beslenme' },
      { id: 'egzersiz', icon: Dumbbell, label: 'Egzersiz' },
      { id: 'analiz', icon: BarChart, label: 'Analiz' },
      { id: 'performans', icon: Activity, label: 'Performans' },
      { id: 'profil', icon: User, label: 'Profil' }
    ];
    return (
      <div className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-100 flex justify-around py-3 px-1 pb-6 z-50 rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center p-1.5 rounded-xl transition-all duration-300 ${activeTab === tab.id ? 'text-green-600 bg-green-50 scale-110' : 'text-gray-400 hover:text-gray-600'}`}>
            <tab.icon size={20} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
            <span className="text-[9px] mt-1 font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    );
  };

  // --- 1. PLANLAMA SEKME ---
  const TabPlanlama = () => {
    const [showPlanModal, setShowPlanModal] = useState({ type: null }); 
    const [activeDetailModal, setActiveDetailModal] = useState(null); 

    const consumed = todaysTimeline.filter(t => t.type === 'meal' && t.status === 'completed').reduce((acc, curr) => ({
      cal: acc.cal + (Number(curr.data.cal) || 0), pro: acc.pro + (Number(curr.data.pro) || 0),
      carb: acc.carb + (Number(curr.data.carb) || 0), fat: acc.fat + (Number(curr.data.fat) || 0),
    }), { cal: 0, pro: 0, carb: 0, fat: 0 });

    const handleMonthYearChange = (e) => {
      const [year, month] = e.target.value.split('-');
      setCurrentDate(new Date(year, month - 1, 1));
    };

    const generateWeek = () => {
      const days = [];
      for(let i=-3; i<=3; i++) {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + i);
        days.push(d);
      }
      return days;
    };

    return (
      <div className="p-4 space-y-6 pb-24">
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4 bg-gray-50 p-2 rounded-2xl border border-gray-200">
            <button onClick={() => {const d = new Date(currentDate); d.setMonth(d.getMonth()-1); setCurrentDate(d);}} className="p-2 text-gray-500 hover:bg-white rounded-xl shadow-sm"><ChevronLeft size={18}/></button>
            <div className="relative flex flex-col items-center">
              <input type="month" value={`${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}`} onChange={handleMonthYearChange} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10" />
              <span className="font-bold text-gray-800 uppercase tracking-wide">{currentDate.toLocaleDateString('tr-TR', { month: 'long' })}</span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[10px] text-gray-500 font-bold bg-white px-2 py-0.5 rounded-full border border-gray-200">{currentDate.getFullYear()} ▼</span>
                <button onClick={(e) => { e.stopPropagation(); setCurrentDate(new Date()); }} className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full shadow-sm hover:bg-blue-100 z-20 relative">Bugün</button>
              </div>
            </div>
            <button onClick={() => {const d = new Date(currentDate); d.setMonth(d.getMonth()+1); setCurrentDate(d);}} className="p-2 text-gray-500 hover:bg-white rounded-xl shadow-sm"><ChevronRight size={18}/></button>
          </div>
          <div className="flex justify-between items-center">
            {generateWeek().map((d, i) => {
              const isSelected = dateStr(d) === selectedDateStr;
              const past = d < new Date(new Date().setHours(0,0,0,0));
              return (
                <button key={i} onClick={() => setCurrentDate(d)} className={`flex flex-col items-center p-2 rounded-2xl min-w-[40px] transition-all ${isSelected ? 'bg-green-500 text-white shadow-md shadow-green-200' : past ? 'text-gray-400' : 'text-gray-800 hover:bg-gray-50'}`}>
                  <span className="text-[10px] uppercase mb-1">{d.toLocaleDateString('tr-TR', { weekday: 'short' })}</span>
                  <span className={`text-lg font-bold ${isSelected ? 'text-white' : ''}`}>{d.getDate()}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4"><Target size={18} className="text-orange-500" /> Günlük Tüketim Hedefi</h3>
          <div className="grid grid-cols-2 gap-4">
            {[{l: 'Kalori', c: consumed.cal, t: targetMacros.cal, cl: 'bg-orange-400', bg: 'bg-orange-50'},
              {l: 'Protein', c: consumed.pro, t: targetMacros.pro, cl: 'bg-blue-400', bg: 'bg-blue-50'},
              {l: 'Karb', c: consumed.carb, t: targetMacros.carb, cl: 'bg-green-400', bg: 'bg-green-50'},
              {l: 'Yağ', c: consumed.fat, t: targetMacros.fat, cl: 'bg-yellow-400', bg: 'bg-yellow-50'}].map((m, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex justify-between text-xs font-medium text-gray-600"><span>{m.l}</span><span>{Math.round(m.c)}/{m.t}</span></div>
                <div className={`h-2 w-full rounded-full ${m.bg} overflow-hidden`}><div className={`h-full ${m.cl} rounded-full transition-all`} style={{ width: `${Math.min(100, (m.c/m.t)*100)}%` }} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Clock size={18} className="text-blue-500" /> Zaman Çizelgesi</h3>
            <div className="flex gap-2">
              <button onClick={() => setShowPlanModal({type: 'workout'})} className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm">+ Antrenman</button>
              <button onClick={() => setShowPlanModal({type: 'meal'})} className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm">+ Öğün</button>
            </div>
          </div>

          <div className="relative pl-4 border-l-2 border-gray-100 space-y-6 mt-4">
            {todaysTimeline.length === 0 ? (
              <div className="bg-gray-50 rounded-2xl p-6 text-center border border-dashed border-gray-200">
                <p className="text-sm text-gray-500 font-medium">Önce planla, sonra uygula!</p>
                <p className="text-xs text-gray-400 mt-1">Yukarıdaki butonlardan çizelgeye öğe ekleyin.</p>
              </div>
            ) : (
              todaysTimeline.map((item) => (
                <div key={item.id} className="relative cursor-pointer transition-transform hover:scale-[1.02]" onClick={() => setActiveDetailModal(item)}>
                  <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white ${item.status === 'completed' ? (item.type === 'workout' ? 'bg-blue-500' : 'bg-orange-500') : (item.type === 'workout' ? 'bg-blue-300' : 'bg-orange-300')}`} />
                  
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-gray-500">{item.time}</span>
                    <button onClick={(e) => { e.stopPropagation(); setTimeline(t => t.filter(x => x.id !== item.id)); }} className="text-gray-300 hover:text-red-400"><Trash2 size={14}/></button>
                  </div>
                  
                  <div className={`p-4 rounded-2xl border ${item.status === 'completed' ? (item.type === 'workout' ? 'bg-blue-50/50 border-blue-100' : 'bg-orange-50/50 border-orange-100') : 'bg-white border-gray-200 shadow-sm'}`}>
                    {item.type === 'workout' ? (
                      <div>
                        <h4 className="font-bold text-gray-800 flex items-center gap-2">
                          <Dumbbell size={14} className={item.status === 'completed' ? 'text-blue-600' : 'text-blue-400'}/> {item.data.name}
                        </h4>
                        <p className="text-[10px] text-gray-500 mt-1">
                          {item.status === 'planned' ? 'Planlandı - Düzenle & Başlat' : `${item.data.exercises?.length || 0} Hareket • ${Math.floor((item.data.duration||0)/60)} Dk ${(item.data.duration||0)%60} Sn`}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-bold text-gray-800 flex items-center gap-2">
                           <Utensils size={14} className={item.status === 'completed' ? 'text-orange-600' : 'text-orange-400'}/> {item.data.name}
                        </h4>
                        <p className="text-[10px] text-gray-500 mt-1">
                          {item.status === 'planned' ? 'Planlandı - İçeriği Gir' : `${Math.round(item.data.cal)} kcal • P:${Math.round(item.data.pro)}g K:${Math.round(item.data.carb)}g Y:${Math.round(item.data.fat)}g`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {showPlanModal.type && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 relative animate-slide-up shadow-2xl">
              <button onClick={() => setShowPlanModal({type: null})} className="absolute top-4 right-4 text-gray-400 bg-gray-100 rounded-full p-1"><X size={20}/></button>
              <h2 className="text-xl font-bold text-gray-800 mb-4">{showPlanModal.type === 'workout' ? 'Antrenman Çizelgeye Ekle' : 'Öğün Çizelgeye Ekle'}</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                setTimeline([...timeline, {
                  id: Date.now().toString(), date: selectedDateStr, time: fd.get('time'), type: showPlanModal.type, status: 'planned',
                  data: { name: fd.get('name'), exercises: [], duration: 0, cal: 0, pro: 0, carb: 0, fat: 0, fiber: 0, sugar: 0, manualText: '' }
                }]);
                setShowPlanModal({type: null});
              }} className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 font-bold uppercase tracking-wide">İsim / Başlık</label>
                  <input name="name" required placeholder={showPlanModal.type === 'workout' ? 'Örn: Göğüs Günü' : 'Örn: Kahvaltı'} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm mt-1 outline-none focus:border-blue-400"/>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-bold uppercase tracking-wide">Saat</label>
                  <input name="time" type="time" required defaultValue="12:00" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm mt-1 outline-none focus:border-blue-400"/>
                </div>
                <button type="submit" className="w-full bg-gray-900 text-white rounded-xl p-3 font-bold text-sm mt-2 shadow-md">Taslak Olarak Ekle</button>
              </form>
            </div>
          </div>
        )}

        {activeDetailModal?.type === 'workout' && <ActiveWorkoutModal item={activeDetailModal} onClose={() => setActiveDetailModal(null)} onSave={(updatedData, status) => {
          setTimeline(timeline.map(t => t.id === activeDetailModal.id ? { ...t, status: status, data: updatedData } : t));
          setActiveDetailModal(null);
        }} exercises={exercises} />}
        
        {activeDetailModal?.type === 'meal' && <MealDetailModal item={activeDetailModal} onClose={() => setActiveDetailModal(null)} mealTemplates={mealTemplates} onSave={(updatedData) => {
          setTimeline(timeline.map(t => t.id === activeDetailModal.id ? { ...t, status: 'completed', data: updatedData } : t));
          setActiveDetailModal(null);
        }} />}
      </div>
    );
  };

  // --- WORKOUT EXECUTION MODAL ---
  const ActiveWorkoutModal = ({ item, onClose, onSave, exercises }) => {
    const [workout, setWorkout] = useState(item.data);
    const [timerActive, setTimerActive] = useState(false);
    const [isEditing, setIsEditing] = useState(item.status === 'planned' && (!workout.exercises || workout.exercises.length === 0));
    
    const timerRef = useRef(null);
    useEffect(() => {
      if (timerActive) {
        timerRef.current = setInterval(() => setWorkout(w => ({...w, duration: (w.duration || 0) + 1})), 1000);
      } else {
        clearInterval(timerRef.current);
      }
      return () => clearInterval(timerRef.current);
    }, [timerActive]);

    const formatTime = (seconds) => {
      const m = Math.floor(seconds / 60).toString().padStart(2, '0');
      const s = (seconds % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    };

    const currentMuscles = [...new Set((workout.exercises || []).map(we => exercises.find(e => e.id === we.exId)?.muscles).flat().filter(Boolean))];
    const handleClose = () => onSave(workout, item.status);

    return (
      <div className="fixed inset-0 bg-black/80 z-[100] flex items-end justify-center">
        <div className="bg-white w-full max-w-md h-[95vh] rounded-t-3xl flex flex-col animate-slide-up relative overflow-hidden">
          <div className="bg-blue-600 text-white p-6 pb-6 rounded-b-[40px] shadow-lg shrink-0">
            <button onClick={handleClose} className="absolute top-6 right-6 text-blue-200 hover:text-white"><X size={24}/></button>
            <div className="flex justify-between items-center mb-4 pr-10">
              {isEditing ? (
                <input type="text" value={workout.name} onChange={e=>setWorkout({...workout, name:e.target.value})} className="bg-transparent border-b border-blue-400 text-xl font-bold outline-none w-full"/>
              ) : (
                <h2 className="text-xl font-bold">{workout.name}</h2>
              )}
            </div>
            
            <div className="flex flex-col items-center">
              <span className="text-5xl font-black font-mono tracking-wider drop-shadow-md mb-4">{formatTime(workout.duration || 0)}</span>
              <div className="flex gap-4">
                <button onClick={() => setTimerActive(true)} disabled={timerActive} className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${timerActive ? 'bg-blue-800 text-blue-900 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-400'}`}>
                  <Play fill="currentColor" size={24} className="ml-1"/>
                </button>
                <button onClick={() => setTimerActive(false)} disabled={!timerActive} className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${!timerActive ? 'bg-blue-800 text-blue-900 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-400'}`}>
                  <Pause fill="currentColor" size={22}/>
                </button>
                <button onClick={() => { setTimerActive(false); onSave(workout, 'completed'); }} className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 bg-white text-blue-600 hover:bg-blue-50" title="Bitir ve Kaydet">
                  <Save size={22}/>
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
             <div className="flex justify-between items-center bg-gray-50 p-2 rounded-xl border border-gray-100">
               <span className="text-xs font-semibold text-gray-500 ml-2">İçerik Modu:</span>
               <button onClick={() => setIsEditing(!isEditing)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${isEditing ? 'bg-green-500 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}>
                 {isEditing ? 'Düzenlemeyi Bitir' : 'Düzenle (Ekle/Çıkar)'}
               </button>
             </div>

             {currentMuscles.length > 0 && (
               <div className="bg-gray-50 rounded-2xl p-4 flex flex-col items-center gap-4 border border-gray-100">
                 <h4 className="text-xs font-bold text-gray-700 w-full text-center mb-2">Hedeflenen Kas Grupları</h4>
                 <div className="h-44 w-full"><MuscleMapAdvanced activeMuscles={currentMuscles} /></div>
                 <div className="flex flex-wrap gap-1 justify-center mt-2">
                   {currentMuscles.map(m => <span key={m} className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">{m}</span>)}
                 </div>
               </div>
             )}

            <div className="space-y-3">
              {isEditing && (
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-800">Hareket Ekle:</span>
                  <select onChange={(e) => { if(e.target.value) { setWorkout({...workout, exercises: [...(workout.exercises || []), { exId: e.target.value, sets: 3, reps: 10, rest: 60, superSet: false }]}); e.target.value=""; } }} className="text-xs bg-white text-blue-600 px-3 py-1.5 rounded-lg border border-blue-200 outline-none w-48">
                    <option value="">Kütüphaneden Seç...</option>
                    {exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                  </select>
                </div>
              )}
              
              {(workout.exercises || []).map((wEx, idx) => {
                const ex = exercises.find(e => e.id === wEx.exId);
                if(!ex) return null;
                return (
                  <div key={idx} className={`p-4 rounded-2xl border ${wEx.superSet ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-white shadow-sm'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">{ex.name} {wEx.superSet && <span className="text-[9px] bg-orange-500 text-white px-2 py-0.5 rounded-md uppercase">Süperset</span>}</h4>
                        <span className="text-[9px] text-gray-500">{ex.muscles.join(', ')}</span>
                      </div>
                      <a href={`https://www.youtube.com/results?search_query=${ex.name} nasil yapilir`} target="_blank" rel="noopener noreferrer" className="text-red-500 bg-red-50 p-1.5 rounded-lg hover:bg-red-100 transition-colors"><Youtube size={16}/></a>
                    </div>

                    {isEditing ? (
                      <div className="flex gap-2 text-xs">
                        {['sets', 'reps', 'rest'].map(field => (
                          <div key={field} className="flex-1 bg-gray-50 p-2 rounded-xl text-center border border-gray-100">
                            <span className="block text-[9px] text-gray-400 mb-1 font-bold">{field==='sets'?'Set':field==='reps'?'Tekrar':'Dinlenme(sn)'}</span>
                            <input type="number" value={wEx[field]} onChange={(e) => { const newExs = [...workout.exercises]; newExs[idx][field] = e.target.value; setWorkout({...workout, exercises: newExs}); }} className="w-full bg-transparent text-center font-bold text-gray-700 outline-none"/>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex justify-around text-center bg-gray-50 rounded-xl py-2 px-4">
                         <div><span className="block text-[10px] text-gray-400 font-bold">Set</span><span className="font-bold text-gray-800 text-sm">{wEx.sets}</span></div>
                         <div><span className="block text-[10px] text-gray-400 font-bold">Tekrar</span><span className="font-bold text-gray-800 text-sm">{wEx.reps}</span></div>
                         <div><span className="block text-[10px] text-gray-400 font-bold">Dinlenme</span><span className="font-bold text-gray-800 text-sm">{wEx.rest}s</span></div>
                      </div>
                    )}

                    {isEditing && (
                      <div className="flex justify-end gap-2 mt-3">
                        <button onClick={() => { const newExs = [...workout.exercises]; newExs[idx].superSet = !newExs[idx].superSet; setWorkout({...workout, exercises: newExs}); }} className={`text-[10px] px-2 py-1 rounded-md font-bold transition-colors ${wEx.superSet ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}>Süperset Yap</button>
                        <button onClick={() => { const newExs = [...workout.exercises]; newExs.splice(idx, 1); setWorkout({...workout, exercises: newExs}); }} className="text-[10px] bg-red-50 text-red-500 px-2 py-1 rounded-md font-bold hover:bg-red-100">Kaldır</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- MEAL DETAIL & AI MODAL ---
  const MealDetailModal = ({ item, onClose, onSave, mealTemplates }) => {
    const [meal, setMeal] = useState({ ...item.data, manualText: item.data.manualText || '', fiber: item.data.fiber || 0, sugar: item.data.sugar || 0 });
    const [analyzing, setAnalyzing] = useState(false);
    const [isEditing, setIsEditing] = useState(item.status === 'planned');

    const runAI = async () => {
      setAnalyzing(true);
      const prompt = `Yemeği/Metni analiz et. Veri yoksa tahmin et. Sadece JSON formatı kullan: {"cal":sayı, "pro":sayı, "carb":sayı, "fat":sayı, "fiber":sayı, "sugar":sayı, "comment":"kısa yorum"}. Metin: ${meal.manualText}`;
      
      const res = await callGemini(prompt, meal.imageBase64);
      
      try {
        const data = JSON.parse(res.replace(/```json/g, '').replace(/```/g, '').trim());
        setMeal(m => ({...m, cal: data.cal, pro: data.pro, carb: data.carb, fat: data.fat, fiber: data.fiber || 0, sugar: data.sugar || 0, aiAnalysis: data.comment}));
      } catch (e) {
        setMeal(m => ({...m, aiAnalysis: res})); // If mock returns raw string, just show it
      }
      setAnalyzing(false);
      setIsEditing(true); 
    };

    return (
      <div className="fixed inset-0 bg-black/80 z-[100] flex items-end justify-center">
        <div className="bg-orange-50 w-full max-w-md h-[90vh] rounded-t-3xl flex flex-col animate-slide-up relative">
          <div className="bg-orange-500 text-white p-6 rounded-t-3xl shrink-0 shadow-sm relative">
            <button onClick={onClose} className="absolute top-6 right-6 text-orange-200 hover:text-white"><X size={24}/></button>
            {isEditing ? (
              <input type="text" value={meal.name} onChange={e=>setMeal({...meal, name:e.target.value})} className="bg-transparent border-b border-orange-300 text-xl font-bold outline-none w-3/4 text-white placeholder-orange-200" placeholder="Öğün Adı"/>
            ) : (
              <h2 className="text-xl font-bold text-white">{meal.name}</h2>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-5 p-6 bg-white">
            <div className="flex justify-between items-center bg-gray-50 p-2 rounded-xl border border-gray-100">
               <span className="text-xs font-semibold text-gray-500 ml-2">Giriş Modu:</span>
               <button onClick={() => setIsEditing(!isEditing)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${isEditing ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}>
                 {isEditing ? 'Düzenlemeyi Bitir' : 'Manuel Düzenle'}
               </button>
            </div>

            {isEditing && (
              <div>
                <select onChange={e => { const t = mealTemplates.find(x => x.id === e.target.value); if(t) setMeal({...meal, name: t.name, cal: t.cal, pro: t.pro, carb: t.carb, fat: t.fat, fiber: t.fiber||0, sugar: t.sugar||0, imageBase64: t.imageBase64}); }} className="w-full bg-orange-50 text-orange-800 font-bold border border-orange-100 rounded-xl p-3 text-sm outline-none mb-4">
                  <option value="">+ Hazır Şablon Kullan</option>
                  {mealTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <textarea placeholder="Ne yedin? İçeriği veya tarifi detaylı yazabilirsin..." value={meal.manualText} onChange={e=>setMeal({...meal, manualText: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm h-20 outline-none resize-none focus:border-orange-400 mb-2"/>
              </div>
            )}

            <div className="border-2 border-dashed border-orange-200 rounded-2xl p-4 text-center relative overflow-hidden bg-orange-50 h-32 flex items-center justify-center">
              {meal.imageBase64 ? (
                 <img src={meal.imageBase64} alt="Meal" className="absolute inset-0 w-full h-full object-cover opacity-90" />
              ) : (
                <div className="flex flex-col items-center text-orange-400 z-10"><Camera size={32} className="mb-2" /><span className="text-sm font-bold">Fotoğraf Çek / Yükle</span></div>
              )}
              {isEditing && <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files[0], (b64) => setMeal({...meal, imageBase64: b64}))} className="absolute inset-0 opacity-0 cursor-pointer z-20" />}
            </div>

            {isEditing && (meal.imageBase64 || meal.manualText) && (
              <button onClick={runAI} disabled={analyzing} className="w-full bg-gradient-to-r from-orange-400 to-amber-500 text-white rounded-xl p-3 font-bold text-sm flex justify-center items-center gap-2 shadow-md">
                {analyzing ? <span className="animate-pulse">Analiz Ediliyor...</span> : <><Sparkles size={18} /> Verileri Akıllı Analiz Et</>}
              </button>
            )}

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
               <h4 className="text-xs font-bold text-gray-500 mb-3 border-b border-gray-200 pb-2">Makro & Mikro Değerler</h4>
               <div className="grid grid-cols-4 gap-3 mb-3">
                 {[{l: 'Kalori', k: 'cal'}, {l: 'Pro', k: 'pro'}, {l: 'Karb', k: 'carb'}, {l: 'Yağ', k: 'fat'}].map(field => (
                   <div key={field.k} className="flex flex-col items-center">
                     <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mb-1">{field.l}</label>
                     {isEditing ? <input type="number" value={meal[field.k] ?? ''} onChange={e=>setMeal({...meal, [field.k]: e.target.value})} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-center text-sm font-bold text-gray-800 outline-none focus:border-orange-400"/> : <span className="font-bold text-gray-800 text-lg">{meal[field.k] || 0}</span>}
                   </div>
                 ))}
               </div>
               <div className="grid grid-cols-2 gap-3">
                 {[{l: 'Lif (g)', k: 'fiber'}, {l: 'Şeker (g)', k: 'sugar'}].map(field => (
                   <div key={field.k} className="flex flex-col">
                     <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wide ml-1">{field.l}</label>
                     {isEditing ? <input type="number" value={meal[field.k] ?? ''} onChange={e=>setMeal({...meal, [field.k]: e.target.value})} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm font-bold text-gray-800 outline-none"/> : <span className="font-bold text-gray-800 text-sm ml-1">{meal[field.k] || 0} g</span>}
                   </div>
                 ))}
               </div>
            </div>

            {meal.aiAnalysis && (
              <div className="bg-green-50 p-4 rounded-xl border border-green-200 flex gap-3 items-start">
                <Sparkles className="text-green-500 shrink-0 mt-0.5" size={18}/>
                <p className="text-xs text-green-900 leading-relaxed font-medium">{meal.aiAnalysis}</p>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-gray-100 shrink-0">
             <button onClick={() => onSave(meal)} className="w-full bg-orange-600 text-white rounded-2xl p-4 font-bold shadow-xl flex justify-center items-center gap-2 hover:bg-orange-500 transition-colors">
                <Save size={20}/> Tüketildi Olarak Kaydet
             </button>
          </div>
        </div>
      </div>
    );
  };

  // --- 2. EGZERSİZ SEKME ---
  const TabEgzersiz = () => {
    const [newCat, setNewCat] = useState("");
    const [editEx, setEditEx] = useState(null);

    const handleSaveEx = (exData) => {
      if(editEx && editEx.id) setExercises(exercises.map(e => e.id === exData.id ? exData : e));
      else setExercises([...exercises, { ...exData, id: Date.now().toString() }]);
      setEditEx(null);
    };

    return (
      <div className="p-4 space-y-6 pb-24">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-3 text-sm flex items-center gap-2"><FolderPlus size={16} className="text-green-500"/> Kas Grupları (Kategoriler)</h3>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-gray-50 rounded-xl border border-gray-100">
             {categories.map(c => (
               <span key={c} className="bg-white text-gray-700 px-3 py-1 rounded-lg text-xs font-medium border border-gray-200 shadow-sm flex items-center gap-1">
                 {c}
                 <button onClick={() => setCategories(categories.filter(x => x !== c))} className="text-red-400 hover:text-red-600 ml-1"><X size={10}/></button>
               </span>
             ))}
          </div>
          <div className="flex gap-2 mt-3">
             <input type="text" value={newCat} onChange={e=>setNewCat(e.target.value)} placeholder="Yeni Kas/Bölge Ekle" className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-2 text-sm outline-none"/>
             <button onClick={() => { if(newCat) { setCategories([...categories, newCat]); setNewCat(""); } }} className="bg-green-500 text-white px-4 rounded-xl text-sm font-bold shadow-md hover:bg-green-400 transition-colors">+</button>
          </div>
        </div>

        <div>
           <div className="flex justify-between items-center mb-4 px-1">
             <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Dumbbell size={18} className="text-blue-500"/> Kütüphane</h3>
             <button onClick={() => setEditEx({ name: '', category: 'Kuvvet', muscles: [], desc: '', imageBase64: null })} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-blue-500 transition-colors flex items-center gap-1">
               <Plus size={14}/> Yeni Ekle
             </button>
           </div>
           <div className="grid gap-3">
             {exercises.map(ex => (
               <div key={ex.id} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                 <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden flex justify-center items-center shrink-0 border border-gray-100">
                    {ex.imageBase64 ? <img src={ex.imageBase64} alt="ex" className="w-full h-full object-cover"/> : <ImageIcon size={24} className="text-gray-300"/>}
                 </div>
                 <div className="flex-1">
                   <h4 className="font-bold text-gray-800 text-sm">{ex.name}</h4>
                   <p className="text-[9px] text-gray-500 mt-1 leading-tight">{ex.muscles.join(', ')}</p>
                 </div>
                 <button onClick={() => setEditEx(ex)} className="text-blue-500 bg-blue-50 p-3 rounded-xl hover:bg-blue-100 transition-colors"><Edit2 size={16}/></button>
               </div>
             ))}
           </div>
        </div>

        {editEx && (
          <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
             <div className="bg-white w-full max-w-sm rounded-3xl p-6 relative animate-slide-up h-[85vh] flex flex-col shadow-2xl">
               <button onClick={() => setEditEx(null)} className="absolute top-4 right-4 text-gray-400 bg-gray-100 rounded-full p-1"><X size={20}/></button>
               <h2 className="text-xl font-bold text-gray-800 mb-4">{editEx.id ? 'Hareketi Düzenle' : 'Yeni Hareket'}</h2>
               
               <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-2">
                  <div className="border-2 border-dashed border-blue-200 rounded-2xl h-36 flex justify-center items-center relative overflow-hidden bg-blue-50">
                    {editEx.imageBase64 ? <img src={editEx.imageBase64} className="w-full h-full object-cover"/> : <div className="text-center text-blue-400"><Camera size={28} className="mx-auto mb-2"/><span className="text-xs font-bold">Görsel Yükle</span></div>}
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files[0], (b64) => setEditEx({...editEx, imageBase64: b64}))} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                  <input type="text" placeholder="Hareket Adı" value={editEx.name} onChange={e=>setEditEx({...editEx, name:e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-800 outline-none focus:border-blue-400"/>
                  
                  <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wide mb-3 block">Aktif Kas Gruplarını Seç</label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(m => (
                        <button key={m} onClick={() => setEditEx(prev => ({...prev, muscles: prev.muscles.includes(m) ? prev.muscles.filter(x=>x!==m) : [...prev.muscles, m]}))}
                          className={`text-[9px] px-3 py-1.5 rounded-full font-bold transition-all ${editEx.muscles.includes(m) ? 'bg-blue-500 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}>
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea placeholder="Püf Noktaları / Açıklama" value={editEx.desc} onChange={e=>setEditEx({...editEx, desc:e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm h-24 outline-none resize-none focus:border-blue-400"/>
               </div>
               <button onClick={() => handleSaveEx(editEx)} className="w-full bg-blue-600 text-white rounded-xl p-4 font-bold shadow-lg hover:bg-blue-500 transition-colors flex items-center justify-center gap-2">
                 <Save size={18}/> Kütüphaneye Kaydet
               </button>
             </div>
          </div>
        )}
      </div>
    );
  };

  // --- 3. BESLENME SEKME ---
  const TabBeslenme = () => {
    const [suggIndex, setSuggIndex] = useState(0);
    const [recipeModal, setRecipeModal] = useState(null); 
    const [editTpl, setEditTpl] = useState(null);

    const handleSaveTpl = () => {
      if(editTpl.id) setMealTemplates(mealTemplates.map(t => t.id === editTpl.id ? editTpl : t));
      else setMealTemplates([...mealTemplates, {...editTpl, id: Date.now().toString()}]);
      setEditTpl(null);
    };

    const suggestionsList = getDietSuggestionsList(userProfile.dietType);
    const currentSugg = suggestionsList[suggIndex % suggestionsList.length];

    return (
      <div className="p-4 space-y-6 pb-24">
         <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Utensils size={18} className="text-orange-500"/> Mevcut Diyet Türü</h2>
          <select value={userProfile.dietType} onChange={e => { setUserProfile({...userProfile, dietType: e.target.value}); setSuggIndex(0); }} className="w-full bg-orange-50 text-orange-900 border border-orange-100 rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 ring-orange-300">
            {DIET_TYPES.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-5 rounded-3xl border border-orange-100 shadow-sm relative">
           <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-orange-900 flex items-center gap-2"><Info size={18}/> Size Özel Menü Önerileri</h3>
             <button onClick={() => setSuggIndex(suggIndex + 1)} className="p-2 bg-orange-100 text-orange-600 rounded-full hover:bg-orange-200 transition-colors shadow-sm"><RefreshCw size={16}/></button>
           </div>
           <div className="space-y-3">
             {['kahvalti', 'ogle', 'aksam', 'ara'].map(mealType => (
               <div key={mealType} onClick={() => setRecipeModal({ type: mealType, data: currentSugg[mealType] })} className="bg-white p-3 rounded-2xl shadow-sm cursor-pointer hover:shadow-md transition-all flex items-center justify-between border border-orange-50">
                 <div>
                   <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest block mb-1">{mealType === 'kahvalti' ? 'Kahvaltı' : mealType === 'ogle' ? 'Öğle' : mealType === 'aksam' ? 'Akşam' : 'Ara Öğün'}</span>
                   <p className="text-xs text-gray-800 font-bold leading-relaxed pr-2">{currentSugg[mealType].name}</p>
                 </div>
                 <ChevronRightSquare size={16} className="text-orange-300 shrink-0"/>
               </div>
             ))}
           </div>
        </div>

        <div>
           <div className="flex justify-between items-center mb-4 px-1">
             <h3 className="font-bold text-gray-800 flex items-center gap-2"><Save size={18} className="text-green-500"/> Hazır Öğün Kütüphanesi</h3>
             <button onClick={() => setEditTpl({ name: '', type: 'Kahvaltı', cal: 0, pro: 0, carb: 0, fat: 0, fiber: 0, sugar: 0, imageBase64: null })} className="bg-green-50 text-green-600 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm">
               <Plus size={14}/> Yeni Ekle
             </button>
           </div>
           
           <div className="space-y-3">
             {mealTemplates.map(tpl => (
                <div key={tpl.id} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className="w-16 h-16 bg-orange-50 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-orange-100">
                    {tpl.imageBase64 ? <img src={tpl.imageBase64} className="w-full h-full object-cover"/> : <Utensils size={24} className="text-orange-300"/>}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 text-sm">{tpl.name}</h4>
                    <p className="text-[10px] text-gray-500 mt-1 font-medium">{tpl.cal} kcal • P:{tpl.pro} K:{tpl.carb} Y:{tpl.fat}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => setEditTpl(tpl)} className="text-blue-500 bg-blue-50 p-2 rounded-lg hover:bg-blue-100"><Edit2 size={14}/></button>
                    <button onClick={() => setMealTemplates(mealTemplates.filter(x => x.id !== tpl.id))} className="text-red-500 bg-red-50 p-2 rounded-lg hover:bg-red-100"><Trash2 size={14}/></button>
                  </div>
                </div>
             ))}
           </div>
        </div>

        {recipeModal && (
          <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4">
             <div className="bg-white w-full max-w-sm rounded-3xl p-6 relative shadow-2xl animate-slide-up">
               <button onClick={() => setRecipeModal(null)} className="absolute top-4 right-4 text-gray-400 bg-gray-100 rounded-full p-1"><X size={20}/></button>
               <h3 className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-1 flex items-center gap-1"><BookOpen size={12}/> Tarif & İçerik</h3>
               <h2 className="text-lg font-bold text-gray-800 mb-4">{recipeModal.data.name}</h2>
               
               <div className="space-y-4">
                 <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                   <h4 className="text-xs font-bold text-orange-800 mb-2 border-b border-orange-200 pb-1">Malzemeler</h4>
                   <ul className="list-disc pl-4 space-y-1">
                     {recipeModal.data.ingredients.map((ing, i) => <li key={i} className="text-xs text-gray-700 font-medium">{ing}</li>)}
                   </ul>
                 </div>
                 <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                   <h4 className="text-xs font-bold text-gray-600 mb-2 border-b border-gray-200 pb-1">Hazırlanışı</h4>
                   <p className="text-xs text-gray-700 font-medium leading-relaxed">{recipeModal.data.recipe}</p>
                 </div>
               </div>
               <button onClick={() => setRecipeModal(null)} className="w-full mt-5 bg-gray-900 text-white py-3 rounded-xl font-bold text-sm">Kapat</button>
             </div>
          </div>
        )}

        {editTpl && (
          <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
             <div className="bg-white w-full max-w-sm rounded-3xl p-6 relative animate-slide-up h-[85vh] flex flex-col">
               <button onClick={() => setEditTpl(null)} className="absolute top-4 right-4 text-gray-400 bg-gray-100 rounded-full p-1"><X size={20}/></button>
               <h2 className="text-xl font-bold text-gray-800 mb-4">Şablon Öğün</h2>
               <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1">
                  <div className="border-2 border-dashed border-gray-200 rounded-2xl h-32 flex justify-center items-center relative overflow-hidden bg-gray-50">
                    {editTpl.imageBase64 ? <img src={editTpl.imageBase64} className="w-full h-full object-cover"/> : <div className="text-center text-gray-400"><Camera size={24} className="mx-auto mb-1"/><span className="text-xs font-bold">Fotoğraf</span></div>}
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files[0], (b64) => setEditTpl({...editTpl, imageBase64: b64}))} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 font-bold uppercase ml-1">Öğün Adı</label>
                    <input type="text" placeholder="Örn: Haşlanmış Tavuk" value={editTpl.name} onChange={e=>setEditTpl({...editTpl, name:e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold outline-none focus:border-orange-400"/>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[{l: 'Kalori', k: 'cal'}, {l: 'Protein', k: 'pro'}, {l: 'Karb', k: 'carb'}, {l: 'Yağ', k: 'fat'}, {l: 'Lif', k: 'fiber'}, {l: 'Şeker', k: 'sugar'}].map(f => (
                      <div key={f.k}>
                        <label className="text-[10px] text-gray-500 font-bold uppercase ml-1 block">{f.l}</label>
                        <input type="number" value={editTpl[f.k] ?? ''} onChange={e=>setEditTpl({...editTpl, [f.k]: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-center text-sm font-bold outline-none focus:border-orange-400"/>
                      </div>
                    ))}
                  </div>
               </div>
               <button onClick={handleSaveTpl} className="w-full bg-orange-500 text-white rounded-xl p-4 font-bold text-sm mt-2 shadow-lg">Şablonu Kaydet</button>
             </div>
          </div>
        )}
      </div>
    );
  };

  // --- 4. ANALİZ SEKME ---
  const TabAnaliz = () => {
    const [measureDate, setMeasureDate] = useState(selectedDateStr);
    const [timeframe, setTimeframe] = useState('week'); 
    const [chartMetric, setChartMetric] = useState('cal'); 
    const [compareMode, setCompareMode] = useState(true);

    const [isEditingMetrics, setIsEditingMetrics] = useState(false);
    const [tempLog, setTempLog] = useState({ weight: '', chest: '', waist: '', arm: '', leg: '' });
    
    const [aiTrendText, setAiTrendText] = useState("");
    const [aiTrendLoading, setAiTrendLoading] = useState(false);

    useEffect(() => {
      setTempLog({
         weight: dailyLog[measureDate]?.weight ?? userProfile.weight,
         chest: dailyLog[measureDate]?.chest ?? '',
         waist: dailyLog[measureDate]?.waist ?? '',
         arm: dailyLog[measureDate]?.arm ?? '',
         leg: dailyLog[measureDate]?.leg ?? ''
      });
      setIsEditingMetrics(false);
    }, [measureDate, dailyLog, userProfile.weight]);

    const handleSaveLog = () => {
      setDailyLog(prev => ({ ...prev, [measureDate]: tempLog }));
      setIsEditingMetrics(false);
    };

    const chartData = useMemo(() => {
      const days = timeframe === 'week' ? 7 : 30;
      const current = []; const prev = [];
      let cCal=0, cPro=0, cCarb=0, cWeight=0, cWCount=0, cComp=0, cMCount=0;
      let pCal=0, pPro=0, pCarb=0, pWeight=0, pWCount=0, pComp=0, pMCount=0;

      for (let i = days - 1; i >= 0; i--) {
        const dCurr = new Date(currentDate); dCurr.setDate(dCurr.getDate() - i);
        const dCurrStr = dateStr(dCurr);
        const lCurr = timeframe === 'week' ? dCurr.toLocaleDateString('tr-TR', {weekday:'short'}) : dCurr.getDate();
        
        const dPrev = new Date(currentDate); dPrev.setDate(dPrev.getDate() - i - days);
        const dPrevStr = dateStr(dPrev);

        const extract = (dStr) => {
          const w = parseFloat(dailyLog[dStr]?.weight) || null;
          const meals = timeline.filter(t => t.date === dStr && t.type === 'meal' && t.status === 'completed');
          const m = meals.reduce((a, meal) => ({
            cal: a.cal + (Number(meal.data.cal)||0), pro: a.pro + (Number(meal.data.pro)||0),
            carb: a.carb + (Number(meal.data.carb)||0), fat: a.fat + (Number(meal.data.fat)||0),
            fiber: a.fiber + (Number(meal.data.fiber)||0), sugar: a.sugar + (Number(meal.data.sugar)||0),
          }), { cal:0, pro:0, carb:0, fat:0, fiber:0, sugar:0 });
          return { w, m, mealsLen: meals.length };
        };

        const currStat = extract(dCurrStr);
        const prevStat = extract(dPrevStr);

        if(currStat.w) { cWeight+=currStat.w; cWCount++; }
        if(currStat.mealsLen > 0) {
          cCal+=currStat.m.cal; cPro+=currStat.m.pro; cCarb+=currStat.m.carb;
          cComp += ((Math.min(100, (currStat.m.cal/targetMacros.cal)*100)) + (Math.min(100, (currStat.m.pro/targetMacros.pro)*100))) / 2;
          cMCount++;
        }

        if(prevStat.w) { pWeight+=prevStat.w; pWCount++; }
        if(prevStat.mealsLen > 0) {
          pCal+=prevStat.m.cal; pPro+=prevStat.m.pro; pCarb+=prevStat.m.carb;
          pComp += ((Math.min(100, (prevStat.m.cal/targetMacros.cal)*100)) + (Math.min(100, (prevStat.m.pro/targetMacros.pro)*100))) / 2;
          pMCount++;
        }

        current.push({ label: lCurr, weight: currStat.w, macros: currStat.m });
        prev.push({ weight: prevStat.w, macros: prevStat.m });
      }

      return { 
        current, prev,
        summary: {
          curr: { w: cWCount ? cWeight/cWCount : 0, cal: cMCount ? cCal/cMCount : 0, carb: cMCount ? cCarb/cMCount : 0, comp: cMCount ? (cComp/cMCount).toFixed(0) : 0 },
          prev: { w: pWCount ? pWeight/pWCount : 0, cal: pMCount ? pCal/pMCount : 0, carb: pMCount ? pCarb/pMCount : 0, comp: pMCount ? (pComp/pMCount).toFixed(0) : 0 }
        }
      };
    }, [timeframe, currentDate, dailyLog, timeline]);

    const getTrendAnalysis = async () => {
      setAiTrendLoading(true);
      const prompt = `Elite Planner AI Koçu. Son ${timeframe==='week'?'7':'30'} gün ortalaması: Kilo ${chartData.summary.curr.w.toFixed(1)}kg, Kalori ${chartData.summary.curr.cal.toFixed(0)}kcal, Karb ${chartData.summary.curr.carb.toFixed(0)}g. 
Önceki dönem: Kilo ${chartData.summary.prev.w.toFixed(1)}kg, Kalori ${chartData.summary.prev.cal.toFixed(0)}kcal, Karb ${chartData.summary.prev.carb.toFixed(0)}g.
Kullanıcı hedefi: "${userProfile.goal}". Verileri karşılaştır ve 2 cümlelik samimi, motivasyon verici, "geçen döneme göre karbonhidratı azaltmışsın" tarzı düz metin analiz yap. JSON kullanma.`;
      
      const res = await callGemini(prompt);
      setAiTrendText(res);
      setAiTrendLoading(false);
    };

    const allWeights = [...chartData.current.map(d=>d.weight), ...(compareMode ? chartData.prev.map(d=>d.weight) : [])].filter(Boolean);
    const minW = allWeights.length ? Math.min(...allWeights) - 1 : 0;
    const maxW = allWeights.length ? Math.max(...allWeights) + 1 : 100;
    
    const getPointPos = (val, index, len) => {
      const x = len > 1 ? (index / (len - 1)) * 100 : 50;
      const y = maxW !== minW ? 100 - ((val - minW) / (maxW - minW)) * 100 : 50;
      return { x, y };
    };

    const getLinePoints = (dataset) => dataset.map((d, i) => {
      if(!d.weight) return ''; 
      const {x, y} = getPointPos(d.weight, i, dataset.length);
      return `${x},${y}`;
    }).filter(Boolean).join(' ');

    const metricMax = Math.max(
      ...chartData.current.map(d => d.macros[chartMetric]),
      ...(compareMode ? chartData.prev.map(d => d.macros[chartMetric]) : []),
      1
    );

    const heightM = userProfile.height / 100;
    const activeWeight = dailyLog[measureDate]?.weight || userProfile.weight;
    const bmi = activeWeight && heightM ? (activeWeight / (heightM * heightM)).toFixed(1) : 0;
    let bmiLabel = "Normal"; let bmiColor = "text-green-500 bg-green-50 border-green-200";
    if(bmi < 18.5) { bmiLabel = "Zayıf"; bmiColor = "text-blue-500 bg-blue-50 border-blue-200"; }
    else if(bmi > 25) { bmiLabel = "Fazla Kilolu"; bmiColor = "text-orange-500 bg-orange-50 border-orange-200"; }

    return (
      <div className="p-4 space-y-6 pb-24">
        
        {/* PHYSICAL MEASUREMENTS */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
           <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
             <div className="flex items-center gap-2">
               <Scale size={20} className="text-green-500"/>
               <h2 className="font-bold text-gray-800">Fiziksel Ölçümler</h2>
             </div>
             <button onClick={() => isEditingMetrics ? handleSaveLog() : setIsEditingMetrics(true)} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${isEditingMetrics ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
               {isEditingMetrics ? 'Kaydet' : 'Düzenle'}
             </button>
           </div>
           
           <div className="mb-4">
             <label className="text-[10px] text-gray-500 font-bold uppercase ml-1 block mb-1">Ölçüm Tarihi Seç</label>
             <input type="date" value={measureDate} onChange={e=>setMeasureDate(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-800 outline-none focus:border-green-400"/>
           </div>

           <div className="grid grid-cols-2 gap-4">
              {[{l: 'Kilo', k: 'weight'}, {l: 'Göğüs', k: 'chest'}, {l: 'Bel', k: 'waist'}, {l: 'Kol', k: 'arm'}, {l: 'Bacak', k: 'leg'}].map(f => (
                <div key={f.k}>
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wide ml-1 mb-1 block">{f.l}</label>
                  <input type="number" disabled={!isEditingMetrics} value={tempLog[f.k] ?? ''} onChange={e=>setTempLog({...tempLog, [f.k]: e.target.value})} className={`w-full border rounded-xl p-3 text-sm font-bold text-gray-800 outline-none transition-colors ${isEditingMetrics ? 'bg-white border-green-200 focus:border-green-500 shadow-inner' : 'bg-gray-50 border-gray-100 text-gray-500'}`}/>
                </div>
              ))}
           </div>
        </div>

        {/* BMI */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
           <div>
             <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-1"><Activity size={18} className="text-indigo-500"/> Vücut Kitle İndeksi</h2>
             <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${bmiColor}`}>{bmiLabel}</span>
           </div>
           <div className="text-right">
             <span className="text-3xl font-black text-gray-800">{bmi}</span>
             <span className="block text-[10px] text-gray-400 font-medium mt-1">({measureDate})</span>
           </div>
        </div>

        {/* CHART CONTROLS */}
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 space-y-3">
           <div className="flex gap-2">
             <button onClick={() => setTimeframe('week')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${timeframe === 'week' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-500 bg-gray-50 hover:bg-gray-100'}`}>Haftalık Görünüm</button>
             <button onClick={() => setTimeframe('month')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${timeframe === 'month' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-500 bg-gray-50 hover:bg-gray-100'}`}>Aylık Görünüm</button>
           </div>
           <div className="flex items-center justify-between px-2 pt-2 border-t border-gray-100">
             <span className="text-[10px] font-bold text-gray-500">Geçmişle Karşılaştır (Önceki Dönem)</span>
             <button onClick={() => setCompareMode(!compareMode)} className={`w-10 h-5 rounded-full relative transition-colors ${compareMode ? 'bg-green-500' : 'bg-gray-300'}`}>
                <span className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full transition-transform ${compareMode ? 'left-5' : 'left-1'}`}/>
             </button>
           </div>
        </div>

        {/* AI TREND ANALYSIS */}
        {compareMode && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-3xl shadow-sm border border-blue-100">
            <div className="flex justify-between items-center mb-3">
               <h3 className="font-bold text-blue-900 flex items-center gap-2"><Sparkles size={18}/> Trend Analizi</h3>
               <button onClick={getTrendAnalysis} disabled={aiTrendLoading} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm hover:bg-blue-500">
                 {aiTrendLoading ? 'Analiz Ediliyor...' : 'Yorumla'}
               </button>
            </div>
            {aiTrendText ? (
              <p className="text-xs text-blue-800 font-medium leading-relaxed bg-white/60 p-3 rounded-xl border border-blue-100">{aiTrendText}</p>
            ) : (
              <p className="text-[10px] text-blue-600/70 italic">Geçmiş ve güncel verilerini karşılaştırması için yapay zekaya sor.</p>
            )}
          </div>
        )}

        {/* WEIGHT CHART */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
           <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-2"><TrendingDown size={18} className="text-blue-500"/> Kilo Değişimi Grafiği</h2>
           <p className="text-[10px] text-gray-400 mb-4">{timeframe === 'week' ? 'Son 7 Gün' : 'Son 30 Gün'} {compareMode && ' (Kesik Çizgi: Önceki Dönem)'}</p>
           
           <div className="relative h-44 w-full flex flex-col bg-gray-50/50 rounded-xl overflow-hidden border border-gray-100">
            <div className="absolute inset-0 flex flex-col justify-between pt-4 pb-8 pointer-events-none px-4 opacity-10 z-0">
              {[...Array(4)].map((_,i) => <div key={i} className="w-full border-b border-blue-500"></div>)}
            </div>

            {allWeights.length > 0 ? (
              <div className="relative w-full h-[calc(100%-28px)] z-10 mt-2">
                <div className="absolute left-6 right-6 top-2 bottom-2">
                  <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                    {compareMode && <polyline points={getLinePoints(chartData.prev)} fill="none" stroke="#cbd5e1" strokeWidth={timeframe==='week' ? "2" : "1.5"} strokeDasharray="4" vectorEffect="non-scaling-stroke" />}
                    <polyline points={getLinePoints(chartData.current)} fill="none" stroke="#3b82f6" strokeWidth={timeframe==='week' ? "3" : "2"} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                  </svg>
                  
                  {timeframe === 'week' && chartData.current.map((d, i) => {
                    if (!d.weight) return null;
                    const {x, y} = getPointPos(d.weight, i, chartData.current.length);
                    return (
                      <div 
                        key={`c-${i}`} 
                        className="absolute w-2.5 h-2.5 bg-white border-2 border-blue-500 rounded-full shadow-sm" 
                        style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }} 
                      />
                    );
                  })}
                </div>
              </div>
            ) : <div className="flex-1 flex items-center justify-center text-xs text-gray-400">Veri Bulunamadı</div>}
            
            <div className="relative w-full h-6 flex justify-between z-10 border-t border-gray-200/50">
              <div className="absolute left-6 right-6 top-1">
                {chartData.current.map((d, i) => {
                  if (timeframe === 'month' && i % 5 !== 0 && i !== chartData.current.length-1) return null;
                  const {x} = getPointPos(d.weight || 0, i, chartData.current.length);
                  return (
                    <span 
                      key={i} 
                      className="absolute text-[9px] text-gray-500 font-bold transform -translate-x-1/2 whitespace-nowrap"
                      style={{ left: `${x}%` }}
                    >
                      {d.label}
                    </span>
                  );
                })}
              </div>
            </div>
           </div>
        </div>

        {/* COMPLIANCE */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
         <div>
           <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-1"><Target size={18} className="text-green-500"/> Hedef Uyum Oranı</h2>
           <p className="text-[10px] text-gray-400">{timeframe === 'week' ? 'Haftalık' : 'Aylık'} (Makro Hedefleri)</p>
         </div>
         <div className="flex gap-4">
           {compareMode && (
             <div className="flex flex-col items-center opacity-50">
               <span className="text-[9px] font-bold uppercase tracking-wider mb-1">Önceki</span>
               <span className="text-xl font-bold text-gray-500">%{chartData.summary.prev.comp}</span>
             </div>
           )}
           <div className="flex flex-col items-center">
               <span className="text-[9px] font-bold uppercase tracking-wider mb-1 text-green-600">Bu Dönem</span>
               <span className="text-2xl font-black text-green-500">%{chartData.summary.curr.comp}</span>
           </div>
         </div>
        </div>

        {/* MACRO/MICRO BAR CHART */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
           <div className="flex justify-between items-center mb-4">
             <h2 className="font-bold text-gray-800 flex items-center gap-2"><Filter size={18} className="text-purple-500"/> Makro/Mikro</h2>
             <select value={chartMetric} onChange={e=>setChartMetric(e.target.value)} className="bg-purple-50 text-purple-700 font-bold text-xs p-2 rounded-xl outline-none border border-purple-100">
                <option value="cal">Kalori</option><option value="pro">Protein</option>
                <option value="carb">Karb</option><option value="fat">Yağ</option>
                <option value="fiber">Lif</option><option value="sugar">Şeker</option>
             </select>
           </div>

           <div className="flex items-end h-44 gap-1 mt-4 px-1 pb-4 border-b border-gray-100 relative">
             {chartData.current.map((d, i) => {
               const currVal = d.macros[chartMetric];
               const prevVal = compareMode ? chartData.prev[i]?.macros[chartMetric] : null;
               
               const cHeight = currVal ? (currVal / metricMax) * 100 : 0;
               const pHeight = prevVal ? (prevVal / metricMax) * 100 : 0;

               return (
                 <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                   <div className="flex items-end w-full gap-[1px] h-full">
                     {compareMode && <div className="flex-1 bg-purple-200 rounded-t-sm transition-all duration-500" style={{ height: `${pHeight}%` }}></div>}
                     <div className="flex-1 bg-purple-500 rounded-t-sm transition-all duration-500" style={{ height: `${cHeight}%` }}></div>
                   </div>
                   {timeframe === 'week' && <span className="text-[9px] text-gray-400 font-bold mt-1">{d.label}</span>}
                 </div>
               )
             })}
           </div>
           {compareMode && (
             <div className="flex justify-center gap-4 mt-3">
               <div className="flex items-center gap-1"><div className="w-3 h-3 bg-purple-200 rounded-sm"></div><span className="text-[9px] font-bold text-gray-500">Önceki Dönem</span></div>
               <div className="flex items-center gap-1"><div className="w-3 h-3 bg-purple-500 rounded-sm"></div><span className="text-[9px] font-bold text-gray-500">Bu Dönem</span></div>
             </div>
           )}
        </div>

      </div>
    );
  };

  // --- 5. PERFORMANS SEKME ---
  const TabPerformans = () => {
    const [goalText, setGoalText] = useState("");
    const [loading, setLoading] = useState(false);

    const generateFeedback = async () => {
      setLoading(true);
      const prompt = `Elite Planner koçusun. Kullanıcı: ${userProfile.height}cm, ${userProfile.weight}kg, ${userProfile.age} yaş, ${userProfile.dietType} uyguluyor. Hedefi: "${goalText}". 1 paragraflık net antrenman ve beslenme stratejisi önerisi yap.`;
      const response = await callGemini(prompt);
      
      setPerformanceHistory([{ date: selectedDateStr, goal: goalText, feedback: response }, ...performanceHistory]);
      setGoalText("");
      setLoading(false);
    };

    return (
       <div className="p-4 space-y-6 pb-24">
         <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-3xl shadow-lg relative overflow-hidden text-white">
           <Flame size={120} className="absolute -bottom-4 -right-4 text-white opacity-10 pointer-events-none"/>
           <h3 className="font-bold mb-2 flex items-center gap-2 text-lg"><Sparkles size={20}/> Yeni Hedef & AI Koçu</h3>
           <p className="text-xs text-indigo-100 mb-4 leading-relaxed font-medium">Manuel olarak bir hedef girin. Yapay zeka tüm verilerinizi sentezleyip bir rota çizsin.</p>
           
           <textarea value={goalText} onChange={e => setGoalText(e.target.value)} className="w-full bg-white/20 border-none rounded-xl p-4 text-sm h-24 resize-none focus:bg-white/30 outline-none mb-4 text-white placeholder-indigo-200 transition-colors" placeholder="Örn: SQL çalışırken çok oturuyorum, sırt ağrılarım var ve yaza kadar fit olmak istiyorum..."/>
           
           <button onClick={generateFeedback} disabled={loading || !goalText} className="w-full bg-white text-indigo-700 rounded-xl p-3 font-bold text-sm flex justify-center items-center shadow-lg hover:bg-gray-50 disabled:opacity-50 transition-all">
             {loading ? <span className="animate-pulse">Analiz Ediliyor...</span> : 'Strateji Oluştur & Kaydet'}
           </button>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 px-2"><History size={18}/> Geçmiş Analizler</h3>
          {performanceHistory.length === 0 ? (
            <p className="text-sm text-gray-400 font-medium italic px-2">Henüz bir hedef analizi oluşturmadınız.</p>
          ) : (
            performanceHistory.map((hist, i) => (
              <div key={i} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{hist.date}</span>
                </div>
                <h4 className="text-sm font-bold text-gray-800 mb-2">Hedef: <span className="font-medium italic">"{hist.goal}"</span></h4>
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-xs text-gray-700 leading-relaxed font-medium">{hist.feedback}</p>
                </div>
              </div>
            ))
          )}
        </div>
       </div>
    );
  };

  // --- 6. PROFIL SEKME ---
  const TabProfil = () => {
    const [isEditingProf, setIsEditingProf] = useState(false);
    const [tempProf, setTempProf] = useState(userProfile);

    const handleSave = () => {
      setUserProfile(tempProf);
      setIsEditingProf(false);
    };

    return (
      <div className="p-4 space-y-6 pb-24">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center relative">
           <div className="w-24 h-24 bg-gray-100 rounded-full border-4 border-white shadow-lg flex items-center justify-center mb-4 text-gray-400 relative overflow-hidden group">
             {tempProf.profilePic ? <img src={tempProf.profilePic} className="w-full h-full object-cover" /> : <User size={40} />}
             <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center cursor-pointer transition-all">
                <Camera size={20} className="text-white"/>
             </div>
             <input disabled={!isEditingProf} type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files[0], (b64) => setTempProf({...tempProf, profilePic: b64}))} className={`absolute inset-0 opacity-0 z-10 ${isEditingProf ? 'cursor-pointer' : 'pointer-events-none'}`} />
           </div>
           
           {isEditingProf ? (
             <input type="text" value={tempProf.name} onChange={e=>setTempProf({...tempProf, name: e.target.value})} className="text-xl font-bold text-center text-gray-800 outline-none border-b border-blue-400 bg-gray-50 px-2 rounded-t-md"/>
           ) : (
             <h2 className="text-xl font-bold text-gray-800">{userProfile.name}</h2>
           )}
           <p className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full mt-2">Satış Departmanı & Takım Elbiseli</p>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
           <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
             <h3 className="font-bold text-gray-800 flex items-center gap-2"><User size={18} className="text-blue-500"/> Temel Veriler</h3>
             <button onClick={() => isEditingProf ? handleSave() : setIsEditingProf(true)} className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${isEditingProf ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
               {isEditingProf ? 'Kaydet' : 'Düzenle'}
             </button>
           </div>
           <div className="grid grid-cols-2 gap-4">
              {[ {l: 'Yaş', k: 'age'}, {l: 'Boy (cm)', k: 'height'}, {l: 'Kilo (kg)', k: 'weight'} ].map(f => (
                <div key={f.k}>
                  <label className="text-[10px] text-gray-500 font-bold uppercase ml-1 block mb-1">{f.l}</label>
                  <input type="number" disabled={!isEditingProf} value={tempProf[f.k] ?? ''} onChange={e=>setTempProf({...tempProf, [f.k]: e.target.value})} className={`w-full border rounded-xl p-3 text-sm font-bold text-gray-800 outline-none transition-colors ${isEditingProf ? 'bg-white border-blue-200 focus:border-blue-500 shadow-inner' : 'bg-gray-50 border-gray-100 text-gray-500'}`}/>
                </div>
              ))}
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900 selection:bg-green-200">
      <div className="max-w-md mx-auto min-h-screen bg-slate-50 shadow-2xl relative overflow-hidden flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
          {activeTab === 'planlama' && <TabPlanlama />}
          {activeTab === 'egzersiz' && <TabEgzersiz />}
          {activeTab === 'beslenme' && <TabBeslenme />}
          {activeTab === 'analiz' && <TabAnaliz />}
          {activeTab === 'performans' && <TabPerformans />}
          {activeTab === 'profil' && <TabProfil />}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}