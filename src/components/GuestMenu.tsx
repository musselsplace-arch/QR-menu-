import React, { useState, useMemo } from 'react';
import { 
  Croissant, Salad, Sandwich, Wine, Cake, Heart, Search, 
  Star, X, Sparkles, Send, Coffee, Utensils, QrCode, Printer, Download, ExternalLink
} from 'lucide-react';
import { MenuItem, Table, Review } from '../types';
import { CATEGORIES } from '../data';
import { getTranslatedItem, categoryTranslations, uiTranslations } from '../translations';

interface GuestMenuProps {
  items: MenuItem[];
  table?: Table;
  onSubmitReview?: (review: Omit<Review, 'id' | 'date'>) => void;
  isSimulatedMobile?: boolean;
}

export default function GuestMenu({ 
  items, 
  table, 
  onSubmitReview,
  isSimulatedMobile = false
}: GuestMenuProps) {
  const [lang, setLang] = useState<'ka' | 'en' | 'ru'>('ka');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'menu' | 'favorites' | 'feedback'>('menu');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  
  // QR Modal and Print Actions
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrColor, setQrColor] = useState('#000000');
  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://menu.ge';
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=${qrColor.replace('#', '')}&data=${encodeURIComponent(originUrl)}`;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>BLACK CAT - QR Code</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Fira+GO:wght@400;500;600;700&display=swap');
            body {
              font-family: 'Fira GO', sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background-color: #ffffff;
              color: #111827;
            }
            .card {
              border: 3px double #d97706;
              border-radius: 20px;
              padding: 40px;
              text-align: center;
              max-width: 380px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.03);
            }
            .header {
              font-size: 24px;
              font-weight: 800;
              color: #111827;
              margin-bottom: 4px;
              letter-spacing: 0.5px;
            }
            .subtitle {
              font-size: 11px;
              color: #d97706;
              margin-bottom: 25px;
              font-weight: 750;
              letter-spacing: 2.5px;
              text-transform: uppercase;
            }
            .qr-container {
              background: #ffffff;
              padding: 16px;
              border-radius: 16px;
              display: inline-block;
              border: 2px solid #f3f4f6;
              margin-bottom: 25px;
            }
            .instruction {
              font-size: 15px;
              font-weight: 700;
              margin-bottom: 8px;
              color: #1f2937;
            }
            .sub-instruction {
              font-size: 11px;
              color: #6b7280;
              max-width: 255px;
              margin: 0 auto;
              line-height: 1.5;
            }
            @media print {
              body { background: none; }
              .card { box-shadow: none; border: 3px double #000; }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">BLACK CAT</div>
            <div class="subtitle">Bistro & Wine Bar</div>
            <div class="qr-container">
              <img src="${qrImageUrl}" alt="QR Menu" width="220" height="220" />
            </div>
            <div class="instruction">დაასკანირეთ მენიუს სანახავად</div>
            <div class="sub-instruction">გაეცანით ჩვენს დახვეწილ ციფრულ მენიუს, შეარჩიეთ საყვარელი გემოები და შეუკვეთეთ ბართან.</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = () => {
    window.open(qrImageUrl, '_blank');
  };

  // Review State
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewGuest, setReviewGuest] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const t = uiTranslations[lang];

  const getCategoryIcon = (iconName: string, className = "w-4 h-4") => {
    switch (iconName) {
      case 'Croissant': return <Croissant className={className} />;
      case 'Salad': return <Salad className={className} />;
      case 'Sandwich': return <Sandwich className={className} />;
      case 'Wine': return <Wine className={className} />;
      case 'Cake': return <Cake className={className} />;
      case 'Utensils': return <Utensils className={className} />;
      case 'CupSoda': return <Coffee className={className} />;
      default: return <Salad className={className} />;
    }
  };

  // Get all unique tags (translated on the fly or used natively)
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    items.forEach(item => {
      // Get translated version to extract native tags
      const transItem = getTranslatedItem(item, lang);
      transItem.tags.forEach(t => tagsSet.add(t));
    });
    return Array.from(tagsSet);
  }, [items, lang]);

  // Translate and filter items
  const translatedFilteredItems = useMemo(() => {
    return items
      .filter(item => item.isAvailable)
      .map(item => getTranslatedItem(item, lang))
      .filter(item => {
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        const matchesTag = selectedTag === 'all' || item.tags.includes(selectedTag);
        
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = 
          item.name.toLowerCase().includes(searchLower) || 
          item.description.toLowerCase().includes(searchLower);

        return matchesCategory && matchesTag && matchesSearch;
      });
  }, [items, selectedCategory, selectedTag, searchQuery, lang]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(favId => favId !== id) : [...prev, id]
    );
  };

  const favoriteItems = useMemo(() => {
    return items
      .filter(item => favorites.includes(item.id))
      .map(item => getTranslatedItem(item, lang));
  }, [items, favorites, lang]);

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewGuest.trim() || !reviewComment.trim()) return;
    
    if (onSubmitReview) {
      onSubmitReview({
        rating: reviewRating,
        comment: reviewComment,
        guestName: reviewGuest
      });
    }

    setReviewSuccess(true);
    setTimeout(() => {
      setReviewSuccess(false);
      setReviewComment('');
      setReviewGuest('');
      setReviewRating(5);
    }, 4000);
  };

  return (
    <div className={`relative flex flex-col bg-[#FAF9F6] h-full overflow-hidden text-slate-800 ${
      isSimulatedMobile ? 'w-full rounded-[40px] border-[12px] border-slate-900 shadow-2xl overflow-hidden' : 'min-h-screen'
    }`}>
      
      {/* Phone Camera Notch simulator in mobile template */}
      {isSimulatedMobile && (
        <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 flex justify-center items-center z-50">
          <div className="w-20 h-4 bg-black rounded-b-xl"></div>
        </div>
      )}

      {/* Screen Header */}
      <div className={`bg-white border-b border-slate-100 px-5 pt-7 pb-4 shrink-0 shadow-xs ${
        isSimulatedMobile ? 'mt-6' : 'pt-8'
      }`}>
        
        {/* Language & Utilities Header Bar */}
        <div className="flex justify-between items-center mb-3 border-b border-slate-100/60 pb-2">
          {/* Printable QR Code Button */}
          <button
            onClick={() => setShowQRModal(true)}
            className="px-2.5 py-1.5 bg-slate-900 border-none hover:bg-slate-800 text-[10px] font-bold text-white rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <QrCode className="w-3.5 h-3.5 text-amber-500" />
            <span>QR კოდი ბეჭდვისთვის</span>
          </button>

          {/* Languages Selector */}
          <div className="flex gap-1.5">
            <button
              onClick={() => setLang('ka')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                lang === 'ka' 
                  ? 'bg-amber-600 text-white shadow-xs' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/50'
              }`}
            >
              🇬🇪 ქართული
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                lang === 'en' 
                  ? 'bg-amber-600 text-white shadow-xs' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/50'
              }`}
            >
              🇬🇧 English
            </button>
            <button
              onClick={() => setLang('ru')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                lang === 'ru' 
                  ? 'bg-amber-600 text-white shadow-xs' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/50'
              }`}
            >
              🇷🇺 Русский
            </button>
          </div>
        </div>

        <div className="flex justify-between items-start">
          <div className="space-y-0.5">
            <span className="text-[10px] tracking-widest text-amber-600 font-bold uppercase font-sans">
              Bistro & Wine Bar
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 font-serif">
              {t.welcome}
            </h1>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 rounded-full px-3 py-1 border border-amber-200/50">
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span className="text-xs font-semibold text-amber-800">
              Black Cat
            </span>
          </div>
        </div>
        
        {/* Universal Localized Welcome Greeting */}
        <p className="text-[11px] text-slate-500 italic mt-2.5 bg-slate-50 rounded-lg p-2 border-l-2 border-amber-500/65 line-clamp-2">
          {lang === 'ka' && '„მოხარულნი ვართ გიმასპინძლოთ ჩვენს მყუდრო სივრცეში!“'}
          {lang === 'en' && '“We are delighted to host you in our cozy space!”'}
          {lang === 'ru' && '«Мы рады приветствовать вас в нашем уютном заведении!»'}
        </p>
      </div>

      {/* Navigation Tabs for Guest Menu */}
      <div className="flex bg-white px-2 border-b border-slate-100 shrink-0 text-xs font-bold text-slate-500">
        <button 
          onClick={() => setActiveTab('menu')}
          className={`flex-1 py-3 text-center border-b-2 transition-colors cursor-pointer ${
            activeTab === 'menu' 
              ? 'border-amber-600 text-slate-900 font-bold' 
              : 'border-transparent hover:text-slate-800'
          }`}
        >
          {t.menu}
        </button>
        <button 
          onClick={() => setActiveTab('favorites')}
          className={`flex-1 py-3 text-center border-b-2 transition-colors flex justify-center items-center gap-1 cursor-pointer ${
            activeTab === 'favorites' 
              ? 'border-amber-600 text-slate-900 font-bold' 
              : 'border-transparent hover:text-slate-800'
          }`}
        >
          {t.favorites}
          {favorites.length > 0 && (
            <span className="inline-flex items-center justify-center bg-amber-500 text-white font-bold text-[9px] w-4.5 h-4.5 rounded-full">
              {favorites.length}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('feedback')}
          className={`flex-1 py-3 text-center border-b-2 transition-colors cursor-pointer ${
            activeTab === 'feedback' 
              ? 'border-amber-600 text-slate-900 font-bold' 
              : 'border-transparent hover:text-slate-800'
          }`}
        >
          {t.feedback}
        </button>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto pb-16 p-4 space-y-4">
        
        {activeTab === 'menu' && (
          <>
            {/* Elegant Disclaimer Card: Order directly at the bar! */}
            <div className="bg-amber-50/60 border border-amber-200/50 rounded-2xl p-3.5 flex items-start gap-2.5 shadow-3xs">
              <span className="text-base leading-none">🛎️</span>
              <div className="space-y-0.5">
                <h4 className="text-[11px] font-bold text-amber-900">{t.barDisclaimer}</h4>
                <p className="text-[10px] text-slate-500 leading-normal">{t.barDisclaimerDesc}</p>
              </div>
            </div>

            {/* Search and Tag filter controls */}
            <div className="space-y-3">
              {/* Search input with icons */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white pl-10 pr-4 py-2.5 rounded-2xl text-xs border border-slate-200/80 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500/20 shadow-sm"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
                  >
                    წაშლა
                  </button>
                )}
              </div>

              {/* Category selector row */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none snap-x -mx-1 px-1">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold snap-start whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                    selectedCategory === 'all' 
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm' 
                      : 'bg-white text-slate-600 border-slate-200/70 hover:border-slate-300'
                  }`}
                >
                  {t.allDishes}
                </button>
                {CATEGORIES.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold snap-start whitespace-nowrap transition-all border flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      selectedCategory === category.id 
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm' 
                        : 'bg-white text-slate-600 border-slate-200/70 hover:border-slate-300'
                    }`}
                  >
                    {getCategoryIcon(category.iconName, "w-3.5 h-3.5")}
                    {categoryTranslations[category.id]?.[lang] || category.nameEng}
                  </button>
                ))}
              </div>

              {/* Tag filters selector */}
              {allTags.length > 0 && (
                <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none snap-x">
                  <button
                    onClick={() => setSelectedTag('all')}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-full snap-start whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                      selectedTag === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t.allDiets}
                  </button>
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-full snap-start whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
                        selectedTag === tag
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Menu Items Count display */}
            <div className="flex justify-between items-center px-1 text-[11px] text-slate-400 font-medium">
              <span>{t.shownItems.replace('{count}', String(translatedFilteredItems.length))}</span>
              {selectedTag !== 'all' || selectedCategory !== 'all' ? (
                <button 
                  onClick={() => { setSelectedCategory('all'); setSelectedTag('all'); }} 
                  className="text-amber-600 font-semibold hover:underline cursor-pointer text-[10px]"
                >
                  {t.clearFilters}
                </button>
              ) : null}
            </div>

            {/* Custom TEXT-ONLY Dishes list grid (COMPLETELY REMOVED ALL PICTURES!) */}
            {translatedFilteredItems.length > 0 ? (
              <div className="space-y-3.5 animate-fadeIn">
                {translatedFilteredItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="bg-white border border-slate-100/80 rounded-2xl p-4 shadow-3xs hover:shadow-xs cursor-pointer transition-all duration-300 flex flex-col justify-between hover:border-amber-500/25 relative group"
                  >
                    {/* Upper content */}
                    <div className="space-y-1 pr-10">
                      <div className="flex items-start gap-1.5 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight leading-tight group-hover:text-amber-700 transition-colors">
                          {item.name}
                        </h3>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-sans mt-1">
                        {item.description}
                      </p>
                    </div>

                    {/* Lower content: Price and Tags */}
                    <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-50/80">
                      {/* Price fields */}
                      {item.priceGlass || item.priceBottle ? (
                        <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                          {item.priceGlass && (
                            <span className="bg-amber-50/60 text-amber-800 border border-amber-200/40 rounded-lg px-2 py-0.5 font-sans">
                              🍷 {t.glass}: {item.priceGlass}₾
                            </span>
                          )}
                          {item.priceBottle && (
                            <span className="bg-amber-50/60 text-amber-800 border border-amber-200/40 rounded-lg px-2 py-0.5 font-sans">
                              🍾 {t.bottle}: {item.priceBottle}₾
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="font-extrabold text-slate-900 text-xs bg-slate-100/70 px-2 py-0.5 rounded-md">
                          {item.price} ₾
                        </span>
                      )}

                      {/* Displaying tags list */}
                      <div className="flex gap-1 flex-wrap justify-end">
                        {item.tags.map(tag => (
                          <span 
                            key={tag}
                            className="text-[9px] font-bold bg-amber-50/40 border border-amber-100/30 text-amber-800/85 rounded-md px-2 py-0.5"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Absolute Heart Favorite button */}
                    <button
                      onClick={(e) => toggleFavorite(item.id, e)}
                      className="absolute top-4 right-4 bg-slate-50 border border-slate-100 hover:border-rose-100 hover:bg-rose-50/30 p-2 rounded-xl text-slate-600 transition-all active:scale-90 cursor-pointer"
                    >
                      <Heart 
                        className={`w-3.5 h-3.5 transition-colors ${
                          favorites.includes(item.id) ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
                        }`} 
                      />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center bg-white border border-dashed border-slate-200 rounded-3xl p-10 space-y-3 shadow-3xs">
                <div className="text-3xl">🍽️</div>
                <h4 className="text-sm font-bold text-slate-700">{t.emptySearchTitle}</h4>
                <p className="text-xs text-slate-400 max-w-[200px] mx-auto leading-relaxed">
                  {t.emptySearchDesc}
                </p>
              </div>
            )}
          </>
        )}

        {/* Favorites Tab - NO IMAGES */}
        {activeTab === 'favorites' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-amber-50/40 border border-amber-200/30 rounded-2xl p-4 text-center">
              <h3 className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-1">
                {t.favoritesTitle}
              </h3>
              <p className="text-[11px] text-slate-500 leading-normal">
                {t.favoritesDesc}
              </p>
            </div>

            {favoriteItems.length > 0 ? (
              <div className="space-y-3">
                {favoriteItems.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="bg-white border border-slate-100 rounded-2xl p-3.5 shadow-3xs flex items-center justify-between gap-4 cursor-pointer hover:shadow-2xs transition-all relative"
                  >
                    <div className="space-y-1 flex-1 pr-6">
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{item.name}</h4>
                      <p className="text-[10px] text-slate-500 line-clamp-1">{item.description}</p>
                      
                      {/* Price output */}
                      {item.priceGlass || item.priceBottle ? (
                        <div className="flex gap-2 text-[9px] font-bold mt-1 text-amber-800">
                          {item.priceGlass && <span>🍷 {t.glass}: {item.priceGlass}₾</span>}
                          {item.priceBottle && <span>🍾 {t.bottle}: {item.priceBottle}₾</span>}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-950 font-extrabold mt-1">{item.price} ₾</p>
                      )}
                    </div>
                    
                    <button
                      onClick={(e) => toggleFavorite(item.id, e)}
                      className="text-slate-400 hover:text-rose-500 p-2 rounded-xl hover:bg-slate-50 shrink-0 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* Info summary about how to order (REMOVED CALL WAITER / ONLINE ORDERING!) */}
                <div className="bg-slate-900 text-white rounded-2xl p-4.5 space-y-3.5 shadow-sm mt-6">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span>{t.orderTotal.replace('{count}', String(favorites.length))}</span>
                    <span className="font-extrabold text-amber-400 text-sm">
                      {favoriteItems.reduce((acc, current) => acc + (current.price || current.priceGlass || 0), 0)} ₾
                    </span>
                  </div>
                  
                  <div className="border-t border-slate-800 pt-3 flex items-start gap-2.5">
                    <span className="text-sm">🛎️</span>
                    <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
                      {t.orderInstructions}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center bg-white border border-dashed border-slate-200 rounded-3xl p-12 space-y-3 shadow-3xs">
                <Heart className="w-8 h-8 text-rose-300 mx-auto fill-rose-50" />
                <h4 className="text-xs font-bold text-slate-700">{t.emptyFavoritesTitle}</h4>
                <p className="text-[11px] text-slate-400 max-w-[190px] mx-auto leading-relaxed">
                  {t.emptyFavoritesDesc}
                </p>
                <button
                  onClick={() => setActiveTab('menu')}
                  className="mt-2 text-xs font-bold text-amber-600 hover:text-amber-700 cursor-pointer underline"
                >
                  {t.backToMenu}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-3xs space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-slate-900">{t.feedbackTitle}</h3>
                <p className="text-[11px] text-slate-400 leading-normal">{t.feedbackDesc}</p>
              </div>

              {reviewSuccess ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center space-y-2 py-6">
                  <span className="text-2xl">🎉</span>
                  <p className="text-xs font-bold text-emerald-800">{t.feedbackSuccessTitle}</p>
                  <p className="text-[10px] text-slate-500 max-w-[200px] mx-auto leading-relaxed">
                    {t.feedbackSuccessDesc}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  {/* Rating selection Stars */}
                  <div className="flex flex-col items-center gap-1.5 bg-slate-50/60 p-3 rounded-xl border border-slate-100/55">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.ratingsPlaceholder}</span>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="text-amber-400 hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                        >
                          <Star 
                            className={`w-6.5 h-6.5 ${
                              star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                            }`} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Guest Name input */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">{t.yourName}</label>
                    <input
                      type="text"
                      placeholder={t.yourNamePlaceholder}
                      value={reviewGuest}
                      onChange={(e) => setReviewGuest(e.target.value)}
                      required
                      className="w-full bg-white px-3.5 py-2.5 rounded-xl text-xs border border-slate-200/80 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500/10"
                    />
                  </div>

                  {/* Review comment */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">{t.commentLabel}</label>
                    <textarea
                      rows={3}
                      placeholder={t.commentPlaceholder}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      required
                      className="w-full bg-white px-3.5 py-2.5 rounded-xl text-xs border border-slate-200/80 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500/10 resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {t.sendFeedback}
                  </button>
                </form>
              )}
            </div>
            
            <div className="text-center text-[10px] text-slate-400 max-w-[200px] mx-auto py-2">
              Bistro & Wine Bar © 2026. ყველა უფლება დაცულია.
            </div>
          </div>
        )}

      </div>

      {/* Detail Showcase Modal for Menu Item (COMPLETELY REMOVED IMAGE BANNER!) */}
      {selectedItem && (() => {
        const transItem = getTranslatedItem(selectedItem, lang);
        return (
          <div className="absolute inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 p-0 md:p-4 animate-fadeIn">
            <div className="bg-white w-full md:max-w-md md:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-slideUp border border-slate-100">
              
              {/* Premium Header area with NO images */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 relative">
                <div className="space-y-0.5">
                  <span className="inline-block bg-amber-50 text-amber-800 text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md mb-1.5">
                    {categoryTranslations[selectedItem.category]?.[lang] || selectedItem.category}
                  </span>
                  
                  <h2 className="text-base font-bold text-slate-900 leading-tight">
                    {transItem.name}
                  </h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide font-serif">
                    {selectedItem.nameEng}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedItem(null)}
                  className="bg-slate-200/50 text-slate-700 hover:bg-slate-200 p-2 rounded-full transition-colors cursor-pointer shrink-0 absolute top-5 right-5"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 flex-1 overflow-y-auto space-y-4">
                {/* Story Description */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{t.descriptionLabel}</span>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100">
                    {transItem.description}
                  </p>
                </div>

                {/* Specific features list */}
                <div className="flex gap-1.5 flex-wrap">
                  {transItem.tags.map(tag => (
                    <span 
                      key={tag}
                      className="text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200/50 rounded-lg px-2.5 py-1"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Modal Footer (Action Panel) */}
              <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between shrink-0">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">{t.price}</span>
                  {selectedItem.priceGlass || selectedItem.priceBottle ? (
                    <div className="flex gap-2 text-[10px] mt-1.5">
                      {selectedItem.priceGlass && (
                        <span className="bg-white border border-slate-200/60 rounded-lg px-2.5 py-1 text-slate-700 font-bold shadow-3xs">
                          {t.glass}: <span className="text-amber-800">{selectedItem.priceGlass}₾</span>
                        </span>
                      )}
                      {selectedItem.priceBottle && (
                        <span className="bg-white border border-slate-200/60 rounded-lg px-2.5 py-1 text-slate-700 font-bold shadow-3xs">
                          {t.bottle}: <span className="text-amber-800">{selectedItem.priceBottle}₾</span>
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-[15px] font-extrabold text-slate-900">{selectedItem.price} ₾</p>
                  )}
                </div>
                
                <button
                  onClick={(e) => {
                    toggleFavorite(selectedItem.id, e);
                    setSelectedItem(null);
                  }}
                  className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    favorites.includes(selectedItem.id) 
                      ? 'bg-rose-50 border border-rose-200 text-rose-700' 
                      : 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${favorites.includes(selectedItem.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                  {favorites.includes(selectedItem.id) ? t.removeFromFavorites : t.addToFavorites}
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Elegant QR Code Generator and Print Modal */}
      {showQRModal && (
        <div className="absolute inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 p-2 md:p-4 animate-fadeIn">
          <div className="bg-white w-full md:max-w-md md:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] animate-slideUp border border-slate-100">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 relative">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-amber-600 animate-pulse" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest font-sans">
                  მენიუს QR კოდი
                </h3>
              </div>
              <button
                onClick={() => setShowQRModal(false)}
                className="bg-slate-200/60 hover:bg-slate-200 text-slate-700 p-1.5 rounded-full transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex-1 overflow-y-auto space-y-5">
              <p className="text-[11px] text-slate-400 leading-normal text-center">
                დაბეჭდეთ ეს QR კოდი მაგიდებისთვის. სტუმრები სკანირებისას პირდაპირ ამ გვერდს გახსნიან მობილურით.
              </p>

              {/* Physical Card Preview Wrapper */}
              <div className="border-2 border-double border-amber-600/30 rounded-2xl p-5 flex flex-col items-center text-center bg-slate-50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-amber-600/20 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-amber-600/20 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-amber-600/20 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-amber-600/20 rounded-br-lg"></div>

                <h4 className="text-base font-bold text-slate-900 tracking-wide font-serif">
                  BLACK CAT
                </h4>
                <p className="text-[9px] text-amber-600 font-bold tracking-widest uppercase mb-4">
                  Bistro & Wine Bar
                </p>

                {/* QR Core Box */}
                <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-150 inline-flex items-center justify-center">
                  <img 
                    src={qrImageUrl} 
                    alt="Menu QR"
                    className="w-40 h-40 block rounded-md"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="mt-4">
                  <p className="text-[11px] font-bold text-slate-800">დაასკანირეთ მენიუს სანახავად</p>
                  <p className="text-[9px] text-slate-400 mt-1 max-w-[210px] mx-auto leading-normal">
                    მადისმომგვრელი დახვეწილი ციფრული მენიუ
                  </p>
                </div>
              </div>

              {/* QR Code Color presets selection */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                  QR კოდის გამოსახულების ფერი
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { color: '#000000', label: 'შავი' },
                    { color: '#b45309', label: 'ოქროსფერი' },
                    { color: '#1e3a8a', label: 'ლურჯი' },
                    { color: '#14532d', label: 'მწვანე' }
                  ].map(preset => (
                    <button
                      key={preset.color}
                      onClick={() => setQrColor(preset.color)}
                      className={`py-1 rounded-lg text-[9px] font-bold border transition-all cursor-pointer ${
                        qrColor === preset.color 
                          ? 'bg-slate-900 text-white border-slate-900' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                      style={{ borderLeftWidth: '3px', borderLeftColor: preset.color }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer (Action Panel) */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2 shrink-0">
              <button
                onClick={handleDownload}
                className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ჩამოტვირთვა</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white border-none font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>დაბეჭდვა</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
