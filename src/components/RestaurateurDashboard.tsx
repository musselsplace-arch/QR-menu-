import React, { useState } from 'react';
import { 
  Plus, Edit, Trash2, Check, X, ToggleLeft, ToggleRight, 
  Settings, UserCheck, HelpCircle, ChevronRight, MessageSquare, 
  Store, ListFilter, AlertCircle, ChefHat, Tag, DollarSign, RefreshCw, BellRing, Star
} from 'lucide-react';
import { MenuItem, Table, Category, Review } from '../types';
import { CATEGORIES } from '../data';
import QRCodeComponent from './QRCodeComponent';

interface RestaurateurDashboardProps {
  items: MenuItem[];
  tables: Table[];
  reviews: Review[];
  waiterNotifications: Array<{ id: string; tableNumber: number; requestType: string; time: string }>;
  selectedTableForQR: Table;
  appUrl: string;
  onUpdateItem: (updatedItem: MenuItem) => void;
  onAddItem: (newItem: Omit<MenuItem, 'id'>) => void;
  onUpdateTableGreeting: (tableId: string, greeting: string) => void;
  onClearNotification: (id: string) => void;
  onClearAllNotifications: () => void;
  onTableSelect: (table: Table) => void;
  onSimulateScan: (tableId: string) => void;
}

export default function RestaurateurDashboard({
  items,
  tables,
  reviews,
  waiterNotifications,
  selectedTableForQR,
  appUrl,
  onUpdateItem,
  onAddItem,
  onUpdateTableGreeting,
  onClearNotification,
  onClearAllNotifications,
  onTableSelect,
  onSimulateScan
}: RestaurateurDashboardProps) {
  
  const [activeTab, setActiveTab] = useState<'items' | 'tables' | 'notifications' | 'reviews'>('items');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Custom item adding state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemNameGeo, setNewItemNameGeo] = useState('');
  const [newItemNameEng, setNewItemNameEng] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('breakfast-starters');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemPrice, setNewItemPrice] = useState(15);
  const [newItemPriceGlass, setNewItemPriceGlass] = useState<number | undefined>(undefined);
  const [newItemPriceBottle, setNewItemPriceBottle] = useState<number | undefined>(undefined);
  const [newItemTags, setNewItemTags] = useState('');
  const [newItemImage, setNewItemImage] = useState('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80');

  // Edit item state
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Table greeting editing state
  const [editingTableGreetingId, setEditingTableGreetingId] = useState<string | null>(null);
  const [tempGreetingText, setTempGreetingText] = useState('');

  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemNameGeo.trim() || !newItemDescription.trim()) return;

    onAddItem({
      nameGeo: newItemNameGeo,
      nameEng: newItemNameEng || 'New Dish',
      category: newItemCategory,
      description: newItemDescription,
      price: Number(newItemPrice),
      priceGlass: newItemPriceGlass,
      priceBottle: newItemPriceBottle,
      isAvailable: true,
      tags: newItemTags ? newItemTags.split(',').map(t => t.trim()) : ['ახალი'],
      image: newItemImage
    });

    // Reset fields
    setNewItemNameGeo('');
    setNewItemNameEng('');
    setNewItemCategory('breakfast-starters');
    setNewItemDescription('');
    setNewItemPrice(15);
    setNewItemPriceGlass(undefined);
    setNewItemPriceBottle(undefined);
    setNewItemTags('');
    setShowAddModal(false);
  };

  const startEditItem = (item: MenuItem) => {
    setEditingItem({ ...item });
  };

  const handleEditItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    onUpdateItem(editingItem);
    setEditingItem(null);
  };

  const handleToggleAvailability = (item: MenuItem) => {
    onUpdateItem({
      ...item,
      isAvailable: !item.isAvailable
    });
  };

  const handleSaveTableGreeting = (tableId: string) => {
    onUpdateTableGreeting(tableId, tempGreetingText);
    setEditingTableGreetingId(null);
  };

  const startEditTableGreeting = (table: Table) => {
    setEditingTableGreetingId(table.id);
    setTempGreetingText(table.activeGreeting || '');
  };

  const filteredItems = items.filter(item => {
    return selectedCategory === 'all' || item.category === selectedCategory;
  });

  return (
    <div className="space-y-6">
      
      {/* Dashboard Top Hero Welcome */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
        {/* Abstract design vector in background */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -z-0"></div>
        <div className="absolute right-12 bottom-0 w-32 h-32 bg-slate-800 rounded-full -z-0"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-amber-500" />
              <span className="text-[10px] uppercase tracking-widest text-amber-500 font-bold font-mono">
                ადმინისტრირების პანელი
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight font-serif">
              Bistro & Wine Bar
            </h1>
            <p className="text-xs text-slate-400 max-w-md">
              მართეთ ციფრული QR მენიუ, შეცვალეთ კერძების დახვეწილი აღწერები და აკონტროლეთ მაგიდების გამოძახებები რეალურ დროში.
            </p>
          </div>
          
          <button 
            onClick={() => setShowAddModal(true)}
            className="self-start md:self-center py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            კერძის დამატება მენიუში
          </button>
        </div>
      </div>

      {/* Primary Telemetry Alerts Banner */}
      {waiterNotifications.length > 0 && (
        <div className="bg-rose-50 border border-rose-200/50 rounded-2xl p-4 flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="bg-rose-500 text-white p-2 rounded-xl">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-rose-900">აქტიური გამოძახებაა! ({waiterNotifications.length})</h4>
              <p className="text-[10px] text-rose-700">სტუმარი მაგიდიდან ელოდება მიმტანს</p>
            </div>
          </div>
          <button 
            onClick={() => setActiveTab('notifications')}
            className="py-1 px-3 bg-rose-500 hover:bg-rose-600 text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
          >
            ნახვა
          </button>
        </div>
      )}

      {/* Dashboard Custom Tab bar Navigation */}
      <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-1.5 flex flex-wrap gap-1">
        {[
          { id: 'items', label: '🍟 კერძების მართვა', badge: items.length },
          { id: 'tables', label: '📍 მაგიდები და QR კოდები', badge: tables.length },
          { id: 'notifications', label: '🔔 გამოძახების ხაზი', badge: waiterNotifications.length, isWarning: waiterNotifications.length > 0 },
          { id: 'reviews', label: '⭐ სტუმრების შეფასებები', badge: reviews.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-sm'
                : tab.isWarning 
                  ? 'bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100 pointer-events-auto'
                  : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
            {tab.badge > 0 && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === tab.id 
                  ? 'bg-slate-800 text-amber-400' 
                  : tab.isWarning 
                    ? 'bg-rose-200 text-rose-900'
                    : 'bg-slate-100 text-slate-600'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content panes based on activeTab */}
      
      {/* TAB 1: ITEMS MANAGEMENT */}
      {activeTab === 'items' && (
        <div className="space-y-5">
          {/* Category Quick Filter */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all shrink-0 cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                ყველა კატეგორია
              </button>
              {CATEGORIES.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all shrink-0 cursor-pointer ${
                    selectedCategory === category.id
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  {category.nameGeo}
                </button>
              ))}
            </div>
            <span className="text-[11px] font-mono text-slate-400">ნაჩვენებია: {filteredItems.length} პოზიცია</span>
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {filteredItems.map(item => (
              <div 
                key={item.id}
                className={`bg-white border rounded-2xl p-4 shadow-2xs flex flex-col justify-between transition-all ${
                  item.isAvailable ? 'border-slate-100/90' : 'border-slate-200 bg-slate-50 opacity-75'
                }`}
              >
                <div className="flex gap-4">
                  {/* Photo representing dish */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-100 relative">
                    <img src={item.image} alt={item.nameGeo} className="w-full h-full object-cover" />
                    {!item.isAvailable && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-white uppercase tracking-wider bg-red-600 px-1.5 py-0.5 rounded-xs">
                          გათიშულია
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Descriptions block */}
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start gap-1">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 leading-tight">
                          {item.nameGeo}
                        </h3>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide font-serif">
                          {item.nameEng}
                        </p>
                      </div>
                      {item.priceGlass || item.priceBottle ? (
                        <div className="flex flex-col items-end gap-0.5 shrink-0">
                          {item.priceGlass && (
                            <span className="font-bold text-[9px] text-amber-800 bg-amber-50/80 border border-amber-200/50 px-1.5 py-0.5 rounded-md">
                              🍷 ჭიქა: {item.priceGlass}₾
                            </span>
                          )}
                          {item.priceBottle && (
                            <span className="font-bold text-[9px] text-amber-800 bg-amber-50/80 border border-amber-200/50 px-1.5 py-0.5 rounded-md">
                              🍾 ბოთლი: {item.priceBottle}₾
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="font-extrabold text-xs text-slate-900 shrink-0 bg-slate-100 px-2 py-1 rounded-lg">
                          {item.price} GEL
                        </span>
                      )}
                    </div>
                    {/* Exquisite story-driven description with NO measure lists! */}
                    <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                    {/* Tags */}
                    <div className="flex gap-1 flex-wrap pt-1">
                      {item.tags.map(tag => (
                        <span key={tag} className="text-[9px] font-semibold bg-amber-50 rounded-md text-amber-800 border border-amber-100 px-1.5 py-0.2">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Dashboard inline modifications */}
                <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100/70">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleAvailability(item)}
                      className={`flex items-center gap-1 py-1 px-2 text-[10px] font-semibold rounded-lg border transition-all cursor-pointer ${
                        item.isAvailable 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                          : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                      }`}
                      title={item.isAvailable ? 'Mark Out of Stock' : 'Mark Available'}
                    >
                      {item.isAvailable ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-red-600" />}
                      {item.isAvailable ? 'აქტიურია (ხელმისაწვდომი)' : 'ამოწურულია (გათიშვა)'}
                    </button>
                  </div>

                  <button
                    onClick={() => startEditItem(item)}
                    className="flex items-center gap-1.5 py-1 px-3 text-[10px] font-bold text-slate-700 hover:text-slate-950 bg-slate-150 border border-slate-250 hover:bg-slate-200/80 rounded-lg transition-all cursor-pointer"
                  >
                    <Edit className="w-3 h-3" />
                    ფასის/აღწერის შეცვლა
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: TABLES & QR CODE GENERATOR */}
      {activeTab === 'tables' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left partition - Live list of Tables */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white border border-slate-205 rounded-2xl p-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span>📍 მაგიდების სია</span>
              </h3>
              
              <div className="space-y-2.5">
                {tables.map(table => (
                  <div 
                    key={table.id}
                    onClick={() => onTableSelect(table)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      selectedTableForQR.id === table.id
                        ? 'bg-amber-50/75 border-amber-500/80 shadow-xs'
                        : 'bg-white border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{table.name}</span>
                        {table.status === 'service_requested' && (
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" title="Waiter requested"></span>
                        )}
                      </div>
                      
                      {/* Interactive Greeting editor inline */}
                      {editingTableGreetingId === table.id ? (
                        <div className="flex items-center gap-1.5 mt-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={tempGreetingText}
                            onChange={(e) => setTempGreetingText(e.target.value)}
                            className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] focus:outline-none"
                            placeholder="მისალმების ტექსტი..."
                          />
                          <button 
                            onClick={() => handleSaveTableGreeting(table.id)}
                            className="p-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => setEditingTableGreetingId(null)}
                            className="p-1.5 bg-slate-105 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-100"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-[11px] text-slate-500 italic truncate max-w-[280px]">
                            {table.activeGreeting ? `„${table.activeGreeting}“` : 'მისალმება არ არის დაყენებული'}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditTableGreeting(table);
                            }}
                            className="text-[10px] font-bold text-amber-700 hover:text-amber-800 hover:underline px-2"
                          >
                            შეცვლა
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${
                        selectedTableForQR.id === table.id ? 'translate-x-0.5 text-amber-600' : ''
                      }`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right partition - Interactive QR Creator Frame */}
          <div className="lg:col-span-6">
            <QRCodeComponent 
              table={selectedTableForQR}
              appUrl={appUrl}
              onSimulateScan={onSimulateScan}
            />
          </div>
        </div>
      )}

      {/* TAB 3: WAITER SERVICE CALLS */}
      {activeTab === 'notifications' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-105">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">🔔 აქტიური გამოძახებები</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">სტუმრები მაგიდებიდან, რომლებიც ელიან რეაქციას</p>
            </div>
            {waiterNotifications.length > 0 && (
              <button 
                onClick={onClearAllNotifications}
                className="text-[10px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
              >
                ყველას გასუფთავება
              </button>
            )}
          </div>

          {waiterNotifications.length > 0 ? (
            <div className="space-y-3.5">
              {waiterNotifications.map((notif) => (
                <div 
                  key={notif.id}
                  className="bg-rose-50/50 border border-rose-100 p-4 rounded-xl flex items-center justify-between gap-4 animate-fadeIn"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse mt-1.5 shrink-0"></span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">მაგიდა #{notif.tableNumber}</h4>
                      <p className="text-[11px] font-medium text-slate-600 mt-1 bg-white px-2.5 py-1.5 rounded-lg border border-rose-200/50 block">
                        სერვისის ტიპი: <span className="font-bold text-rose-800">{notif.requestType}</span>
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono mt-1 block">დრო: {notif.time}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onClearNotification(notif.id)}
                    className="py-1 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Check className="w-3  h-3" />
                    მოემსახურა
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 space-y-2">
              <span className="text-3xl">☕</span>
              <h4 className="text-xs font-bold text-slate-700">გამოძახების ხაზი ცარიელია</h4>
              <p className="text-[11.5px] text-slate-400 max-w-[240px] mx-auto leading-relaxed">
                ამჟამად მაგიდებიდან აქტიური გამოძახება არ არის. სტუმრები მშვიდად კითხულობენ დახვეწილ აღწერებს!
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: GUEST REVIEWS LOG */}
      {activeTab === 'reviews' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">⭐ სტუმრების შეფასებები</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">სტუმრების მიერ დატოვებული რეალური შთაბეჭდილებები</p>
          </div>

          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div 
                  key={rev.id}
                  className="bg-slate-50/60 border border-slate-100 p-4 rounded-xl space-y-2 text-left"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-900">{rev.guestName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{rev.date}</span>
                  </div>

                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star 
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                        }`} 
                      />
                    ))}
                  </div>

                  <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                    „{rev.comment}“
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 space-y-2">
              <span className="text-2xl">📝</span>
              <h4 className="text-xs font-bold text-slate-700">შეფასებები არ არის</h4>
              <p className="text-xs text-slate-400 max-w-[200px] mx-auto">
                სტუმრებს შეუძლიათ დატოვონ გამოხმაურება პირდაპირ ციფრული მენიუს ბოლო სექციიდან
              </p>
            </div>
          )}
        </div>
      )}

      {/* DIALOG 1: EDIT ITEM PRICE & DESCRIPTION STORY */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-100 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Edit className="w-4 h-4 text-amber-600" />
                კერძის რედაქტირება
              </h3>
              <button 
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleEditItemSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">დასახელება (ქართული)</label>
                <input
                  type="text"
                  value={editingItem.nameGeo}
                  onChange={(e) => setEditingItem({ ...editingItem, nameGeo: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {editingItem.category === 'wine' ? (
                  <div className="col-span-1 grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">ჭიქა (₾)</label>
                      <input
                        type="number"
                        value={editingItem.priceGlass || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, priceGlass: e.target.value ? Number(e.target.value) : undefined })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">ბოთლი (₾)</label>
                      <input
                        type="number"
                        value={editingItem.priceBottle || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, priceBottle: e.target.value ? Number(e.target.value) : undefined })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">ფასი (GEL)</label>
                    <input
                      type="number"
                      value={editingItem.price}
                      onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                      required
                      min={1}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                )}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">სურათის ბმული</label>
                  <input
                    type="text"
                    value={editingItem.image}
                    onChange={(e) => setEditingItem({ ...editingItem, image: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs truncate"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">საჭმლის აღწერა (ინგრედენტების სიის გარეშე)</label>
                <textarea
                  rows={4}
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs resize-none"
                  placeholder="აღწერეთ კერძის მადისაღმძვრელი გემო..."
                ></textarea>
                <p className="text-[10px] text-slate-400 leading-relaxed mt-1">
                  გაითვალისწინეთ: მომხმარებელს ურჩევნია წაიკითხოს მადისაღმძვრელი ამბავი კერძზე, ვიდრე წონისა და გრამების მშრალი სტატისტიკური სია.
                </p>
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
                >
                  ცვლილებების შენახვა
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG 2: ADD NEW PREMIUM DISH */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-100 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <ChefHat className="w-5 h-5 text-amber-500" />
                ახალი კერძის დამატება მენიუში
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleAddItemSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">სახელი (ქართულად)</label>
                  <input
                    type="text"
                    placeholder="მაგ: ტრიუფელის პასტა"
                    value={newItemNameGeo}
                    onChange={(e) => setNewItemNameGeo(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">სახელი (ინგლისურად)</label>
                  <input
                    type="text"
                    placeholder="მაგ: Truffle Pasta"
                    value={newItemNameEng}
                    onChange={(e) => setNewItemNameEng(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">კატეგორია</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.nameGeo}</option>
                    ))}
                  </select>
                </div>
                {newItemCategory === 'wine' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">ჭიქის ფასი (₾)</label>
                      <input
                        type="number"
                        placeholder="მაგ: 15"
                        value={newItemPriceGlass || ''}
                        onChange={(e) => setNewItemPriceGlass(e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">ბოთლის ფასი (₾)</label>
                      <input
                        type="number"
                        placeholder="მაგ: 60"
                        value={newItemPriceBottle || ''}
                        onChange={(e) => setNewItemPriceBottle(e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">ფასი (GEL)</label>
                    <input
                      type="number"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(Number(e.target.value))}
                      required
                      min={1}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">სურათის ლინკი</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={newItemImage}
                  onChange={(e) => setNewItemImage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">დიეტური იარლიყები (გამოყავით მძიმით)</label>
                <input
                  type="text"
                  placeholder="ვეგეტარიანული, ცხელი, საფირმო, ცხარე..."
                  value={newItemTags}
                  onChange={(e) => setNewItemTags(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">მადისაღმძვრელი აღწერა (მხოლოდ ტექსტი, უგრამოებო)</label>
                <textarea
                  rows={3}
                  placeholder="აღწერეთ ნაზი გემოების კომბინაცია, არომატები და როგორ მიირთმევენ მას..."
                  value={newItemDescription}
                  onChange={(e) => setNewItemDescription(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none resize-none"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl shadow-sm cursor-pointer"
                >
                  კერძის შექმნა
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
