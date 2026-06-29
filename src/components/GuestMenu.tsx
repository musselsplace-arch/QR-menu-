import React, { useState, useEffect, useMemo } from 'react';
import { MenuItem, Table, CartItem, Order } from '../types';
import { CATEGORIES } from '../data';
import { itemTranslations, categoryTranslations, uiTranslations } from '../translations';
import blackCatLogo from '../assets/images/black_cat_logo.jpg';
import { 
  Search, Sparkles, ShoppingBag, Plus, Minus, ArrowRight, Table as TableIcon,
  ChevronDown, ChevronRight, Globe, Languages, Settings, Check, X, ShieldAlert, Circle, HelpCircle, AlertCircle,
  Sun, Moon, Lock, Compass, Bell, Leaf, Clock, Flame, Star, ArrowLeft, Menu, Home, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, collection, doc, setDoc, updateDoc, handleFirestoreError, OperationType } from '../firebase';

// Elegant image lazy-loading component with glittering shimmer skeleton placeholder
function ImageWithSkeleton({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [isLoaded, setIsLoaded] = useState(false);
  return (
    <div className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800 ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800" />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}

interface GuestMenuProps {
  items: MenuItem[];
  tables: Table[];
  orders: Order[];
  onOpenAdmin: () => void;
  onSubmitOrder: (tableId: string, tableNumber: number, cart: CartItem[]) => void;
  onAppendToOrder: (tableNumber: number, newItems: CartItem[]) => void;
  isSimulatedMobile?: boolean;
}

export default function GuestMenu({
  items,
  tables,
  orders,
  onOpenAdmin,
  onSubmitOrder,
  onAppendToOrder,
  isSimulatedMobile = true,
}: GuestMenuProps) {
  // 1. Core States
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      return (localStorage.getItem('black_cat_theme') as 'dark' | 'light') || 'light';
    } catch {
      return 'light';
    }
  });

  // Micro-interactions flying particles and cart haptic count
  const [flyingParticles, setFlyingParticles] = useState<Array<{ id: number; startX: number; startY: number }>>([]);
  const [cartTriggerCount, setCartTriggerCount] = useState(0);

  const [lang, setLang] = useState<'ka' | 'en' | 'ru' | 'custom'>(() => {
    const cached = localStorage.getItem('black_cat_lang');
    return (cached as any) || 'ka';
  });
  const [customLangName, setCustomLangName] = useState<string>(() => {
    return localStorage.getItem('black_cat_custom_lang_name') || '';
  });
  
  // Custom AI Translations map: { [itemId]: { nameTranslated, descriptionTranslated, tagsTranslated } }
  const [aiTranslations, setAiTranslations] = useState<Record<string, {
    nameTranslated: string;
    descriptionTranslated: string;
    tagsTranslated: string[];
  }>>(() => {
    try {
      const cached = localStorage.getItem('black_cat_ai_translations');
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // Unified Guest Onboarding Steps State
  const [menuStep, setMenuStep] = useState<'language' | 'welcome' | 'categories' | 'menu'>('language');

  const [isFoodSubmenuOpen, setIsFoodSubmenuOpen] = useState(false);

  const [manualLangInput, setManualLangInput] = useState('');
  const [isAiTranslating, setIsAiTranslating] = useState(false);
  const [aiTranslationProgress, setAiTranslationProgress] = useState(0);
  const [aiProgressMsg, setAiProgressMsg] = useState('');
  const [aiTranslationError, setAiTranslationError] = useState('');

  // Cart/Basket State
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const cached = localStorage.getItem('black_cat_cart');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  // Welcome Instruction Banner Toast (Shown right after selecting a language)
  const [showInstructionToast, setShowInstructionToast] = useState(false);

  // Gourmet Wheel / Pasta Pro States & Helpers
  const [hasStarted, setHasStarted] = useState(() => {
    try {
      return sessionStorage.getItem('black_cat_has_started') === 'true';
    } catch {
      return false;
    }
  });
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [activeWheelIndex, setActiveWheelIndex] = useState(0);
  const [detailQty, setDetailQty] = useState(1);
  const [menuLayoutMode, setMenuLayoutMode] = useState<'wheel' | 'classic'>('classic');
  const [currentTab, setCurrentTab] = useState<'home' | 'cart' | 'profile' | 'settings'>('home');

  // Custom high-fidelity dialog state and trigger helper
  const [customDialog, setCustomDialog] = useState<{
    title: string;
    message: string;
    icon?: 'success' | 'warning' | 'info';
  } | null>(null);

  const triggerDialog = (title: string, message: string, icon: 'success' | 'warning' | 'info' = 'info') => {
    setCustomDialog({ title, message, icon });
  };

  const getItemDetailsSpec = (itemId: string) => {
    const charCodeSum = itemId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const time = 15 + (charCodeSum % 25);
    const kcal = 200 + (charCodeSum % 400);
    const rating = (4.5 + (charCodeSum % 5) * 0.1).toFixed(1);
    
    let ingredients = 'პრემიუმ ინგრედიენტები, ნატურალური სანელებლები, ზეითუნის ზეთი და შეფ-მზარეულის საფირმო სოუსი.';
    let ingredientsEng = 'Premium local ingredients, natural herbs, extra virgin olive oil, and chef\'s signature sauce.';
    
    if (itemId.includes('truffle') || itemId.includes('omelette')) {
      ingredients = 'კვერცხი, ტრიუფელის პასტა, პარმეზანი, ნაღები, ახალი მწვანილი, ფრანგული ბაგეტი.';
      ingredientsEng = 'Farm fresh eggs, Italian truffle paste, aged parmesan, cream, fresh herbs, toasted French baguette.';
    } else if (itemId.includes('burrata')) {
      ingredients = 'კრემოვანი ყველი ბურატა, თბილი კენკრა, ნაღები, მოხალული ფსტა, ცოცხალი პიტნა.';
      ingredientsEng = 'Creamy burrata cheese, warm sweet berries, rich dairy cream, roasted pistachios, fresh garden mint.';
    } else if (itemId.includes('camembert')) {
      ingredients = 'ყველი კამამბერი, ნატურალური თაფლი, ნიორი, ნედლი როზმარინი, ხრაშუნა თბილი ბაგეტი.';
      ingredientsEng = 'Premium camembert cheese, organic blossom honey, aromatic garlic, fresh rosemary, warm crispy baguette.';
    } else if (itemId.includes('salad') || itemId.includes('stracciatella')) {
      ingredients = 'ნორჩი მწვანე ფოთლები, ხრაშუნა ნედლი კიტრი, სტრაჩატელა, პესტოს სოუსი, ლაიმის წვენი, ზეითუნის ზეთი.';
      ingredientsEng = 'Fresh green baby leaves, crispy garden cucumber, Italian stracciatella, fresh pesto sauce, lime juice, extra virgin olive oil.';
    } else if (itemId.includes('shrimp')) {
      ingredients = 'ვეფხვისებრი კრევეტები, აზიური მწვანილების დიპლომატი, ჩერი პომიდორი, პიკანტური აზიური დრესინგი, სეზამის მარცვლები.';
      ingredientsEng = 'Seared tiger shrimps, Asian microgreens mix, sweet cherry tomatoes, spicy garlic-ginger dressing, toasted sesame seeds.';
    } else if (itemId.includes('sandwich') || itemId.includes('angus')) {
      ingredients = 'შავი ანგუსის სუკი, მდნარი მოცარელა, რუკოლა, დიჟონის მდოგვი, ხრაშუნა თბილი ბაგეტი.';
      ingredientsEng = 'Premium black angus beef strips, melted mozzarella cheese, fresh arugula, dijon mustard, hot baked baguette.';
    }
    
    return {
      time: `${time} min`,
      kcal: `${kcal} kcal`,
      rating,
      ingredients: lang === 'ka' ? ingredients : ingredientsEng
    };
  };

  const handleAddToCartWithQuantity = (item: MenuItem, quantity: number, option?: 'glass' | 'bottle' | 'standard', e?: React.MouseEvent) => {
    const trans = getTranslatedItemLocal(item);
    const cartItemId = `${item.id}-${option || 'standard'}`;
    const selectedPrice = option === 'glass' ? (item.priceGlass || item.price) : option === 'bottle' ? (item.priceBottle || item.price) : item.price;

    setCart(prev => {
      const exists = prev.find(i => i.id === cartItemId);
      if (exists) {
        return prev.map(i => i.id === cartItemId ? { ...i, quantity: i.quantity + quantity } : i);
      } else {
        return [...prev, {
          id: cartItemId,
          menuItemId: item.id,
          name: trans.name,
          price: selectedPrice,
          quantity: quantity,
          selectedOption: option
        }];
      }
    });

    setCartTriggerCount(prev => prev + 1);
    if (e && e.clientX && e.clientY) {
      const pId = Date.now() + Math.random();
      setFlyingParticles(prev => [...prev, {
        id: pId,
        startX: e.clientX,
        startY: e.clientY
      }]);
      setTimeout(() => {
        setFlyingParticles(prev => prev.filter(p => p.id !== pId));
      }, 800);
    }
  };

  // Selected table inside the cart
  const [selectedTableNumber, setSelectedTableNumber] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const tableParam = searchParams.get('table');
      if (tableParam) {
        const parsed = parseInt(tableParam, 10);
        if (!isNaN(parsed)) return parsed;
      }
    }
    const stored = localStorage.getItem('black_cat_guest_table');
    return stored ? parseInt(stored, 10) : 1; // Default table #1
  });

  // Listen to live changes in URL query param to update table
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkUrlTable = () => {
        const searchParams = new URLSearchParams(window.location.search);
        const tableParam = searchParams.get('table');
        if (tableParam) {
          const parsed = parseInt(tableParam, 10);
          if (!isNaN(parsed) && parsed !== selectedTableNumber) {
            setSelectedTableNumber(parsed);
          }
        }
      };
      
      checkUrlTable();
      window.addEventListener('popstate', checkUrlTable);
      return () => window.removeEventListener('popstate', checkUrlTable);
    }
  }, [selectedTableNumber]);

  // Table status and lock checking
  const isTableLockedFromUrl = useMemo(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      return !!searchParams.get('table');
    }
    return false;
  }, []);

  const [isTableSelectorOpen, setIsTableSelectorOpen] = useState(false);
  const [isLocationVerified, setIsLocationVerified] = useState(false);
  const [activeServiceRequest, setActiveServiceRequest] = useState<string | null>(null);
  const [waiterCooldown, setWaiterCooldown] = useState(0);
  const [billCooldown, setBillCooldown] = useState(0);

  // Tick down waiter cooldown timer
  useEffect(() => {
    if (waiterCooldown > 0) {
      const t = setTimeout(() => {
        setWaiterCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [waiterCooldown]);

  // Tick down bill cooldown timer
  useEffect(() => {
    if (billCooldown > 0) {
      const t = setTimeout(() => {
        setBillCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [billCooldown]);

  const handleVerifyLocation = () => {
    if (!navigator.geolocation) {
      triggerDialog(
        lang === 'ka' ? '📍 გეოლოკაცია' : '📍 Geolocation',
        lang === 'ka' 
          ? 'თქვენს ბრაუზერს არ აქვს გეოლოკაციის მხარდაჭერა. შეკვეთა გაიგზავნება დადასტურების სტანდარტული რეჟიმით.' 
          : 'Your browser does not support geolocation. Your order will be verified via manual waiter check.',
        'warning'
      );
      setIsLocationVerified(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Tbilisi restaurant coordinates as standard reference
        const restLat = 41.7151;
        const restLng = 44.8271;
        
        const distance = Math.sqrt(
          Math.pow(position.coords.latitude - restLat, 2) + 
          Math.pow(position.coords.longitude - restLng, 2)
        ) * 111000; // approximation in meters

        setIsLocationVerified(true);
        triggerDialog(
          lang === 'ka' ? '📍 ვერიფიკაცია წარმატებულია' : '📍 Verification Successful',
          lang === 'ka' 
            ? 'ვერიფიკაცია წარმატებულია! თქვენი ლოკაცია შეესაბამება რესტორნის კოორდინატებს (~300მ).' 
            : 'Verification successful! Your location matches the restaurant coordinates (~300m).',
          'success'
        );
      },
      (error) => {
        console.warn("Geolocation failed or denied, using safe physical waiter-fallback: ", error);
        setIsLocationVerified(true);
        triggerDialog(
          lang === 'ka' ? '📍 ლოკაცია' : '📍 Location',
          lang === 'ka'
            ? 'გეოლოკაციაზე წვდომა არ არის. უსაფრთხოების მიზნით, შეკვეთა გადავა ოფიციანტის ფიზიკურ ვერიფიკაციაზე.'
            : 'Could not access geolocation. For security, your order will require waiter physical verification at the table.',
          'warning'
        );
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const handleCallWaiter = async (requestType: string) => {
    const isBill = requestType.includes('ანგარიშ') || requestType.includes('Bill');
    const currentCooldown = isBill ? billCooldown : waiterCooldown;

    if (currentCooldown > 0) {
      triggerDialog(
        lang === 'ka' ? '⏳ გთხოვთ მოიცადოთ' : '⏳ Please Wait',
        lang === 'ka' 
          ? `გთხოვთ მოიცადოთ ${currentCooldown} წამი ახალ გამოძახებამდე.` 
          : `Please wait ${currentCooldown}s before another request.`,
        'warning'
      );
      return;
    }

    const notifId = `notif-${Date.now()}`;
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const payload = {
      id: notifId,
      tableNumber: selectedTableNumber,
      requestType,
      time: timeString,
      timestamp: Date.now()
    };

    try {
      await setDoc(doc(db, 'notifications', notifId), payload);
      
      // Update table status to 'service_requested' in Firestore
      const targetTableObj = tables.find(t => t.number === selectedTableNumber);
      if (targetTableObj) {
        await updateDoc(doc(db, 'tables', targetTableObj.id), { status: 'service_requested' });
      }

      if (isBill) {
        setBillCooldown(30);
      } else {
        setWaiterCooldown(30);
      }

      setActiveServiceRequest(requestType);
      
      triggerDialog(
        lang === 'ka' ? '🔔 გამოძახება გაგზავნილია' : '🔔 Call Sent',
        isBill
          ? (lang === 'ka' 
              ? `ანგარიშის მოთხოვნა წარმატებით გაიგზავნა! ოფიციანტი მალე მოგიტანთ ანგარიშს (#${selectedTableNumber} მაგიდასთან).` 
              : `Bill request sent successfully! A waiter will bring the bill to your table (#${selectedTableNumber}) shortly.`)
          : (lang === 'ka' 
              ? `გამოძახება წარმატებით გაიგზავნა! მიმტანი მალე მოვა თქვენს მაგიდასთან (${selectedTableNumber}).` 
              : `Request sent successfully! A waiter will arrive at your table (${selectedTableNumber}) shortly.`),
        'success'
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `notifications/${notifId}`);
    }
  };

  // Active Order Tracker: checks if family is waiting for some order on current table
  const activeOrderForCurrentTable = useMemo(() => {
    return orders.find(o => o.tableNumber === selectedTableNumber && (o.status === 'pending' || o.status === 'accepted'));
  }, [orders, selectedTableNumber]);

  // Option Picker Modal state for wine drinks
  const [optionPickerItem, setOptionPickerItem] = useState<MenuItem | null>(null);

  // Cart Sheet Overlay
  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false);

  // 2. Local Storage Syncs
  useEffect(() => {
    localStorage.setItem('black_cat_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('black_cat_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('black_cat_custom_lang_name', customLangName);
  }, [customLangName]);

  useEffect(() => {
    localStorage.setItem('black_cat_ai_translations', JSON.stringify(aiTranslations));
  }, [aiTranslations]);

  useEffect(() => {
    localStorage.setItem('black_cat_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('black_cat_guest_table', String(selectedTableNumber));
  }, [selectedTableNumber]);

  // Reset selected tag and active wheel index when category resets to avoid broken list feeds or index out-of-bounds
  useEffect(() => {
    setSelectedTag('all');
    setActiveWheelIndex(0);
  }, [selectedCategory]);

  // 3. UI Translation Dictionary getters
  const t = useMemo(() => {
    // Falls back to Georgian dictionary elements safely
    const dict = uiTranslations[lang === 'custom' ? 'en' : lang] || uiTranslations['ka'];
    return dict;
  }, [lang]);

  // Resolve dynamic localized titles for menu cards
  const getTranslatedItemLocal = (item: MenuItem) => {
    if (lang === 'ka') {
      return {
        ...item,
        name: item.nameGeo,
        description: item.description,
        tags: item.tags
      };
    } else if (lang === 'en') {
      const trans = itemTranslations[item.id];
      return {
        ...item,
        name: item.nameEng,
        description: trans?.en?.description || item.description,
        tags: trans?.en?.tags || item.tags
      };
    } else if (lang === 'ru') {
      const trans = itemTranslations[item.id];
      return {
        ...item,
        name: trans?.ru?.name || item.nameEng,
        description: trans?.ru?.description || item.description,
        tags: trans?.ru?.tags || item.tags
      };
    } else if (lang === 'custom' && aiTranslations[item.id]) {
      const trans = aiTranslations[item.id];
      return {
        ...item,
        name: trans.nameTranslated,
        description: trans.descriptionTranslated,
        tags: trans.tagsTranslated
      };
    }
    // Fallback English
    return {
      ...item,
      name: item.nameEng,
      description: item.description,
      tags: item.tags
    };
  };

  // Determine categories taglist
  const allTags = useMemo(() => {
    const list = new Set<string>();
    items.forEach(item => {
      const transItem = getTranslatedItemLocal(item);
      if (item.category === selectedCategory || selectedCategory === 'all') {
        transItem.tags.forEach(tag => list.add(tag));
      }
    });
    return Array.from(list);
  }, [items, selectedCategory, lang, aiTranslations]);

  // Translate categorized list
  const translatedFilteredItems = useMemo(() => {
    return items
      .filter(item => {
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        const matchesSearch = searchQuery === '' || 
          item.nameGeo.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.nameEng.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .map(item => {
        const trans = getTranslatedItemLocal(item);
        return {
          ...item,
          ...trans
        };
      })
      .filter(transItem => {
        return selectedTag === 'all' || transItem.tags.includes(selectedTag);
      });
  }, [items, selectedCategory, selectedTag, searchQuery, lang, aiTranslations]);

  // Cart Quantities / Operations logic
  const totalPrice = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [cart]);

  const handleAddToCart = (item: MenuItem, option?: 'glass' | 'bottle' | 'standard', e?: React.MouseEvent) => {
    const trans = getTranslatedItemLocal(item);
    const cartItemId = `${item.id}-${option || 'standard'}`;
    const selectedPrice = option === 'glass' ? (item.priceGlass || item.price) : option === 'bottle' ? (item.priceBottle || item.price) : item.price;

    setCart(prev => {
      const exists = prev.find(i => i.id === cartItemId);
      if (exists) {
        return prev.map(i => i.id === cartItemId ? { ...i, quantity: i.quantity + 1 } : i);
      } else {
        return [...prev, {
          id: cartItemId,
          menuItemId: item.id,
          name: trans.name,
          price: selectedPrice,
          quantity: 1,
          selectedOption: option
        }];
      }
    });

    setOptionPickerItem(null);

    // Dynamic UX Feedback Micro-interactions
    setCartTriggerCount(prev => prev + 1);
    if (e && e.clientX && e.clientY) {
      const pId = Date.now() + Math.random();
      setFlyingParticles(prev => [...prev, {
        id: pId,
        startX: e.clientX,
        startY: e.clientY
      }]);
      setTimeout(() => {
        setFlyingParticles(prev => prev.filter(p => p.id !== pId));
      }, 800);
    }
  };

  const handleDecreaseCart = (cartItemId: string) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === cartItemId);
      if (exists) {
        if (exists.quantity <= 1) {
          return prev.filter(i => i.id !== cartItemId);
        } else {
          return prev.map(i => i.id === cartItemId ? { ...i, quantity: i.quantity - 1 } : i);
        }
      }
      return prev;
    });
  };

  const handleIncreaseCart = (cartItemId: string) => {
    setCart(prev => {
      return prev.map(i => i.id === cartItemId ? { ...i, quantity: i.quantity + 1 } : i);
    });
  };

  const handleUpdateCartItemNote = (cartItemId: string, note: string) => {
    setCart(prev => {
      return prev.map(i => i.id === cartItemId ? { ...i, note } : i);
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  // 4. Custom Lang AI Translation Trigger
  const handleTriggerAiTranslation = async (chosenLangName: string) => {
    if (!chosenLangName.trim()) return;
    setIsAiTranslating(true);
    setAiTranslationProgress(10);
    setAiProgressMsg("📡 მაგიდის QR კოდის ავტორიზაცია...");
    setAiTranslationError('');

    try {
      // Step simulated loading intervals to look highly futuristic
      const t1 = setTimeout(() => {
        setAiTranslationProgress(35);
        setAiProgressMsg("🧠 AI კულინარიული მოდულის გააქტიურება...");
      }, 700);

      const t2 = setTimeout(() => {
        setAiTranslationProgress(60);
        setAiProgressMsg("✨ მენიუს თარგმნა და გურმანული სიტყვების ადაპტაცია...");
      }, 1500);

      // Perform real Express server request with the full menu items to Gemini
      const response = await fetch('/api/translate-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetLanguage: chosenLangName,
          menuItems: items,
        })
      });

      clearTimeout(t1);
      clearTimeout(t2);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "მენიუს თარგმნისას დაფიქსირდა ხარვეზი.");
      }

      const responseData = await response.json();
      setAiTranslationProgress(85);
      setAiProgressMsg("🎨 ტექსტურის და ესთეტიკის ჰარმონიზაცია...");

      const translatedList = responseData.translatedItems || [];
      const newTranslationDict: Record<string, any> = {};
      
      translatedList.forEach((transItem: any) => {
        if (transItem.id) {
          newTranslationDict[transItem.id] = {
            nameTranslated: transItem.nameTranslated,
            descriptionTranslated: transItem.descriptionTranslated,
            tagsTranslated: transItem.tagsTranslated || []
          };
        }
      });

      setAiTranslations(newTranslationDict);
      setLang('custom');
      setCustomLangName(chosenLangName);
      sessionStorage.setItem('black_cat_lang_chosen_once', 'true');
      setMenuStep('welcome');

    } catch (err: any) {
      console.error(err);
      setAiTranslationError(err.message || "სერვერთან კავშირი ვერ დამყარდა.");
    } finally {
      setIsAiTranslating(false);
      setAiTranslationProgress(0);
    }
  };

  // Direct standard selection
  const selectPresetLanguage = (selectedPreset: 'ka' | 'en' | 'ru') => {
    setLang(selectedPreset);
    sessionStorage.setItem('black_cat_lang_chosen_once', 'true');
    setMenuStep('welcome');
  };

  // Submit Order logic
  const handleFinalizeCartAndSend = () => {
    if (cart.length === 0) return;
    
    // Check if table has an active order
    if (activeOrderForCurrentTable) {
      // APPEND to existing order!
      onAppendToOrder(selectedTableNumber, cart);
    } else {
      // Create NEW order
      const targetTableObj = tables.find(t => t.number === selectedTableNumber) || tables[0];
      onSubmitOrder(targetTableObj.id, selectedTableNumber, cart);
    }

    clearCart();
    setIsCartSheetOpen(false);
    setShowSuccessScreen(true);
  };

  // Direct standard selection

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden relative transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* 1. FUTURISTIC LANGUAGE SELECTION SCREEN (STEP 1) */}
      {menuStep === 'language' && (
        <div className="absolute inset-0 bg-slate-950 text-white flex flex-col justify-between p-6 z-40 select-none overflow-y-auto scrollbar-none font-sans">
          {/* Top Info Table Verification */}
          <div className="pt-4 text-center shrink-0">
            {selectedTableNumber && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md shadow-emerald-950/20"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{lang === 'ka' ? `✓ მაგიდა #${selectedTableNumber} წარმატებით ამოცნობილია` : `✓ Table #${selectedTableNumber} Verified Via QR`}</span>
              </motion.div>
            )}
          </div>

          {/* Center Brand & Language Options */}
          <div className="flex-1 flex flex-col items-center justify-center py-6 space-y-6 max-w-sm mx-auto w-full">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 mb-1">
                <Languages className="w-6 h-6 animate-pulse" />
              </div>
              <h1 className="text-2xl font-black uppercase tracking-widest text-slate-100 leading-none">
                Black Cat Bistro
              </h1>
              <p className="text-[10px] text-slate-400 leading-relaxed max-w-[280px] mx-auto">
                გთხოვთ შეარჩიოთ მენიუს სასურველი ენა, ან გამოიყენოთ ხელოვნური ინტელექტი ნებისმიერ ენაზე სათარგმნად
              </p>
            </div>

            {/* Presets Grid */}
            <div className="w-full space-y-2">
              <button
                onClick={() => selectPresetLanguage('ka')}
                className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-100 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-all cursor-pointer outline-none active:scale-99"
              >
                <span className="flex items-center gap-3">
                  <span className="text-lg">🇬🇪</span>
                  <span className="font-semibold text-slate-200">ქართული მენიუ</span>
                </span>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => selectPresetLanguage('en')}
                className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-100 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-all cursor-pointer outline-none active:scale-99"
              >
                <span className="flex items-center gap-3">
                  <span className="text-lg">🇬🇧</span>
                  <span className="font-semibold text-slate-200">English Menu</span>
                </span>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => selectPresetLanguage('ru')}
                className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-100 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-all cursor-pointer outline-none active:scale-99"
              >
                <span className="flex items-center gap-3">
                  <span className="text-lg">🇷🇺</span>
                  <span className="font-semibold text-slate-200">Русское Меню</span>
                </span>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Dynamic AI Translation Option */}
            <div className="w-full border-t border-slate-900 pt-4 space-y-2.5">
              <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest block font-mono flex items-center gap-1.5 justify-center">
                <Sparkles className="w-3 h-3 animate-spin text-amber-400" />
                <span>AI მყისიერი თარგმანი / Custom AI translation</span>
              </span>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualLangInput}
                  onChange={(e) => setManualLangInput(e.target.value)}
                  placeholder="მაგ: Italian, German, French, Arabic..."
                  className="flex-1 bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-xl px-3.5 py-2 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-colors"
                />
                <button
                  onClick={() => handleTriggerAiTranslation(manualLangInput)}
                  disabled={isAiTranslating || !manualLangInput.trim()}
                  className="px-4 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-900 disabled:text-slate-650 text-white font-extrabold text-xs rounded-xl transition-all border-none cursor-pointer flex items-center gap-1.5"
                >
                  <span>🚀</span>
                  <span>თარგმნა</span>
                </button>
              </div>

              {/* AI Loading/Scanning animations */}
              {isAiTranslating && (
                <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 text-center space-y-3">
                  <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden relative">
                    <motion.div 
                      className="absolute h-full bg-amber-500"
                      animate={{ left: ['-100%', '100%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      style={{ width: '50%' }}
                    />
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span className="text-[10px] text-slate-355 font-bold font-mono uppercase tracking-wider">{aiProgressMsg || 'Translating menu...'}</span>
                  </div>
                </div>
              )}

              {aiTranslationError && (
                <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-xl text-red-400 text-[9px] leading-relaxed flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{aiTranslationError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Branding */}
          <div className="pb-4 text-center shrink-0">
            <span className="text-[8px] font-black tracking-widest text-slate-600 uppercase font-mono">
              ⚡ Powered by Gemini AI
            </span>
          </div>
        </div>
      )}

      {/* 2. ONBOARDING WELCOME SCREEN (STEP 2) */}
      {menuStep === 'welcome' && (
        <div className="absolute inset-0 bg-slate-950 text-white flex flex-col justify-between p-6 z-40 select-none overflow-y-auto scrollbar-none font-sans">
          {/* Top Table Badge */}
          <div className="pt-4 text-center shrink-0">
            {selectedTableNumber && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-full text-[9px] font-black uppercase text-amber-400">
                <TableIcon className="w-3 h-3" />
                <span>#{selectedTableNumber}</span>
              </div>
            )}
          </div>

          {/* Core Welcome Animation */}
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 max-w-sm mx-auto w-full py-6 text-center">
            <div className="relative">
              <div className="absolute inset-4 rounded-full bg-amber-500/10 blur-2xl pointer-events-none"></div>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
                className="w-44 h-44 rounded-full overflow-hidden border-4 border-amber-500/40 shadow-2xl relative z-10 bg-slate-900 flex items-center justify-center"
              >
                <motion.img
                  src={blackCatLogo}
                  alt="Black Cat Bistro"
                  animate={{ rotate: 360 }}
                  transition={{
                    repeat: Infinity,
                    duration: 24,
                    ease: "linear"
                  }}
                  className="w-full h-full object-cover pointer-events-none select-none"
                />
              </motion.div>
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-2 -right-2 z-20 text-amber-500 text-2xl pointer-events-none select-none"
              >
                ✨
              </motion.div>
            </div>

            {/* Glowing Greeting Lines */}
            <div className="space-y-3">
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-2xl font-black text-slate-100 uppercase tracking-tight"
              >
                {lang === 'ka' ? 'მოგესალმებით! ✨' : lang === 'ru' ? 'Добро пожаловать! ✨' : 'Welcome! ✨'}
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xs text-slate-350 leading-relaxed font-semibold max-w-[280px] mx-auto font-sans"
              >
                {lang === 'ka' 
                  ? 'მოკალათდით და ისიამოვნეთ. ჩვენი ჭკვიანი ციფრული მენიუთი შეგიძლიათ კერძები და სასმელები თავად შეარჩიოთ, ჩაამატოთ კალათაში და მყისვე შეუკვეთოთ პირდაპირ თქვენი სმარტფონიდან!'
                  : lang === 'ru'
                  ? 'Присаживайтесь поудобнее и наслаждайтесь. С нашим цифровым меню вы можете сами выбирать блюда и напитки, добавлять их в корзину и делать заказ прямо со своего телефона!'
                  : 'Relax and enjoy! With our smart digital menu, you can browse, select, add dishes or drinks to your cart, and place orders directly from your phone at your own pace!'}
              </motion.p>
            </div>
          </div>

          {/* Bottom CTA to Categories Screen */}
          <div className="pb-8 text-center z-10 shrink-0 w-full max-w-xs mx-auto">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                sessionStorage.setItem('black_cat_welcome_seen', 'true');
                setMenuStep('categories');
              }}
              className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-extrabold uppercase tracking-widest text-[10px] rounded-full transition-all shadow-xl shadow-amber-600/15 cursor-pointer border-none flex items-center justify-center gap-2"
            >
              <span>{lang === 'ka' ? 'მენიუს ნახვა 🍽️' : lang === 'ru' ? 'Открыть Меню 🍽️' : 'View Menu 🍽️'}</span>
            </motion.button>
          </div>
        </div>
      )}

      {/* 3. SIMPLE CATEGORIES SELECTION SCREEN (STEP 3) */}
      {menuStep === 'categories' && (
        <div className="absolute inset-0 bg-slate-950 text-white flex flex-col justify-between p-6 z-40 select-none overflow-y-auto scrollbar-none font-sans">
          {/* Top Bar with Back option */}
          <div className="pt-4 flex justify-between items-center shrink-0">
            {isFoodSubmenuOpen ? (
              <button
                onClick={() => setIsFoodSubmenuOpen(false)}
                className="flex items-center gap-1.5 py-1 px-3.5 bg-slate-900 hover:bg-slate-850 rounded-full text-[10px] font-black uppercase text-slate-400 border border-slate-800 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{lang === 'ka' ? 'უკან' : 'Back'}</span>
              </button>
            ) : (
              <button
                onClick={() => setMenuStep('language')}
                className="flex items-center gap-1.5 py-1 px-3.5 bg-slate-900 hover:bg-slate-850 rounded-full text-[10px] font-black uppercase text-slate-400 border border-slate-800 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{lang === 'ka' ? 'ენის შეცვლა' : 'Language'}</span>
              </button>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAdmin}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-white rounded-full text-[9px] font-black uppercase text-slate-400 cursor-pointer"
              >
                <Lock className="w-3 h-3 text-amber-500" />
                <span>{lang === 'ka' ? 'ადმინი' : 'Admin'}</span>
              </button>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-[9px] font-black uppercase text-amber-400">
                <TableIcon className="w-3 h-3" />
                <span>#{selectedTableNumber}</span>
              </div>
            </div>
          </div>

          {/* Main Categories Panel */}
          <div className="flex-1 flex flex-col justify-center py-6 space-y-6 max-w-sm mx-auto w-full">
            <div className="text-center space-y-1.5">
              <h2 className="text-xl font-black uppercase tracking-widest text-slate-100">
                {isFoodSubmenuOpen 
                  ? (lang === 'ka' ? 'კერძების მენიუ 🍽️' : 'Culinary Dishes 🍽️')
                  : (lang === 'ka' ? 'შეარჩიეთ კატეგორია' : 'Choose Category')}
              </h2>
              <p className="text-[10px] text-slate-400">
                {isFoodSubmenuOpen
                  ? (lang === 'ka' ? 'გემრიელი კერძები, სალათები, სენდვიჩები და დესერტები' : 'Scrumptious appetizers, local salads, sandwiches, and treats')
                  : (lang === 'ka' ? 'აღმოაჩინეთ ჩვენი გურმანული ასორტიმენტი' : 'Explore our signature gourmet categories')}
              </p>
            </div>

            {/* Custom Premium Bento Grid / Visual Cards Grid */}
            {!isFoodSubmenuOpen ? (
              <div className="grid grid-cols-2 gap-3">
                {/* 1. COFFEE CARD (Square Bento) */}
                <motion.div
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setSelectedCategory('coffee');
                    setSelectedTag('all');
                    sessionStorage.setItem('black_cat_category_selected', 'coffee');
                    setMenuStep('menu');
                  }}
                  className="col-span-1 p-4 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80 hover:border-amber-500/40 rounded-2xl cursor-pointer transition-all flex flex-col justify-between h-40 group shadow-lg relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-tr-2xl pointer-events-none" />
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-sm">
                    <span className="text-lg">☕</span>
                  </div>
                  <div className="text-left mt-3">
                    <span className="text-[11px] font-black uppercase tracking-wider block text-slate-100 font-sans">
                      {lang === 'ka' ? 'ყავა' : 'Coffee'}
                    </span>
                    <span className="text-[9px] text-slate-500 font-medium block mt-1 leading-normal">
                      {lang === 'ka' ? 'ცხელი & ცივი, ესპრესო, ფლეტ ვაითი...' : 'Espresso, Cappuccino, Flat White, Lattes...'}
                    </span>
                  </div>
                </motion.div>

                {/* 2. COLD DRINKS CARD (Square Bento) */}
                <motion.div
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setSelectedCategory('coffee');
                    setSelectedTag('ცივი');
                    sessionStorage.setItem('black_cat_category_selected', 'cold-drinks');
                    setMenuStep('menu');
                  }}
                  className="col-span-1 p-4 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80 hover:border-amber-500/40 rounded-2xl cursor-pointer transition-all flex flex-col justify-between h-40 group shadow-lg relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-tr-2xl pointer-events-none" />
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-sm">
                    <span className="text-lg">🥤</span>
                  </div>
                  <div className="text-left mt-3">
                    <span className="text-[11px] font-black uppercase tracking-wider block text-slate-100 font-sans">
                      {lang === 'ka' ? 'ცივი სასმელი' : 'Cold Drinks'}
                    </span>
                    <span className="text-[9px] text-slate-500 font-medium block mt-1 leading-normal">
                      {lang === 'ka' ? 'ლიმონათები, ცივი ჩაი, ამერიკანო...' : 'Limonades, Iced Brews, Refreshers...'}
                    </span>
                  </div>
                </motion.div>

                {/* 3. WINES CARD (Wide Bento) */}
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedCategory('wine');
                    setSelectedTag('all');
                    sessionStorage.setItem('black_cat_category_selected', 'wine');
                    setMenuStep('menu');
                  }}
                  className="col-span-2 p-4 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800/80 hover:border-amber-500/40 rounded-2xl cursor-pointer transition-all flex items-center justify-between group shadow-lg relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-tr-2xl pointer-events-none" />
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 group-hover:bg-amber-600 group-hover:text-white transition-all shrink-0 shadow-md">
                      <span className="text-xl animate-pulse">🍷</span>
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider block text-slate-100 font-sans flex items-center gap-1.5">
                        <span>{lang === 'ka' ? 'ღვინის კოლექცია' : 'Wine Collection'}</span>
                        <span className="text-[8px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/25">PREMIUM</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium block mt-0.5 max-w-[200px] leading-relaxed">
                        {lang === 'ka' ? 'ქართული საუკეთესო ქვევრის, თეთრი და წითელი ღვინოები...' : 'Vintage Georgian qvevri, premium white and red select wines...'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-amber-500 transition-colors shrink-0" />
                </motion.div>

                {/* 4. DISHES CARD (Wide Bento) */}
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setIsFoodSubmenuOpen(true);
                  }}
                  className="col-span-2 p-4 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800/80 hover:border-amber-500/40 rounded-2xl cursor-pointer transition-all flex items-center justify-between group shadow-lg relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-tr-2xl pointer-events-none" />
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 group-hover:bg-amber-600 group-hover:text-white transition-all shrink-0 shadow-md">
                      <span className="text-xl">🍽️</span>
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider block text-slate-100 font-sans flex items-center gap-1.5">
                        <span>{lang === 'ka' ? 'კერძების მენიუ' : 'Culinary Food Dishes'}</span>
                        <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/25">GOURMET</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium block mt-0.5 max-w-[200px] leading-relaxed font-sans">
                        {lang === 'ka' ? 'საუზმე, სტარტერები, ცოცხალი სალათები და დახვეწილი დესერტები...' : 'Breakfast, artisanal salads, sandwiches, and treats...'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-amber-500 transition-colors shrink-0" />
                </motion.div>
              </div>
            ) : (
              // SUB-CATEGORIES FOR DISHES ("ჩაშლილი ამის შემდეგ ეტაპზე")
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  { id: 'breakfast-starters', emoji: '🍳', nameKa: 'საუზმე და სტარტერები', nameEn: 'Breakfast & Starters', descKa: 'ომლეტი ტრიუფელით, ფაფები...', descEn: 'Truffle omelette, warm cereal...' },
                  { id: 'salads', emoji: '🥗', nameKa: 'სალათები', nameEn: 'Fresh Salads', descKa: 'ცეზარი, ნოყიერი ბანგკოკი...', descEn: 'Caesar salad, hearty Bangkok greens...' },
                  { id: 'sandwiches', emoji: '🥪', nameKa: 'სენდვიჩები', nameEn: 'Gourmet Sandwiches', descKa: 'კლასიკური კლაბი, ტოსტი...', descEn: 'Classic club, grilled toasts...' },
                  { id: 'wine-bites', emoji: '🧀', nameKa: 'ღვინის დასაყოლებელი', nameEn: 'Wine Bites & Platters', descKa: 'ევროპული ყველის დაფა, ხორცი...', descEn: 'Premium cheese & meat platters...' },
                  { id: 'desserts', emoji: '🍰', nameKa: 'დესერტები', nameEn: 'Desserts & Sweets', descKa: 'ჩიზქეიქი, საუცხოო ტირამისუ...', descEn: 'Cheesecake, classical tiramisu...' },
                ].map((sub, sIdx) => (
                  <motion.div
                    key={sub.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: sIdx * 0.05 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedCategory(sub.id);
                      setSelectedTag('all');
                      sessionStorage.setItem('black_cat_category_selected', sub.id);
                      setMenuStep('menu');
                    }}
                    className="p-3 bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800/80 hover:border-amber-500/30 rounded-xl cursor-pointer transition-all flex items-center justify-between group shadow-sm text-left relative overflow-hidden"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-sm">
                        <span className="text-base">{sub.emoji}</span>
                      </div>
                      <div>
                        <span className="text-[11px] font-black uppercase tracking-wider block text-slate-100 font-sans">
                          {lang === 'ka' ? sub.nameKa : sub.nameEn}
                        </span>
                        <span className="text-[9px] text-slate-500 font-medium block mt-0.5">
                          {lang === 'ka' ? sub.descKa : sub.descEn}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-500 transition-colors" />
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer branding */}
          <div className="pb-4 text-center shrink-0">
            <span className="text-[8px] font-black tracking-[0.15em] text-slate-600 uppercase font-mono">
              Black Cat Bistro • Dining Table #{selectedTableNumber}
            </span>
          </div>
        </div>
      )}

      {/* THANK YOU SCREEN (SCREEN 5) */}
      {showSuccessScreen ? (
        <div className="absolute inset-0 bg-white text-slate-950 flex flex-col justify-between p-6 z-40 select-none font-sans">
          {/* Confetti / Sparkles falling CSS effect background */}
          <div className="absolute inset-0 pointer-events-none z-0 opacity-40 overflow-hidden">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'][i % 5],
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 80}%`,
                }}
                animate={{
                  y: [0, 400],
                  x: [0, Math.sin(i) * 30],
                  scale: [0, 1.2, 0],
                  rotate: [0, 360]
                }}
                transition={{
                  duration: 2.5 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
              />
            ))}
          </div>

          <div></div> {/* Top spacer */}

          {/* Center Thank You Card */}
          <div className="text-center space-y-5 py-8 max-w-sm mx-auto z-10">
            {/* Green checkmark badge with nice shadow */}
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 120, damping: 10 }}
              className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 text-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/15"
            >
              <Check className="w-8 h-8 stroke-[3]" />
            </motion.div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">
                Thanks You
              </h2>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                {lang === 'ka' 
                  ? 'შეკვეთის განთავსებისთვის Pasta Pro-ში' 
                  : 'for ordering at Pasta Pro'}
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="inline-block py-1.5 px-4 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 text-[10px] font-black uppercase tracking-wider font-mono animate-pulse"
            >
              {lang === 'ka' ? 'თქვენი შეკვეთა მზადდება! 🍳' : 'Your order is preparing Now! 🍳'}
            </motion.div>
          </div>

          {/* Bottom Home Button */}
          <div className="pb-8 text-center z-10 shrink-0">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setShowSuccessScreen(false);
                clearCart();
              }}
              className="w-full max-w-[260px] py-4 bg-slate-950 hover:bg-slate-900 text-white font-extrabold uppercase tracking-widest text-[11px] rounded-full transition-all shadow-xl shadow-black/20 cursor-pointer border-none"
            >
              {lang === 'ka' ? 'მენიუში დაბრუნება' : 'Back to home'}
            </motion.button>
          </div>
        </div>
      ) : null}

      {/* 0. DYNAMIC UX FLYING PARTICLES */}
      {flyingParticles.map(p => (
        <motion.div
          key={p.id}
          initial={{ x: p.startX, y: p.startY, scale: 1.2, opacity: 1 }}
          animate={{
            x: window.innerWidth > 768 ? window.innerWidth / 2 + 100 : window.innerWidth / 2,
            y: window.innerHeight - 80,
            scale: 0.3,
            opacity: [1, 0.9, 0]
          }}
          transition={{ duration: 0.75, ease: [0.25, 1, 0.5, 1] }}
          className="fixed w-6 h-6 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 flex items-center justify-center text-white text-[11px] pointer-events-none z-50 shadow-md shadow-amber-500/50"
        >
          ✨
        </motion.div>
      ))}

      {/* 1B. GORGEOUS TABLE SELECTOR MODAL FOR GUESTS */}
      <AnimatePresence>
        {isTableSelectorOpen && (
          <motion.div
            key="table-selector-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className={`w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl p-6 space-y-5 relative transition-colors duration-300 ${
                theme === 'dark' ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white border border-slate-100 text-slate-900'
              }`}
            >
              <button 
                onClick={() => setIsTableSelectorOpen(false)}
                className={`absolute top-4 right-4 p-1.5 rounded-full transition-all cursor-pointer border-none flex items-center justify-center ${
                  theme === 'dark' ? 'bg-slate-850 text-slate-400 hover:bg-slate-800' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20">
                  <TableIcon className="w-5 h-5 animate-pulse" />
                </div>
                <h2 className="text-base font-black font-serif">
                  {lang === 'ka' ? 'მაგიდის შეცვლა' : 'Change Table'}
                </h2>
                <p className="text-[10px] text-slate-450">
                  {lang === 'ka' ? 'შეარჩიეთ თქვენი მაგიდა მენიუდან სურვილისამებრ' : 'Select your dining table from the restaurant layout'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 max-h-[280px] overflow-y-auto pr-1">
                {tables.map((tbl) => (
                  <button
                    key={tbl.id}
                    onClick={() => {
                      setSelectedTableNumber(tbl.number);
                      localStorage.setItem('black_cat_guest_table', String(tbl.number));
                      setIsTableSelectorOpen(false);
                    }}
                    className={`p-3.5 rounded-2xl text-left border flex flex-col justify-between transition-all cursor-pointer h-20 relative ${
                      selectedTableNumber === tbl.number
                        ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                        : theme === 'dark'
                        ? 'bg-slate-850 hover:bg-slate-800 border-slate-800 text-slate-300'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200/50 text-slate-700'
                    }`}
                  >
                    <span className="text-xs font-black">
                      {lang === 'ka' ? `მაგიდა #${tbl.number}` : `Table #${tbl.number}`}
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold truncate block max-w-[120px]">
                      {tbl.name || 'Bistro Dining'}
                    </span>
                    {selectedTableNumber === tbl.number && (
                      <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. INITIAL FUTURISTIC LANGUAGE SELECTION OVERLAY SCREEN */}
      <AnimatePresence>
        {menuStep === 'language' && (
          <motion.div
            key="lang-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/95 flex items-center justify-center z-50 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 overflow-hidden shadow-2xl relative space-y-6"
            >
              {/* Subtle tech grid indicator */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-tr-3xl pointer-events-none" />

              {/* Header */}
              <div className="text-center space-y-2">
                <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 mb-1">
                  <Languages className="w-6 h-6 animate-pulse" />
                </div>
                <h2 className="text-lg font-black text-slate-100 uppercase tracking-widest font-mono">
                  Black Cat Digital Menu
                </h2>
                <p className="text-[11px] text-slate-400">
                  მოგესალმებით! გთხოვთ შეარჩიოთ მენიუს ენა, ან მიუთითოთ ნებისმიერი სასურველი ენა AI თარგმნისთვის
                </p>
              </div>

              {/* Presets Grid */}
              <div className="space-y-2">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block font-mono">
                  სტანდარტული ენები / Default presets
                </span>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => selectPresetLanguage('ka')}
                    className="w-full py-3.5 px-4 bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-100 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-all cursor-pointer outline-none active:scale-99"
                  >
                    <span className="flex items-center gap-3 text-sm">
                      <span className="text-xl">🇬🇪</span>
                      <span>ქართული</span>
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </button>

                  <button
                    onClick={() => selectPresetLanguage('en')}
                    className="w-full py-3.5 px-4 bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-100 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-all cursor-pointer outline-none active:scale-99"
                  >
                    <span className="flex items-center gap-3 text-sm">
                      <span className="text-xl">🇬🇧</span>
                      <span>English Menu</span>
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </button>

                  <button
                    onClick={() => selectPresetLanguage('ru')}
                    className="w-full py-3.5 px-4 bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-100 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-all cursor-pointer outline-none active:scale-99"
                  >
                    <span className="flex items-center gap-3 text-sm">
                      <span className="text-xl">🇷🇺</span>
                      <span>Русское Меню</span>
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              </div>

              {/* Dynamic AI Translation Option */}
              <div className="border-t border-slate-850 pt-4 space-y-3">
                <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest block font-mono flex items-center gap-1">
                  <Sparkles className="w-3 h-3 animate-spin" />
                  <span>AI მყისიერი თარგმანი / Custom AI translation</span>
                </span>
                
                <div className="flex gap-2 relative">
                  <input
                    type="text"
                    value={manualLangInput}
                    onChange={(e) => setManualLangInput(e.target.value)}
                    placeholder="მაგ: Italian, German, Arabic..."
                    className="flex-1 bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl px-4 py-3 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  <button
                    onClick={() => handleTriggerAiTranslation(manualLangInput)}
                    disabled={isAiTranslating || !manualLangInput.trim()}
                    className="px-4 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs rounded-xl transition-all border-none cursor-pointer"
                  >
                    🚀 თარგმნა
                  </button>
                </div>

                {/* AI Loading/Scanning animations */}
                {isAiTranslating && (
                  <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 text-center space-y-3 animate-slideUp">
                    {/* Glowing Scan Bar */}
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden relative">
                      <motion.div 
                        className="absolute h-full bg-amber-500"
                        animate={{ left: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ width: '40%' }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                      <span>{aiProgressMsg}</span>
                      <span className="text-amber-500">{aiTranslationProgress}%</span>
                    </div>
                  </div>
                )}

                {aiTranslationError && (
                  <div className="p-3 bg-red-950/40 border border-red-800/40 rounded-xl text-red-400 text-[10px] leading-relaxed flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{aiTranslationError}</span>
                  </div>
                )}
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. TRANSLATION WELCOME TOAST INSTRUCTION SUMMARY */}
      <AnimatePresence>
        {showInstructionToast && (
          <div className="absolute top-16 inset-x-4 z-40 animate-slideUp">
            <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-amber-500/40 rounded-2xl p-4 shadow-xl flex items-start gap-3 relative">
              <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl shrink-0">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest block font-sans">
                  {lang === 'ka' && 'ინსტრუქცია • Instruction'}
                  {lang === 'en' && 'SYSTEM GUIDE'}
                  {lang === 'ru' && 'ПОДСКАЗКА СИСТЕМЫ'}
                  {lang === 'custom' && `AI TRANSLATED TO ${customLangName.toUpperCase()}`}
                </span>
                <p className="text-xs text-slate-200 leading-relaxed font-sans font-bold">
                  {lang === 'ka' && '🍽️ შეგიძლიათ კერძები/სასმელები შეარჩიოთ, ჩაამატოთ კალათაში და თავად განახორციელოთ შეკვეთა, სურვილისამებრ!'}
                  {lang === 'en' && '🍽️ You can select dishes/drinks, add them to your cart, and place the order yourself, optionally!'}
                  {lang === 'ru' && '🍽️ Вы можете выбрать блюда/напитки, добавить их в корзину и оформить заказ самостоятельно при желании!'}
                  {lang === 'custom' && `🍽️ You can select dishes/drinks, add them to your cart, and place the order yourself, optionally! (${customLangName})`}
                </p>
              </div>
              <button
                onClick={() => setShowInstructionToast(false)}
                className="absolute top-2 right-2 text-slate-500 hover:text-white border-none bg-none cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {menuStep === 'menu' && (
        <>
          {/* 3. SIMULATED CAMERA NOTCH FOR COMPACT MOBILE GRAPHIC LAYOUTS */}
      {isSimulatedMobile && (
        <div className="absolute top-0 inset-x-0 h-6 bg-slate-950 flex justify-center items-center z-50">
          <div className="w-20 h-4 bg-black rounded-b-xl border border-slate-900 border-t-0 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-slate-900"></span>
          </div>
        </div>
      )}

      {/* 4. MAIN CONTENT TABS ROUTER SYSTEM */}
      <div className={`flex-1 flex flex-col h-full overflow-hidden transition-colors duration-300 ${
        theme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'
      } ${
        isSimulatedMobile ? 'pt-6' : 'pt-0'
      }`}>

        {/* ==================== HOME TAB SCREEN (SCREEN 2) ==================== */}
        {currentTab === 'home' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Header */}
            <div className={`px-5 py-3 shrink-0 flex justify-between items-center transition-colors duration-300 ${
              theme === 'dark' ? 'bg-slate-900 border-b border-slate-800/80' : 'bg-white border-b border-slate-100'
            }`}>
              <button 
                onClick={() => {
                  sessionStorage.removeItem('black_cat_category_selected');
                  setMenuStep('categories');
                }}
                className={`py-1.5 px-3 rounded-full flex items-center gap-1 border border-transparent text-[10px] font-black uppercase transition-all cursor-pointer ${
                  theme === 'dark' ? 'bg-slate-800/60 text-amber-400 hover:bg-slate-800' : 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{lang === 'ka' ? 'კატეგორიები' : 'Categories'}</span>
              </button>
              
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black tracking-widest font-sans text-slate-900 dark:text-white uppercase">
                  Bistro Menu
                </span>
                <span className="text-xs animate-bounce">🍽️</span>
              </div>

              {/* Table and Admin Controls Info Badges */}
              <div className="flex items-center gap-1.5">
                {/* Admin Access Button */}
                <button
                  onClick={onOpenAdmin}
                  className={`text-[9px] font-black px-2.5 py-1.5 rounded-full flex items-center gap-1 transition-all border border-transparent cursor-pointer ${
                    theme === 'dark' ? 'bg-slate-800 hover:bg-slate-750 text-amber-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Lock className="w-3 h-3 text-amber-500" />
                  <span>{lang === 'ka' ? 'ადმინი' : 'Admin'}</span>
                </button>

                {/* Table Info Badge */}
                <button
                  onClick={() => setIsTableSelectorOpen(true)}
                  className={`text-[9px] font-black px-2.5 py-1.5 rounded-full flex items-center gap-1 transition-all border-none cursor-pointer ${
                    theme === 'dark' ? 'bg-slate-800 text-amber-400' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <TableIcon className="w-3 h-3" />
                  <span>#{selectedTableNumber}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DEPRECATED HEADER SPLIT */}

      {/* 5. MAIN SCROLL CONTAINER */}
      <div className="flex-1 overflow-y-auto pb-24 p-4 space-y-4">
        
        {/* Service Call Bar */}
        <div className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 ${
          theme === 'dark'
            ? 'bg-slate-900 border-slate-850 text-slate-100'
            : 'bg-white border-slate-100/80 shadow-xs text-slate-900'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-xl">
              <Bell className="w-4 h-4 animate-pulse shrink-0" />
            </div>
            <div>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 block uppercase font-black tracking-widest font-mono">
                {lang === 'ka' ? 'მაგიდის მომსახურება' : 'Table Service'}
              </span>
              <span className="text-xs font-black">
                {lang === 'ka' ? `მაგიდა #${selectedTableNumber}` : `Table #${selectedTableNumber}`}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => handleCallWaiter(lang === 'ka' ? '🛎️ მიმტანის გამოძახება' : '🛎️ Call Waiter')}
              disabled={waiterCooldown > 0}
              className="flex-1 sm:flex-none py-2 px-3.5 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-[10px] font-black cursor-pointer border-none transition-all active:scale-95 shadow-3xs flex items-center justify-center gap-1.5"
            >
              <span>🛎️</span>
              <span>{lang === 'ka' ? 'მიმტანის გამოძახება' : 'Call Waiter'}</span>
              {waiterCooldown > 0 && (
                <span className="opacity-75 font-mono">({waiterCooldown}s)</span>
              )}
            </button>
            <button
              onClick={() => handleCallWaiter(lang === 'ka' ? '🧾 ანგარიშის მოთხოვნა' : '🧾 Request Bill')}
              disabled={billCooldown > 0}
              className={`flex-1 sm:flex-none py-2 px-3.5 rounded-xl text-[10px] font-black cursor-pointer transition-all active:scale-95 border flex items-center justify-center gap-1.5 ${
                theme === 'dark'
                  ? 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-amber-400 disabled:bg-slate-850 disabled:text-slate-600'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200/50 text-slate-700 disabled:bg-slate-100 disabled:text-slate-400'
              }`}
            >
              <span>🧾</span>
              <span>{lang === 'ka' ? 'ანგარიშის მოთხოვნა' : 'Request Bill'}</span>
              {billCooldown > 0 && (
                <span className="opacity-75 font-mono">({billCooldown}s)</span>
              )}
            </button>
          </div>
        </div>

        {/* Guest Ordering Info Banner */}
        <div className="bg-amber-50/70 border border-amber-200/40 rounded-2xl p-3.5 flex items-start gap-3 shadow-3xs">
          <div className="p-1.5 bg-amber-500/10 text-amber-600 rounded-lg shrink-0 mt-0.5 animate-bounce">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block font-sans">
              {lang === 'ka' && '💡 ინფორმაცია სტუმრებისთვის'}
              {lang === 'en' && '💡 Guest Information'}
              {lang === 'ru' && '💡 Информация для гостей'}
              {lang === 'custom' && '💡 Guest Information'}
            </span>
            <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
              {lang === 'ka' && 'სურვილისამებრ, შეგიძლიათ შეკვეთა განახორციელოთ თავად - უბრალოდ დაამატეთ კერძები კალათაში და გააგზავნეთ!'}
              {lang === 'en' && 'Optionally, you can place your order yourself - simply add items to the cart and send!'}
              {lang === 'ru' && 'При желании вы можете оформить заказ самостоятельно - просто добавьте блюда в корзину и отправьте!'}
              {lang === 'custom' && 'Optionally, you can place your order yourself - simply add items to the cart and send!'}
            </p>
          </div>
        </div>

        {/* Sticky Search & filters panel */}
        <div className={`sticky top-0 z-30 -mx-4 px-4 py-3 -mt-4 mb-2 space-y-2.5 transition-colors duration-300 border-b ${
          theme === 'dark'
            ? 'bg-slate-950/95 border-slate-850/80 shadow-md shadow-slate-950/40 text-slate-100'
            : 'bg-slate-50/95 border-slate-200/40 text-slate-900'
        } backdrop-blur-md`}>
          {/* Elegant Category Navigation Header */}
          <div className="flex items-center justify-between pb-1">
            <button
              onClick={() => {
                sessionStorage.removeItem('black_cat_category_selected');
                setMenuStep('categories');
              }}
              className={`p-2 rounded-full border transition-all flex items-center justify-center cursor-pointer border-none ${
                theme === 'dark' 
                  ? 'bg-slate-900 text-amber-400 hover:bg-slate-800' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 shadow-3xs'
              }`}
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
            <h2 className={`text-xs font-black uppercase tracking-widest font-sans text-center flex-1 mx-2 ${
              theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
            }`}>
              {selectedCategory === 'all' 
                ? (lang === 'ka' ? 'სრული მენიუ' : 'Full Menu')
                : (categoryTranslations[selectedCategory]?.[lang === 'custom' ? 'en' : lang] || selectedCategory)}
            </h2>
            <div className="w-8 h-8" />
          </div>

          {/* Compact Luxury Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full border rounded-xl px-4 py-2.5 pl-9 text-xs transition-all shadow-3xs outline-none ${
                theme === 'dark'
                  ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-amber-500'
                  : 'bg-white border-slate-200/60 text-slate-800 placeholder-slate-400 focus:border-amber-500'
              }`}
            />
          </div>

          {/* Direct Dynamic Tag Presets - Slim, High-Contrast design */}
          {allTags.length > 0 && (
            <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-none shrink-0">
              <button
                onClick={() => setSelectedTag('all')}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer border ${
                  selectedTag === 'all'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : theme === 'dark'
                      ? 'bg-slate-900 text-slate-400 border-slate-800'
                      : 'bg-white text-slate-500 border-slate-100 shadow-3xs'
                }`}
              >
                {lang === 'ka' ? '#ყველა' : '#All'}
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer border ${
                    selectedTag === tag
                      ? 'bg-amber-600 text-white border-amber-600'
                      : theme === 'dark'
                        ? 'bg-slate-900 text-slate-400 border-slate-800'
                        : 'bg-white text-slate-500 border-slate-150 shadow-3xs'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dynamic Display Tracker for Table Order status */}
        {activeOrderForCurrentTable && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 text-slate-100 flex items-center justify-between gap-3 shadow-md animate-pulse">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <div>
                <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider block">
                  აქტიური შეკვეთის სტატუსი
                </span>
                <span className="text-xs text-slate-200 font-bold font-sans">
                  {activeOrderForCurrentTable.status === 'pending'
                    ? '🛰️ იგზავნება / ველოდებით პლანშეტს...'
                    : `🎉 მიღებულია! მომზადების დრო: ~${activeOrderForCurrentTable.estimatedWaitMinutes} წუთი`}
                </span>
              </div>
            </div>
            
            <div className="bg-slate-800 rounded-lg p-1.5 px-2.5 text-right font-mono shrink-0">
              <span className="text-[9px] text-slate-400 block font-sans">მაგიდა #</span>
              <span className="text-xs font-bold text-slate-100">#{activeOrderForCurrentTable.tableNumber}</span>
            </div>
          </div>
        )}

        {/* Dishes list layout switch (Wheel vs Classic) - SCREEN 2 */}
        {menuLayoutMode === 'wheel' ? (
          <div className="flex flex-col relative space-y-4">
            {translatedFilteredItems.length > 0 ? (() => {
              const safeIndex = activeWheelIndex >= translatedFilteredItems.length ? 0 : activeWheelIndex;
              const activeItem = translatedFilteredItems[safeIndex];

              return (
                <div className="space-y-4">
                  {/* Interactive Wheel Container with background visual split */}
                  <div 
                    onWheel={(e) => {
                      if (Math.abs(e.deltaY) > 5) {
                        if (e.deltaY > 0) {
                          setActiveWheelIndex(prev => (prev + 1) % translatedFilteredItems.length);
                        } else {
                          setActiveWheelIndex(prev => (prev - 1 + translatedFilteredItems.length) % translatedFilteredItems.length);
                        }
                      }
                    }}
                    onTouchStart={(e) => {
                      (window as any)._wheelTouchY = e.touches[0].clientY;
                    }}
                    onTouchMove={(e) => {
                      const startY = (window as any)._wheelTouchY;
                      if (startY === undefined) return;
                      const diffY = e.touches[0].clientY - startY;
                      if (Math.abs(diffY) > 40) {
                        if (diffY > 0) {
                          setActiveWheelIndex(prev => (prev - 1 + translatedFilteredItems.length) % translatedFilteredItems.length);
                        } else {
                          setActiveWheelIndex(prev => (prev + 1) % translatedFilteredItems.length);
                        }
                        (window as any)._wheelTouchY = e.touches[0].clientY;
                      }
                    }}
                    className="h-[280px] w-full rounded-3xl relative overflow-hidden flex items-center bg-white border border-slate-100 shadow-3xs select-none"
                  >
                    {/* Right Side Large Dark Circle Split (Screen 2 matched) */}
                    <div className="absolute right-[-140px] top-[10%] w-[300px] h-[300px] rounded-full bg-slate-950 pointer-events-none z-0"></div>

                    {/* Left Top Label Indicator */}
                    <div className="absolute left-6 top-6 bg-white/90 border border-slate-200/50 backdrop-blur-xs px-3 py-1 rounded-full shadow-3xs z-20">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-mono">
                        {lang === 'ka' ? 'აირჩიე კერძი' : 'Select Pasta'}
                      </span>
                    </div>

                    {/* The Plates Orbital Wheel */}
                    <div className="absolute inset-0 z-10 pointer-events-auto">
                      {translatedFilteredItems.map((item, idx) => {
                        const diff = idx - safeIndex;
                        const angle = diff * 45; // 45 degrees spacing
                        const isActive = idx === safeIndex;
                        const rad = (angle * Math.PI) / 180;
                        
                        // Circle mathematics (Orbiting on the right-side dark circle)
                        const radius = 170;
                        const cx = 220;
                        const cy = 140; // middle of 280px height
                        
                        const x = cx - radius * Math.cos(rad);
                        const y = cy + radius * Math.sin(rad);

                        if (Math.abs(angle) > 130) return null;

                        return (
                          <motion.div
                            key={item.id}
                            onClick={() => {
                              if (isActive) {
                                setSelectedItem(item);
                              } else {
                                setActiveWheelIndex(idx);
                              }
                            }}
                            style={{
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              width: '88px',
                              height: '88px',
                            }}
                            animate={{
                              x: x - 44, // offset 44px to center 88px plate
                              y: y - 44, // offset 44px to center 88px plate
                              scale: isActive ? 1.25 : 0.82,
                              opacity: isActive ? 1 : 0.45,
                              zIndex: isActive ? 30 : 10,
                            }}
                            transition={{ type: "spring", stiffness: 200, damping: 24 }}
                            className="cursor-pointer select-none"
                          >
                            <div className={`w-full h-full rounded-full overflow-hidden border-4 ${
                              isActive 
                                ? 'border-amber-500 shadow-xl shadow-amber-500/10' 
                                : 'border-white shadow-md shadow-black/5'
                            } bg-white transition-all duration-300`}>
                              <img 
                                src={item.image || "https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=150&h=150&q=80"} 
                                alt={item.name}
                                className="w-full h-full object-cover select-none pointer-events-none"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            {isActive && (
                              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-amber-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider font-mono shadow-xs">
                                ACTIVE
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Wheel Navigation Arrow Indicator Aids */}
                    <div className="absolute left-6 bottom-6 flex gap-2 z-20">
                      <button 
                        onClick={() => {
                          setActiveWheelIndex(prev => (prev - 1 + translatedFilteredItems.length) % translatedFilteredItems.length);
                        }}
                        className="p-1.5 rounded-full bg-slate-900 text-white border-none cursor-pointer transition-colors hover:bg-slate-800"
                      >
                        <ChevronDown className="w-3.5 h-3.5 transform rotate-180" />
                      </button>
                      <button 
                        onClick={() => {
                          setActiveWheelIndex(prev => (prev + 1) % translatedFilteredItems.length);
                        }}
                        className="p-1.5 rounded-full bg-slate-900 text-white border-none cursor-pointer transition-colors hover:bg-slate-800"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Active Plate Description Board */}
                  {activeItem && (
                    <motion.div
                      key={activeItem.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 rounded-3xl border border-slate-100 bg-white text-center shadow-3xs"
                    >
                      <div className="space-y-1">
                        <h3 className="text-sm font-black uppercase tracking-tight font-sans text-slate-900">
                          {activeItem.name}
                        </h3>
                        <p className="text-[10px] text-slate-500 line-clamp-2 max-w-xs mx-auto leading-relaxed">
                          {activeItem.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-center gap-4 mt-4">
                        <span className="text-xs font-black font-mono text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-lg">
                          {activeItem.price} ₾
                        </span>
                        
                        <button
                          onClick={() => setSelectedItem(activeItem)}
                          className="px-5 py-2.5 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all border-none cursor-pointer active:scale-97 shadow-md flex items-center gap-1.5"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>{t.addToOrderBtn}</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })() : (
              <div className={`text-center border border-dashed rounded-2xl p-8 text-xs ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-white border-slate-200 text-slate-400'
              }`}>
                {t.emptySearchTitle}
              </div>
            )}
          </div>
        ) : (
          /* Classic List View */
          translatedFilteredItems.length > 0 ? (
            <div className="space-y-3 pb-12">
              {translatedFilteredItems.map((item, itemIdx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(0.2, itemIdx * 0.04) }}
                  onClick={() => setSelectedItem(item)}
                  className={`rounded-2xl p-3 shadow-xs transition-all duration-300 flex justify-between gap-3 relative group cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-slate-900 border border-slate-850/80 hover:border-amber-500/25 hover:bg-slate-900/90'
                      : 'bg-white border border-slate-200/65 hover:border-amber-500/20 hover:shadow-xs'
                  } ${item.isAvailable === false ? 'opacity-60' : ''}`}
                >
                  {/* Text Details (Left/Center) */}
                  <div className="flex-1 flex flex-col justify-between min-w-0 pr-1">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className={`text-xs font-black tracking-tight leading-snug transition-colors uppercase ${
                          theme === 'dark' ? 'text-slate-100 group-hover:text-amber-400' : 'text-slate-900 group-hover:text-amber-700'
                        }`}>
                          {item.name}
                        </h3>
                        {item.isAvailable === false && (
                          <span className="text-[7px] font-black px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/15 uppercase tracking-wider font-sans">
                            {t.outOfStock}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-450 dark:text-slate-400/90 leading-relaxed line-clamp-1">
                        {item.description}
                      </p>
                    </div>

                    {/* Pricing & Modern Rounded Add Button Row */}
                    <div className="flex justify-between items-center mt-3 pt-1">
                      {/* Prices block */}
                      {item.priceGlass || item.priceBottle ? (
                        <div className="flex gap-1 text-[8px] font-bold">
                          {item.priceGlass && (
                            <span className={`rounded-lg px-2 py-0.5 border ${
                              theme === 'dark' ? 'bg-amber-950/30 text-amber-300 border-amber-900/20' : 'bg-amber-50/60 text-amber-800 border-amber-200/40'
                            }`}>
                              🍷 ჭიქა: {item.priceGlass}₾
                            </span>
                          )}
                          {item.priceBottle && (
                            <span className={`rounded-lg px-2 py-0.5 border ${
                              theme === 'dark' ? 'bg-amber-950/30 text-amber-300 border-amber-900/20' : 'bg-amber-50/60 text-amber-800 border-amber-200/40'
                            }`}>
                              🍾 ბოთლი: {item.priceBottle}₾
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className={`text-xs font-black font-mono tracking-tight text-amber-600 dark:text-amber-400`}>
                          {item.price} ₾
                        </span>
                      )}

                      {/* Minimalist Round Plus Button */}
                      {item.isAvailable !== false && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.priceGlass || item.priceBottle) {
                              setOptionPickerItem(item);
                            } else {
                              handleAddToCart(item, undefined, e);
                            }
                          }}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer border-none shadow-sm active:scale-90 ${
                            theme === 'dark' 
                              ? 'bg-amber-600 hover:bg-amber-500 text-white' 
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Image Block (Right) */}
                  {item.image && (
                    <div className={`w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden shrink-0 select-none shadow-sm relative transition-colors duration-300 ${
                      theme === 'dark' ? 'border border-slate-800 bg-slate-850' : 'border border-slate-100/80 bg-slate-100'
                    }`}>
                      <ImageWithSkeleton
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className={`text-center border border-dashed rounded-2xl p-8 text-xs ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-white border-slate-200 text-slate-400'
            }`}>
              {t.emptySearchTitle}
            </div>
          )
        )}

      </div>

      {/* 7. GLASS/BOTTLE OPTIONS DETAILED SELECTOR TRIGGER DRAWER */}
      <AnimatePresence>
        {optionPickerItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOptionPickerItem(null)}
            className="absolute inset-0 bg-black/60 z-50 flex items-end justify-center"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full rounded-t-3xl p-5 border pb-8 space-y-4 transition-colors duration-300 ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-900'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className={`text-sm font-black leading-tight transition-colors duration-300 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    {getTranslatedItemLocal(optionPickerItem).name}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-mono">სასმელის ტიპის შერჩევა / Choose type</p>
                </div>
                <button
                  onClick={() => setOptionPickerItem(null)}
                  className={`p-1.5 rounded-full border-none cursor-pointer transition-colors duration-300 ${
                    theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                {optionPickerItem.priceGlass && (
                  <button
                    onClick={(e) => handleAddToCart(optionPickerItem, 'glass', e)}
                    className={`p-4 rounded-2xl text-center space-y-1 transition-all cursor-pointer border ${
                      theme === 'dark'
                        ? 'bg-amber-950/30 hover:bg-amber-950/50 border-amber-900/30'
                        : 'bg-amber-50 hover:bg-amber-100/70 border-amber-200/50'
                    }`}
                  >
                    <span className="text-xl block">🍷</span>
                    <span className={`text-xs font-black block ${theme === 'dark' ? 'text-amber-300' : 'text-amber-900'}`}>{t.glass}</span>
                    <span className={`text-xs font-extrabold block ${theme === 'dark' ? 'text-amber-400' : 'text-amber-800'}`}>{optionPickerItem.priceGlass} ₾</span>
                  </button>
                )}

                {optionPickerItem.priceBottle && (
                  <button
                    onClick={(e) => handleAddToCart(optionPickerItem, 'bottle', e)}
                    className={`p-4 rounded-2xl text-center space-y-1 transition-all cursor-pointer border ${
                      theme === 'dark'
                        ? 'bg-amber-950/30 hover:bg-amber-950/50 border-amber-900/30'
                        : 'bg-amber-50 hover:bg-amber-100/70 border-amber-200/50'
                    }`}
                  >
                    <span className="text-xl block">🍾</span>
                    <span className={`text-xs font-black block ${theme === 'dark' ? 'text-amber-300' : 'text-amber-900'}`}>{t.bottle}</span>
                    <span className={`text-xs font-extrabold block ${theme === 'dark' ? 'text-amber-400' : 'text-amber-800'}`}>{optionPickerItem.priceBottle} ₾</span>
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 8. DETAILED SHOWCASE PRODUCT MODAL (IF SELECTING LIST CARD) - SCREEN 3 */}
      <AnimatePresence>
        {selectedItem && (() => {
          const transItem = getTranslatedItemLocal(selectedItem);
          const itemStats = getItemDetailsSpec(selectedItem.id);
          return (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 flex items-end justify-center z-50 pointer-events-auto"
              onClick={() => {
                setSelectedItem(null);
                setDetailQty(1);
              }}
            >
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="w-full h-full max-h-[88vh] rounded-t-[40px] overflow-hidden shadow-2xl flex flex-col bg-white border border-slate-100"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close/Back Button */}
                <button
                  onClick={() => {
                    setSelectedItem(null);
                    setDetailQty(1);
                  }}
                  className="absolute top-5 left-5 text-white bg-slate-900/60 hover:bg-slate-900/80 p-2 rounded-full cursor-pointer border-none flex items-center justify-center z-50 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
                </button>

                {/* Top Half (Solid Black Background) */}
                <div className="h-64 sm:h-72 relative bg-slate-950 flex flex-col justify-end p-6 pb-8 shrink-0 select-none">
                  <div className="space-y-1.5 max-w-[55%] pb-2">
                    <span className="inline-block px-2.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-[0.15em] bg-amber-500/10 text-amber-400 border border-amber-500/25">
                      {selectedItem.category}
                    </span>
                    <h2 className="text-lg sm:text-xl font-black text-white leading-tight font-sans">
                      {transItem.name}
                    </h2>
                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                      {transItem.description}
                    </p>
                    <div className="pt-2 text-sm sm:text-base font-black text-white font-mono">
                      {selectedItem.price} ₾
                    </div>
                    
                    {/* Visual Order Badge */}
                    <div className="pt-2">
                      <span className="inline-block px-3 py-1 border border-amber-500/55 rounded-full text-amber-400 text-[8px] font-black uppercase tracking-widest font-mono">
                        Order Now
                      </span>
                    </div>
                  </div>

                  {/* Protruding Plate Image on Right */}
                  <motion.div
                    initial={{ scale: 0.8, x: 60, opacity: 0 }}
                    animate={{ scale: 1.25, x: 0, opacity: 1 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 140, delay: 0.1 }}
                    className="absolute right-[-15px] bottom-[-30px] w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden border-4 border-slate-950 shadow-2xl shadow-black/85 z-20 bg-slate-900 shrink-0 select-none pointer-events-none"
                  >
                    <img
                      src={selectedItem.image || "https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=300&h=300&q=80"}
                      alt={transItem.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </motion.div>
                </div>

                {/* Bottom Half (Crisp White Sheet) */}
                <div className="bg-white text-slate-950 p-6 pt-12 flex-1 flex flex-col justify-between overflow-hidden">
                  <div className="space-y-6 overflow-y-auto pr-1">
                    {/* Cooking Stats Row */}
                    <div className="grid grid-cols-3 gap-2 pb-1">
                      <div className="flex items-center gap-1.5 p-2 bg-slate-50 border border-slate-100 rounded-xl justify-center shadow-3xs">
                        <span className="text-xs">⏱️</span>
                        <span className="text-[9px] font-black text-slate-600 font-mono">{itemStats.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5 p-2 bg-slate-50 border border-slate-100 rounded-xl justify-center shadow-3xs">
                        <span className="text-xs">🔥</span>
                        <span className="text-[9px] font-black text-slate-600 font-mono">{itemStats.kcal}</span>
                      </div>
                      <div className="flex items-center gap-1.5 p-2 bg-slate-50 border border-slate-100 rounded-xl justify-center shadow-3xs">
                        <span className="text-xs">⭐</span>
                        <span className="text-[9px] font-black text-slate-600 font-mono">{itemStats.rating}</span>
                      </div>
                    </div>

                    {/* Ingredients Title & Box */}
                    <div className="space-y-2">
                      <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest font-mono">
                        {lang === 'ka' ? 'ინგრედიენტები' : 'Ingredients'}
                      </h3>
                      <p className="text-[11px] leading-relaxed text-slate-500 font-medium">
                        {itemStats.ingredients}
                      </p>
                    </div>
                  </div>

                  {/* Quantity and CTA row */}
                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center gap-4 shrink-0 pb-8 bg-white">
                    {/* Minus / Quantity / Plus Selector Pill */}
                    <div className="flex items-center bg-slate-50 border border-slate-200/50 rounded-full p-1 shadow-3xs shrink-0">
                      <button
                        onClick={() => setDetailQty(prev => Math.max(1, prev - 1))}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-none cursor-pointer transition-colors active:scale-90"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-black min-w-8 text-center font-mono text-slate-800">
                        {String(detailQty).padStart(2, '0')}
                      </span>
                      <button
                        onClick={() => setDetailQty(prev => prev + 1)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-none cursor-pointer transition-colors active:scale-90"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Add To Cart CTA Button */}
                    <button
                      onClick={(e) => {
                        if (selectedItem.priceGlass || selectedItem.priceBottle) {
                          setOptionPickerItem(selectedItem);
                        } else {
                          handleAddToCartWithQuantity(selectedItem, detailQty, undefined, e);
                        }
                        setSelectedItem(null);
                        setDetailQty(1);
                      }}
                      disabled={selectedItem.isAvailable === false}
                      className="flex-1 py-3 px-5 bg-slate-950 hover:bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full text-xs font-black uppercase tracking-wider transition-all border-none cursor-pointer active:scale-97 shadow-md shadow-black/10 flex items-center justify-center gap-1.5"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>{t.addToOrderBtn}</span>
                    </button>
                  </div>
                </div>

              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* 9. FLOATING BOTTOM BILL CHECK INFOGRAPHIC BAR (FLOATING ACTION) */}
      {cart.length > 0 && (
        <div className="absolute bottom-4 inset-x-4 z-40">
          <motion.div
            key={cartTriggerCount}
            animate={cartTriggerCount > 0 ? {
              scale: [1, 1.08, 0.95, 1],
              y: [0, -6, 2, 0]
            } : {}}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            initial={{ scale: 0.95, y: 15 }}
            className="rounded-2xl border border-amber-600 bg-slate-950 text-slate-100 p-2 pl-4 pr-2 flex justify-between items-center shadow-lg shadow-amber-950/20 backdrop-blur-sm relative overflow-hidden h-14"
          >
            {/* Pulsing decoration */}
            <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-amber-500 to-orange-500 animate-pulse" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 animate-bounce">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-mono tracking-widest block uppercase font-bold">
                  {lang === 'ka' && 'ჩემი კალათა'}
                  {lang === 'en' && 'MY BASKET'}
                  {lang === 'ru' && 'МОЯ КОРЗИНА'}
                  {lang === 'custom' && 'BASKET'}
                </span>
                <span className="text-xs font-bold text-slate-100">
                  {cart.length} პოზიცია • <span className="text-amber-500 font-mono tracking-tight font-black">{totalPrice} ₾</span>
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsCartSheetOpen(true)}
              className="h-10 px-4 bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-black rounded-lg transition-all flex items-center gap-1 cursor-pointer border-none active:scale-98 shadow-sm"
            >
              <span>{lang === 'ka' ? 'შეკვეთა' : 'ORDER'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        </div>
      )}
        </>
      )}

      {/* 10. EXPANDED CART REVIEW DRAWER (BOTTOM SHEET SCREEN) */}
      <AnimatePresence>
        {isCartSheetOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartSheetOpen(false)}
            className="absolute inset-0 bg-black/60 z-50 flex items-end justify-center"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full rounded-t-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border transition-colors duration-300 ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-900'
              }`}
            >
              {/* Header */}
              <div className="p-4 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-500" />
                  <h3 className="text-xs font-black uppercase tracking-widest font-mono">
                    შეკვეთის დეტალების შემოწმება / Check order
                  </h3>
                </div>
                <button
                  onClick={() => setIsCartSheetOpen(false)}
                  className="p-1 px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 border-none cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Items List */}
              <div className="p-5 flex-1 overflow-y-auto space-y-4">
                
                {/* Warning/Appending Banner if client has active order */}
                {activeOrderForCurrentTable && (
                  <div className="p-3 bg-amber-50 border border-amber-200/60 rounded-xl flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-[10px] text-amber-900 leading-normal">
                      <strong className="block">ჩამატების რეჟიმი აქტიურია</strong>
                      თქვენ უკვე გაქვთ აქტიური მომლოდინე შეკვეთა ამ მაგიდაზე. ახალი პოზიციები პირდაპირ დაემატება არსებულ ნოტიფიკაციას პლანშეტზე!
                    </div>
                  </div>
                )}

                {/* Geolocation Verification Card */}
                <div className={`p-4 border rounded-2xl transition-all duration-300 space-y-3 ${
                  isLocationVerified
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-500/5 border-amber-500/20 text-amber-500'
                }`}>
                  <div className="flex items-start gap-2.5">
                    {isLocationVerified ? (
                      <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
                        <Check className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-xl">
                        <Compass className="w-4 h-4 animate-spin" />
                      </div>
                    )}
                    <div className="space-y-1 flex-1">
                      <span className={`text-[10px] font-black uppercase tracking-wider block ${
                        isLocationVerified ? 'text-emerald-500' : 'text-amber-500'
                      }`}>
                        {lang === 'ka' ? '📍 მდებარეობის უსაფრთხოება' : '📍 Location Security Verification'}
                      </span>
                      <p className={`text-[10px] leading-relaxed font-semibold ${
                        isLocationVerified ? 'text-emerald-600/90 dark:text-emerald-400/90' : 'text-slate-500'
                      }`}>
                        {isLocationVerified
                          ? (lang === 'ka' ? 'მდებარეობა დადასტურებულია! შეკვეთა მყისიერად გაიგზავნება სამზარეულოში.' : 'Location verified! Your order goes directly to the kitchen.')
                          : (lang === 'ka' ? 'უსაფრთხო შეკვეთისთვის, დაადასტურეთ რომ ფიზიკურად იმყოფებით რესტორანში.' : 'To protect against fake orders, verify you are physically at the table.')}
                      </p>
                    </div>
                  </div>

                  {!isLocationVerified && (
                    <button
                      onClick={handleVerifyLocation}
                      className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-[10px] font-black cursor-pointer border-none transition-all active:scale-95 shadow-3xs flex items-center justify-center gap-1.5"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>{lang === 'ka' ? 'მდებარეობის ვერიფიკაცია' : 'Verify My Location'}</span>
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {cart.map((cartItem) => (
                    <div key={cartItem.id} className={`p-3.5 rounded-2xl border transition-colors duration-300 space-y-3 ${
                      theme === 'dark' ? 'bg-slate-850/60 border-slate-800' : 'bg-slate-50 border border-slate-100'
                    }`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <span className={`text-xs font-bold block ${theme === 'dark' ? 'text-white' : 'text-slate-850'}`}>{cartItem.name}</span>
                          {cartItem.selectedOption && cartItem.selectedOption !== 'standard' && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 font-extrabold rounded px-1.5 py-0.2 ml-0 block w-max mt-1 font-mono uppercase">
                              {cartItem.selectedOption === 'glass' ? 'ჭიქა' : 'ბოთლი'}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono block mt-1">{cartItem.price} ₾ / ცალი</span>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => handleDecreaseCart(cartItem.id)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer border ${
                              theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className={`text-xs font-bold min-w-4 text-center font-mono ${theme === 'dark' ? 'text-slate-200' : 'text-slate-850'}`}>{cartItem.quantity}</span>
                          <button
                            onClick={() => handleIncreaseCart(cartItem.id)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer border ${
                              theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Comment/Note Input field */}
                      <div className="relative">
                        <input
                          type="text"
                          value={cartItem.note || ''}
                          onChange={(e) => handleUpdateCartItemNote(cartItem.id, e.target.value)}
                          placeholder={lang === 'ka' ? '📝 შენიშვნა კერძზე (ალერგია, სპეც. მომზადება)...' : '📝 Special request / notes (allergies, prep)...'}
                          className={`w-full px-3 py-2 rounded-xl text-[10px] font-semibold outline-none transition-all border ${
                            theme === 'dark'
                              ? 'bg-slate-900 border-slate-800 text-slate-300 focus:border-amber-500/50'
                              : 'bg-white border-slate-200 focus:border-amber-500'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Table selector block inside modal */}
                <div className={`space-y-1.5 p-3.5 border rounded-2xl transition-colors duration-300 ${
                  theme === 'dark' ? 'bg-slate-850 border-slate-800 text-slate-300' : 'bg-slate-50 border border-slate-100 text-slate-700'
                }`}>
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">სერვის მაგიდა / Service Table</span>
                  <div className="flex justify-between items-center gap-3">
                    <span className="text-xs font-bold">შესაკვეთ მაგიდად არჩეულია:</span>
                    <div className={`flex items-center gap-1 font-black ${theme === 'dark' ? 'text-amber-400' : 'text-slate-950'}`}>
                      <TableIcon className="w-4 h-4 text-slate-500" />
                      <span className="text-xs">მაგიდა #{selectedTableNumber}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className={`p-4 border-t shrink-0 space-y-3 pb-8 transition-colors duration-300 ${
                theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-150'
              }`}>
                <div className={`flex justify-between items-center px-1 font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                  <span className="text-xs font-semibold text-slate-450">სტუმრის სულ ჯამი:</span>
                  <span className="text-base font-black font-mono tracking-tight text-amber-500">{totalPrice} ₾</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      clearCart();
                      setIsCartSheetOpen(false);
                    }}
                    className={`py-3 px-3.5 rounded-xl text-xs font-bold border-none transition-all cursor-pointer ${
                      theme === 'dark' ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 hover:bg-slate-250 text-slate-700'
                    }`}
                  >
                    გასუფთავება
                  </button>
                  <button
                    onClick={handleFinalizeCartAndSend}
                    className={`flex-1 py-3 border-none text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer ${
                      theme === 'dark' ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-950/40' : 'bg-slate-950 hover:bg-slate-900'
                    }`}
                  >
                    <span>{activeOrderForCurrentTable ? '🚀 ჩამატება შეკვეთაზე' : '🚀 შეკვეთის გაგზავნა'}</span>
                  </button>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🔐 PREMIUM CUSTOM CONFIRMATION DIALOG MODAL */}
      <AnimatePresence>
        {customDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[60] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 p-6 space-y-6 text-center relative"
            >
              <div className="space-y-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto border ${
                  customDialog.icon === 'success'
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    : customDialog.icon === 'warning'
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                }`}>
                  {customDialog.icon === 'success' ? (
                    <Check className="w-5 h-5" />
                  ) : customDialog.icon === 'warning' ? (
                    <AlertCircle className="w-5 h-5 animate-pulse" />
                  ) : (
                    <HelpCircle className="w-5 h-5" />
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-black text-slate-900 dark:text-slate-150 uppercase tracking-widest font-sans">
                    {customDialog.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                    {customDialog.message}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setCustomDialog(null)}
                className="w-full py-3 bg-slate-950 hover:bg-slate-900 dark:bg-amber-600 dark:hover:bg-amber-500 text-white font-extrabold text-[11px] uppercase tracking-widest rounded-xl transition-all cursor-pointer border-none"
              >
                {lang === 'ka' ? 'გასაგებია' : 'OK'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
