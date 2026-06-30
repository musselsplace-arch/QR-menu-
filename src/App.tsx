import React, { useState, useEffect } from 'react';
import { MenuItem, Review, Table, Order, CartItem } from './types';
import { INITIAL_MENU_ITEMS, INITIAL_TABLES } from './data';
import GuestMenu from './components/GuestMenu';
import RestaurateurDashboard from './components/RestaurateurDashboard';
import TabletDashboard from './components/TabletDashboard';
import { Store, UserCheck, Lock, ShieldAlert, Key, HelpCircle, X, ChevronLeft } from 'lucide-react';
import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  updateDoc, 
  deleteDoc, 
  writeBatch,
  handleFirestoreError,
  OperationType
} from './firebase';

export default function App() {
  // 1. Reactive Real-time Firestore States (Synced across all devices)
  const [items, setItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [waiterNotifications, setWaiterNotifications] = useState<Array<{
    id: string;
    tableNumber: number;
    requestType: string;
    time: string;
    timestamp?: number;
  }>>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [selectedTableId, setSelectedTableId] = useState<string>('1');
  const selectedTableForQR = tables.find(t => t.id === selectedTableId) || tables[0] || INITIAL_TABLES[0];
  const [activeRole, setActiveRole] = useState<'guest' | 'restaurateur' | 'tablet'>('guest');

  const [isAuthorized, setIsAuthorized] = useState<boolean>(() => {
    try {
      return localStorage.getItem('black_cat_is_authorized') === 'true';
    } catch {
      return false;
    }
  });
  const [isPasscodePromptOpen, setIsPasscodePromptOpen] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  // 2. Real-time Listeners and Bootstrapping for each Firestore collection

  // A. Live Menu items
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'items'), async (snapshot) => {
      if (snapshot.empty) {
        setItems(INITIAL_MENU_ITEMS);
        try {
          const batch = writeBatch(db);
          INITIAL_MENU_ITEMS.forEach(item => {
            batch.set(doc(db, 'items', item.id), item);
          });
          await batch.commit();
        } catch (err) {
          console.error("Bootstrapping items failed:", err);
        }
      } else {
        const loadedItems: MenuItem[] = [];
        snapshot.forEach(doc => {
          loadedItems.push(doc.data() as MenuItem);
        });
        setItems(loadedItems);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'items');
    });
    return () => unsub();
  }, []);

  // B. Live Tables
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'tables'), async (snapshot) => {
      if (snapshot.empty) {
        setTables(INITIAL_TABLES);
        try {
          const batch = writeBatch(db);
          INITIAL_TABLES.forEach(table => {
            batch.set(doc(db, 'tables', table.id), table);
          });
          await batch.commit();
        } catch (err) {
          console.error("Bootstrapping tables failed:", err);
        }
      } else {
        const loadedTables: Table[] = [];
        snapshot.forEach(doc => {
          loadedTables.push(doc.data() as Table);
        });
        loadedTables.sort((a, b) => a.number - b.number);
        setTables(loadedTables);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'tables');
    });
    return () => unsub();
  }, []);

  // C. Live Reviews
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'reviews'), async (snapshot) => {
      if (snapshot.empty) {
        const initialReviews = [
          {
            id: 'rev-1',
            rating: 5,
            comment: 'ულამაზესი ციფრული მენიუა! უსურათო, მხატვრული აღწერები ბევრად სასიამოვნო წასაკითხია და კერძის შეკვეთის სურვილს უცებ აღვიძებს. ტრიუფელის ომლეტი იყო სრული საოცრება!',
            guestName: 'ნინო კალანდაძე',
            date: 'დღეს, 12:45',
            timestamp: Date.now() - 3600000
          },
          {
            id: 'rev-2',
            rating: 5,
            comment: 'კამამბერი თაფლით და როზმარინით წარმოუდგენლად გემრიელი იყო. ძალიან კომფორტულია, რომ მენიუ სწრაფად იტვირთება ტელეფონში.',
            guestName: 'ლევან ბერიძე',
            date: 'გუშინ, 20:15',
            timestamp: Date.now() - 7200021
          }
        ];
        setReviews(initialReviews);
        try {
          const batch = writeBatch(db);
          initialReviews.forEach(rev => {
            batch.set(doc(db, 'reviews', rev.id), rev);
          });
          await batch.commit();
        } catch (err) {
          console.error("Bootstrapping reviews failed:", err);
        }
      } else {
        const loadedReviews: Review[] = [];
        snapshot.forEach(doc => {
          loadedReviews.push(doc.data() as Review);
        });
        loadedReviews.sort((a, b) => {
          const tsA = (a as any).timestamp || 0;
          const tsB = (b as any).timestamp || 0;
          return tsB - tsA;
        });
        setReviews(loadedReviews);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'reviews');
    });
    return () => unsub();
  }, []);

  // D. Live Orders
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const loadedOrders: Order[] = [];
      snapshot.forEach(doc => {
        loadedOrders.push(doc.data() as Order);
      });
      loadedOrders.sort((a, b) => {
        const tsA = (a as any).timestamp || 0;
        const tsB = (b as any).timestamp || 0;
        return tsB - tsA;
      });
      setOrders(loadedOrders);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'orders');
    });
    return () => unsub();
  }, []);

  // E. Live Notifications (Waiter Requests)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'notifications'), (snapshot) => {
      const loadedNotifs: any[] = [];
      snapshot.forEach(doc => {
        loadedNotifs.push(doc.data());
      });
      loadedNotifs.sort((a, b) => {
        const tsA = a.timestamp || 0;
        const tsB = b.timestamp || 0;
        return tsB - tsA;
      });
      setWaiterNotifications(loadedNotifs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'notifications');
    });
    return () => unsub();
  }, []);

  // Sync isAuthorized helper to LocalStorage
  useEffect(() => {
    localStorage.setItem('black_cat_is_authorized', String(isAuthorized));
  }, [isAuthorized]);

  // 3. Action Handlers
  const handleOpenAdminArea = () => {
    if (isAuthorized) {
      setActiveRole('restaurateur');
    } else {
      setPasscodeInput('');
      setPasscodeError('');
      setIsPasscodePromptOpen(true);
    }
  };

  const handleKeypadPress = (val: string) => {
    setPasscodeError('');
    if (val === 'C') {
      setPasscodeInput('');
    } else if (val === 'back') {
      setPasscodeInput(prev => prev.slice(0, -1));
    } else {
      if (passcodeInput.length < 6) {
        const nextInput = passcodeInput + val;
        setPasscodeInput(nextInput);
        
        // Auto submit if 6 characters
        if (nextInput === '606587') {
          setIsAuthorized(true);
          setActiveRole('restaurateur');
          setIsPasscodePromptOpen(false);
          setPasscodeInput('');
          setPasscodeError('');
        } else if (nextInput === '606588') {
          setIsAuthorized(true);
          setActiveRole('tablet');
          setIsPasscodePromptOpen(false);
          setPasscodeInput('');
          setPasscodeError('');
        } else if (nextInput.length === 6) {
          setPasscodeError('არასწორი პაროლი, სცადეთ თავიდან');
          setPasscodeInput('');
        }
      }
    }
  };

  const handleUpdateItem = async (updatedItem: MenuItem) => {
    try {
      await setDoc(doc(db, 'items', updatedItem.id), updatedItem);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `items/${updatedItem.id}`);
    }
  };

  const handleAddItem = async (newItem: Omit<MenuItem, 'id'>) => {
    const generatedId = 'item-' + Math.random().toString(36).substring(2, 9);
    try {
      const itemWithId: MenuItem = {
        ...newItem,
        id: generatedId
      };
      await setDoc(doc(db, 'items', generatedId), itemWithId);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `items/${generatedId}`);
    }
  };

  const handleUpdateTableGreeting = async (tableId: string, greeting: string) => {
    try {
      await updateDoc(doc(db, 'tables', tableId), { activeGreeting: greeting });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tables/${tableId}`);
    }
  };

  const handleAddTable = async (name: string, number: number) => {
    const generatedId = 'table-' + Math.random().toString(36).substring(2, 9);
    try {
      const newTable: Table = {
        id: generatedId,
        number,
        name,
        status: 'free'
      };
      await setDoc(doc(db, 'tables', generatedId), newTable);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `tables/${generatedId}`);
    }
  };

  const handleDeleteTable = async (tableId: string) => {
    try {
      await deleteDoc(doc(db, 'tables', tableId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `tables/${tableId}`);
    }
  };

  const handleUpdateTable = async (tableId: string, updatedFields: Partial<Table>) => {
    try {
      await updateDoc(doc(db, 'tables', tableId), updatedFields);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tables/${tableId}`);
    }
  };

  const handleClearNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `notifications/${id}`);
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'notifications'));
      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'notifications');
    }
  };

  const handleTableSelect = (table: Table) => {
    setSelectedTableId(table.id);
  };

  const handleSimulateScan = async (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    
    // Simulate table scan - switch to guest view and simulate scanning that table
    setSelectedTableId(table.id);
    setActiveRole('guest');
    
    // Add a temporary simulated notifications soon as guess calls waiter
    const now = new Date();
    const formattedTime = now.toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' });
    const notificationId = 'notif-' + Math.random().toString(36).substring(2, 5);
    const mockNotification = {
      id: notificationId,
      tableNumber: table.number,
      requestType: 'წყალი / მომსახურება',
      time: formattedTime,
      timestamp: Date.now()
    };
    
    try {
      await setDoc(doc(db, 'notifications', notificationId), mockNotification);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `notifications/${notificationId}`);
    }
  };

  const handleGuestSubmitReview = async (newReview: Omit<Review, 'id' | 'date'>) => {
    const now = new Date();
    const reviewId = 'rev-' + Math.random().toString(36).substring(2, 9);
    const reviewWithId: Review = {
      ...newReview,
      id: reviewId,
      date: `დღეს, ${now.toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })}`,
      timestamp: Date.now()
    } as any;

    try {
      await setDoc(doc(db, 'reviews', reviewId), reviewWithId);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `reviews/${reviewId}`);
    }
  };

  // Switch to simulate scanning from guest QR scanner simulation
  const handleSimulatedGuestCallWaiter = async (tableNumber: number) => {
    const now = new Date();
    const formattedTime = now.toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' });
    const notificationId = 'notif-' + Math.random().toString(36).substring(2, 9);
    const newNotif = {
      id: notificationId,
      tableNumber,
      requestType: 'მიმტანის გამოძახება',
      time: formattedTime,
      timestamp: Date.now()
    };
    try {
      await setDoc(doc(db, 'notifications', notificationId), newNotif);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `notifications/${notificationId}`);
    }
  };

  // Reset core data handler (for testing)
  const handleGuestSubmitOrder = async (tableId: string, tableNumber: number, cartItems: CartItem[]) => {
    const orderId = 'ord-' + Math.random().toString(36).substring(2, 9);
    const totalPrice = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const timeString = new Date().toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' });
    const newOrder: Order = {
      id: orderId,
      tableId,
      tableNumber,
      items: cartItems,
      totalPrice,
      status: 'pending',
      createdAt: timeString,
      timestamp: Date.now()
    } as any;
    
    console.log("SUBMITTING ORDER PAYLOAD:", JSON.stringify(newOrder, null, 2));
    
    try {
      await setDoc(doc(db, 'orders', orderId), newOrder);

      // Create a notification for the active notifications feed/panel
      const notificationId = 'notif-ord-' + Math.random().toString(36).substring(2, 9);
      const newNotif = {
        id: notificationId,
        tableNumber,
        requestType: `🛒 ახალი შეკვეთა (${cartItems.length} პოზიცია, ${totalPrice} ₾)`,
        time: timeString,
        timestamp: Date.now()
      };
      await setDoc(doc(db, 'notifications', notificationId), newNotif);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `orders/${orderId}`);
    }
  };

  const handleGuestAppendToOrder = async (tableNumber: number, newItems: CartItem[]) => {
    const activeOrder = orders.find(o => o.tableNumber === tableNumber && (o.status === 'pending' || o.status === 'accepted'));
    const timeString = new Date().toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' });
    if (activeOrder) {
      const activeOrderCopy = { ...activeOrder };
      
      // Append items and merge quantities if matches id
      const mergedItems = [...activeOrderCopy.items];
      newItems.forEach(newItem => {
        const dupIdx = mergedItems.findIndex(mi => mi.id === newItem.id);
        if (dupIdx !== -1) {
          mergedItems[dupIdx] = {
            ...mergedItems[dupIdx],
            quantity: mergedItems[dupIdx].quantity + newItem.quantity
          };
        } else {
          mergedItems.push(newItem);
        }
      });

      activeOrderCopy.items = mergedItems;
      activeOrderCopy.totalPrice = mergedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
      
      // Put back to pending status so tablet highlights the notification change
      activeOrderCopy.status = 'pending';

      try {
        await setDoc(doc(db, 'orders', activeOrderCopy.id), activeOrderCopy);

        // Create a notification for the active notifications feed/panel
        const notificationId = 'notif-ord-' + Math.random().toString(36).substring(2, 9);
        const newNotif = {
          id: notificationId,
          tableNumber,
          requestType: `🚀 შეკვეთის ჩამატება (${newItems.length} პოზიცია)`,
          time: timeString,
          timestamp: Date.now()
        };
        await setDoc(doc(db, 'notifications', notificationId), newNotif);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `orders/${activeOrderCopy.id}`);
      }
    } else {
      // Fallback: create new order
      const targetTable = tables.find(t => t.number === tableNumber) || tables[0];
      const tableId = targetTable ? targetTable.id : `tbl-${tableNumber}`;
      const orderId = 'ord-' + Math.random().toString(36).substring(2, 9);
      const totalPrice = newItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
      const newOrder: Order = {
        id: orderId,
        tableId,
        tableNumber,
        items: newItems,
        totalPrice,
        status: 'pending',
        createdAt: timeString,
        timestamp: Date.now()
      } as any;
      try {
        await setDoc(doc(db, 'orders', orderId), newOrder);

        // Create a notification for the active notifications feed/panel
        const notificationId = 'notif-ord-' + Math.random().toString(36).substring(2, 9);
        const newNotif = {
          id: notificationId,
          tableNumber,
          requestType: `🛒 ახალი შეკვეთა (${newItems.length} პოზიცია, ${totalPrice} ₾)`,
          time: timeString,
          timestamp: Date.now()
        };
        await setDoc(doc(db, 'notifications', notificationId), newNotif);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `orders/${orderId}`);
      }
    }
  };

  const handleAcceptOrder = async (orderId: string, waitMinutes: number) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { 
        status: 'accepted', 
        estimatedWaitMinutes: waitMinutes 
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const handleDeclineOrder = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: 'declined' });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: 'completed' });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };



  const handleResetToDefaults = async () => {
    if (window.confirm('დარწმუნებული ხართ, რომ გსურთ მენიუს საწყის მონაცემებზე დაბრუნება?')) {
      try {
        const collections = ['items', 'tables', 'reviews', 'orders', 'notifications'];
        for (const colName of collections) {
          const snapshot = await getDocs(collection(db, colName));
          const batch = writeBatch(db);
          snapshot.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
        }
        alert('მონაცემები წარმატებით განულდა! ახლა ბრაუზერი ავტომატურად გადატვირთავს ძირითად სტრუქტურებს.');
        window.location.reload();
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, 'all-collections');
      }
    }
  };

  if (activeRole === 'tablet') {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex flex-col">
        {/* Urgent Exit tablet bar */}
        <div className="bg-slate-900 border-b border-slate-800 p-2 px-6 flex justify-between items-center shrink-0">
          <span className="text-[10px] text-orange-500 font-bold uppercase tracking-widest font-mono flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
            <span>🛰️ Tablet Terminal • Table Sync Active</span>
          </span>
          <button
            onClick={() => {
              setActiveRole('guest');
              setIsAuthorized(false);
            }}
            className="py-1 px-3 bg-rose-950/40 hover:bg-rose-950 border border-rose-800/40 text-rose-450 rounded-lg text-[10px] font-bold cursor-pointer transition-colors border-none"
          >
            🔒 გამოსვლა (Logout)
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <TabletDashboard
            orders={orders}
            tables={tables}
            waiterNotifications={waiterNotifications}
            onAcceptOrder={handleAcceptOrder}
            onDeclineOrder={handleDeclineOrder}
            onCompleteOrder={handleCompleteOrder}
            onClearNotification={handleClearNotification}
            onClearAllNotifications={handleClearAllNotifications}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col justify-start items-center transition-all duration-300 ${
      activeRole === 'guest' ? 'bg-slate-950 h-[100dvh] max-h-[100dvh] overflow-hidden' : 'bg-[#FAF9F6] min-h-screen'
    }`}>
      {/* Maximum-width wrapper for superb desktop look, fully responsive content on mobile */}
      <div className={`w-full flex flex-col bg-white dark:bg-slate-950 shadow-2xl relative transition-all duration-300 ${
        activeRole === 'guest' 
          ? 'max-w-md h-full max-h-full overflow-hidden' 
          : 'max-w-3xl min-h-screen md:my-6 md:rounded-3xl border border-slate-100 shadow-xl overflow-hidden'
      }`}>
        {activeRole === 'guest' ? (
          <GuestMenu 
            items={items}
            tables={tables}
            orders={orders}
            isSimulatedMobile={false}
            onOpenAdmin={handleOpenAdminArea}
            onSubmitOrder={handleGuestSubmitOrder}
            onAppendToOrder={handleGuestAppendToOrder}
          />
        ) : (
          <div className="p-5 overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Bistro Digital Engine</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleResetToDefaults}
                  className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold transition-colors cursor-pointer border border-slate-200/30"
                >
                  🔄 ქარხნული მონაცემების აღდგენა
                </button>
                <button
                  onClick={() => {
                    setActiveRole('guest');
                    setIsAuthorized(false);
                  }}
                  className="py-1 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-black transition-colors cursor-pointer border border-rose-200/40"
                >
                  🔒 გამოსვლა და დაკეტვა
                </button>
              </div>
            </div>
            
            <RestaurateurDashboard 
              items={items}
              tables={tables}
              reviews={reviews}
              waiterNotifications={waiterNotifications}
              selectedTableForQR={selectedTableForQR}
              appUrl={typeof window !== 'undefined' ? window.location.origin : ''}
              onUpdateItem={handleUpdateItem}
              onAddItem={handleAddItem}
              onUpdateTableGreeting={handleUpdateTableGreeting}
              onClearNotification={handleClearNotification}
              onClearAllNotifications={handleClearAllNotifications}
              onTableSelect={handleTableSelect}
              onSimulateScan={handleSimulateScan}
              onAddTable={handleAddTable}
              onDeleteTable={handleDeleteTable}
              onUpdateTable={handleUpdateTable}
            />
          </div>
        )}
      </div>

      {/* 🔐 VIP PASSCODE PROMPT OVERLAY MODAL */}
      {isPasscodePromptOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col p-6 space-y-6 relative animate-fadeIn">
            {/* Close Button */}
            <button 
              onClick={() => setIsPasscodePromptOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 bg-slate-50 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header Lock Icon */}
            <div className="text-center space-y-2 mt-2">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-600 border border-amber-200/50">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 font-serif">მართვის პანელში შესვლა</h2>
              <p className="text-[10px] text-slate-500 leading-normal max-w-[240px] mx-auto">
                ავტორიზაციისთვის შეიყვანეთ 6-ნიშნა ადმინისტრატორის პაროლი
              </p>
            </div>

            {/* Password input preview */}
            <div className="space-y-2">
              <div className="flex justify-center gap-2">
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                  <div 
                    key={idx}
                    className={`w-9 h-11 rounded-xl border flex items-center justify-center font-bold text-base transition-all ${
                      passcodeInput.length > idx 
                        ? 'border-amber-600 bg-amber-50/20 text-slate-900 shadow-2xs' 
                        : 'border-slate-200 bg-slate-50 text-slate-300'
                    }`}
                  >
                    {passcodeInput.length > idx ? '●' : ''}
                  </div>
                ))}
              </div>
              
              {passcodeError && (
                <p className="text-[10px] font-bold text-rose-600 text-center">{passcodeError}</p>
              )}
            </div>

            {/* Security Passcode Keypad */}
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'back'].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleKeypadPress(key)}
                    className={`h-11 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                      key === 'C'
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-600'
                        : key === 'back'
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200/40'
                    }`}
                  >
                    {key === 'back' ? '⌫' : key}
                  </button>
                ))}
              </div>
              
              {/* Secondary Traditional Form input for desktops */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (passcodeInput === '606587') {
                    setIsAuthorized(true);
                    setActiveRole('restaurateur');
                    setIsPasscodePromptOpen(false);
                    setPasscodeInput('');
                    setPasscodeError('');
                  } else if (passcodeInput === '606588') {
                    setIsAuthorized(true);
                    setActiveRole('tablet');
                    setIsPasscodePromptOpen(false);
                    setPasscodeInput('');
                    setPasscodeError('');
                  } else {
                    setPasscodeError('არასწორი პაროლი, სცადეთ თავიდან');
                    setPasscodeInput('');
                  }
                }}
                className="pt-2 border-t border-slate-100 text-center"
              >
                <label className="text-[9px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                  ან ჩაწერეთ კლავიატურით
                </label>
                <div className="flex gap-1 justify-center max-w-[220px] mx-auto">
                  <input
                    type="password"
                    maxLength={6}
                    value={passcodeInput}
                    onChange={(e) => {
                      const input = e.target.value.replace(/\D/g, '');
                      setPasscodeInput(input);
                      if (input === '606587') {
                        setIsAuthorized(true);
                        setActiveRole('restaurateur');
                        setIsPasscodePromptOpen(false);
                        setPasscodeInput('');
                        setPasscodeError('');
                      } else if (input === '606588') {
                        setIsAuthorized(true);
                        setActiveRole('tablet');
                        setIsPasscodePromptOpen(false);
                        setPasscodeInput('');
                        setPasscodeError('');
                      }
                    }}
                    placeholder="......"
                    className="w-full text-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900 placeholder-slate-300 focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <button
                    type="submit"
                    className="bg-slate-900 text-white rounded-lg px-3 py-1.5 text-[10px] font-bold hover:bg-slate-800 cursor-pointer"
                  >
                    შესვლა
                  </button>
                </div>
              </form>
            </div>

            <button
              onClick={() => setIsPasscodePromptOpen(false)}
              className="w-full text-slate-400 hover:text-slate-600 text-[10px] font-bold text-center flex items-center justify-center gap-1 cursor-pointer pt-2"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>უკან დაბრუნება მენიუში</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

