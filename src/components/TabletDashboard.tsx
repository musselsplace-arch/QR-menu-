import React, { useState, useEffect } from 'react';
import { Order, Table } from '../types';
import { Check, X, Clock, Play, Bell, MessageSquare, Volume2, Store } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TabletDashboardProps {
  orders: Order[];
  tables: Table[];
  waiterNotifications: Array<{
    id: string;
    tableNumber: number;
    requestType: string;
    time: string;
    timestamp?: number;
  }>;
  onAcceptOrder: (orderId: string, waitMinutes: number) => void;
  onDeclineOrder: (orderId: string) => void;
  onCompleteOrder: (orderId: string) => void;
  onClearNotification: (id: string) => void;
  onClearAllNotifications: () => void;
}

export default function TabletDashboard({
  orders,
  tables,
  waiterNotifications,
  onAcceptOrder,
  onDeclineOrder,
  onCompleteOrder,
  onClearNotification,
  onClearAllNotifications,
}: TabletDashboardProps) {
  const [selectedWaitTimes, setSelectedWaitTimes] = useState<Record<string, number>>({});
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Filter types of orders
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const activeOrders = orders.filter(o => o.status === 'accepted');
  const pastOrders = orders.filter(o => o.status === 'completed' || o.status === 'declined');

  // Trigger synthesized audio alert whenever a new pending order comes in
  useEffect(() => {
    if (pendingOrders.length > 0 && soundEnabled) {
      // Synthesize a futuristic dual-chime sound
      const playChime = () => {
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const now = ctx.currentTime;
          
          // Chime High Oscillator
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(587.33, now); // D5
          osc1.frequency.exponentialRampToValueAtTime(880, now + 0.18); // A5
          gain1.gain.setValueAtTime(0.12, now);
          gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          
          // Chime Mid Oscillator
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(293.66, now); // D4
          osc2.frequency.setValueAtTime(440, now + 0.18); // A4
          gain2.gain.setValueAtTime(0.18, now);
          gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.55);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          
          osc1.start(now);
          osc1.stop(now + 0.5);
          osc2.start(now);
          osc2.stop(now + 0.6);
        } catch (err) {
          console.log("Audio Context sound triggered but blocked by browser autoplay rules.", err);
        }
      };

      // Play twice for maximum effectiveness
      playChime();
      const t = setTimeout(() => {
        playChime();
      }, 350);

      return () => clearTimeout(t);
    }
  }, [pendingOrders.length, soundEnabled]);

  // Trigger sound alert on new waiter call too!
  useEffect(() => {
    if (waiterNotifications.length > 0 && soundEnabled) {
      const playBell = () => {
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const now = ctx.currentTime;
          
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, now); // A5
          osc.frequency.exponentialRampToValueAtTime(1320, now + 0.1); // E6
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.55);
        } catch (err) {
          console.log("Bell audio error", err);
        }
      };
      playBell();
    }
  }, [waiterNotifications.length, soundEnabled]);

  const handleAcceptClick = (orderId: string) => {
    const waitTime = selectedWaitTimes[orderId] || 15;
    onAcceptOrder(orderId, waitTime);
  };

  const setWaitValue = (orderId: string, val: number) => {
    setSelectedWaitTimes(prev => ({ ...prev, [orderId]: val }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-8 flex flex-col space-y-6">
      
      {/* Upper header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-5 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <Store className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-black text-slate-50 uppercase tracking-widest font-mono">
              Waiters' Service & Kitchen Terminal
            </h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider">
              • LIVE SYNC ACTIVATED • TABLET FEED
            </p>
          </div>
        </div>
        
        {/* Alerts controls */}
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-2 px-4 shadow-inner">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-orange-400" />
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">ხმოვანი შეტყობინება</span>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`w-12 h-6 rounded-full p-0.5 transition-all outline-none border-none cursor-pointer ${
              soundEnabled ? 'bg-orange-500' : 'bg-slate-700'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-all ${
              soundEnabled ? 'translate-x-6' : 'translate-x-0'
            }`} />
          </button>
        </div>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Pending Orders - Heavy Flashing Alert list (Left Column/Grid block) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="flex justify-between items-center bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              <h2 className="text-sm font-black uppercase text-rose-400 tracking-wider font-mono">
                ახალი შეკვეთები ({pendingOrders.length})
              </h2>
            </div>
            {pendingOrders.length > 0 && (
              <span className="text-[10px] bg-rose-500/15 border border-rose-500/30 text-rose-400 p-1 px-2.5 rounded-full font-black uppercase font-mono animate-pulse">
                ყურადღება!
              </span>
            )}
          </div>

          <AnimatePresence mode="popLayout">
            {pendingOrders.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-900/30 border border-dashed border-slate-800/60 rounded-3xl p-10 flex flex-col items-center justify-center text-center text-slate-500 space-y-2"
              >
                <Bell className="w-8 h-8 text-slate-700" />
                <span className="text-xs font-semibold">ახალი შეკვეთები არ არის</span>
                <span className="text-[10px]">სტუმრების შეკვეთები მომენტალურად გამოჩნდება აქ</span>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {pendingOrders.map((order, idx) => (
                  <motion.div
                    key={order.id}
                    layoutId={order.id}
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-slate-900 border-2 border-rose-500/70 rounded-3xl overflow-hidden shadow-lg shadow-rose-950/15 relative"
                  >
                    {/* Pulsing Red Neon Strip */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 via-orange-500 to-rose-500 animate-pulse"></div>

                    {/* Table Badge and Header */}
                    <div className="p-4 bg-slate-900/90 flex justify-between items-center border-b border-slate-800 gap-2">
                      <div className="flex items-center gap-3">
                        {/* Huge Flashing Circle Table Number badge */}
                        <div className="min-w-[56px] h-14 rounded-2xl bg-gradient-to-br from-rose-600 to-orange-500 text-white font-mono font-black text-2xl flex items-center justify-center shadow-lg border border-rose-400/40 animate-pulse">
                          {order.tableNumber}
                        </div>
                        <div>
                          <h3 className="text-base font-black text-slate-100">
                            მაგიდა #{order.tableNumber}
                          </h3>
                          <p className="text-[10px] text-slate-400 font-mono">
                            DISH TERMINAL • {order.createdAt}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block font-semibold">სულ თანხა</span>
                        <span className="text-lg font-black text-orange-400 font-mono tracking-tight">
                          {order.totalPrice} ₾
                        </span>
                      </div>
                    </div>

                    {/* Order items detail list */}
                    <div className="p-5 space-y-4 bg-slate-900/50">
                      <div className="border-b border-slate-800 pb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                          შეკვეთილი პოზიციები
                        </span>
                        
                        <div className="space-y-2">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/50">
                              <div className="flex items-center gap-2">
                                <span className="bg-orange-500/10 text-orange-400 border border-orange-500/30 text-xs font-black rounded-lg w-7 h-7 flex items-center justify-center">
                                  {item.quantity}x
                                </span>
                                <div>
                                  <span className="text-xs font-bold text-slate-200">
                                    {item.name}
                                  </span>
                                  {item.selectedOption && item.selectedOption !== 'standard' && (
                                    <span className="text-[9px] bg-slate-850 text-slate-400 border border-slate-700/60 rounded px-1.5 ml-1.5 font-bold">
                                      {item.selectedOption === 'glass' ? 'ჭიქა' : 'ბოთლი'}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className="text-xs font-bold text-slate-300 font-mono">
                                {item.price * item.quantity} ₾
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Time selector and acceptance buttons block */}
                      <div className="flex flex-col gap-3 pt-1">
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                            სავარაუდო მომზადების დრო (წთ)
                          </span>
                          
                          <div className="grid grid-cols-4 gap-1.5">
                            {[10, 15, 20, 30].map((tVal) => (
                              <button
                                key={tVal}
                                type="button"
                                onClick={() => setWaitValue(order.id, tVal)}
                                className={`py-2 rounded-lg text-xs font-black transition-all cursor-pointer border ${
                                  (selectedWaitTimes[order.id] || 15) === tVal
                                    ? 'bg-orange-600 text-white border-orange-500 shadow-sm shadow-orange-950/20'
                                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-850'
                                }`}
                              >
                                {tVal} წთ
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Direct Submit Buttons */}
                        <div className="flex gap-2 min-w-full">
                          <button
                            onClick={() => handleAcceptClick(order.id)}
                            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-98 border-none"
                          >
                            <Check className="w-4 h-4" />
                            <span>დადასტურება</span>
                          </button>
                          <button
                            onClick={() => onDeclineOrder(order.id)}
                            className="py-3 px-3 bg-rose-950/40 hover:bg-rose-950/70 border border-rose-800/40 text-rose-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-98 animate-none"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>უარყოფა</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Accepted & Active working orders - (Middle Column/Grid block) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            <h2 className="text-sm font-black uppercase text-teal-400 tracking-wider font-mono flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-500" />
              <span>მომზადების პროცესში ({activeOrders.length})</span>
            </h2>
          </div>

          <AnimatePresence mode="popLayout">
            {activeOrders.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-900/20 border border-slate-800 rounded-3xl p-8 text-center text-slate-600 text-xs"
              >
                აქტიური კერძები არ მზადდება ამ ეტაპზე
              </motion.div>
            ) : (
              <div className="space-y-4">
                {activeOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    layoutId={order.id}
                    className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden p-4 space-y-3"
                  >
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400 font-mono font-black text-sm flex items-center justify-center">
                          {order.tableNumber}
                        </div>
                        <span className="text-xs font-black text-slate-200">მაგიდა #{order.tableNumber}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 bg-slate-950 rounded px-2 py-1 border border-slate-800">
                        <Clock className="w-3.5 h-3.5 text-teal-500" />
                        <span className="text-[10px] font-mono font-bold text-teal-400">
                          {order.estimatedWaitMinutes} წთ
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {order.items.map((item, id) => (
                        <div key={id} className="text-xs text-slate-300 flex justify-between items-center py-0.5">
                          <span>
                            {item.quantity}x {item.name}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {item.price * item.quantity}₾
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => onCompleteOrder(order.id)}
                      className="w-full mt-2 py-2 bg-slate-800 hover:bg-slate-750 text-emerald-400 hover:text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-slate-700/60 cursor-pointer shadow-3xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>მიწოდებულია / დასრულება</span>
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Active Waiter Calls / Table Notifications - (Right Column/Grid block) */}
        <div className="lg:col-span-3 space-y-5">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 flex justify-between items-center">
            <h2 className="text-sm font-black uppercase text-amber-400 tracking-wider font-mono flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500 animate-bounce" />
              <span>გამოძახებები ({waiterNotifications.length})</span>
            </h2>
            {waiterNotifications.length > 0 && (
              <button
                onClick={onClearAllNotifications}
                className="text-[9px] bg-rose-950/40 hover:bg-rose-900 border border-rose-800/40 text-rose-300 py-1 px-2 rounded-lg font-bold transition-all cursor-pointer border-none"
              >
                გაწმენდა
              </button>
            )}
          </div>

          <AnimatePresence mode="popLayout">
            {waiterNotifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-900/20 border border-slate-800 rounded-3xl p-8 text-center text-slate-600 text-xs flex flex-col items-center justify-center space-y-1.5"
              >
                <Check className="w-5 h-5 text-slate-700 animate-pulse" />
                <span>აქტიური გამოძახება არ არის</span>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {waiterNotifications.map((notif) => (
                  <motion.div
                    key={notif.id}
                    layoutId={notif.id}
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-slate-900 border border-amber-500/35 rounded-2xl p-4 space-y-3 relative overflow-hidden shadow-md shadow-amber-950/5"
                  >
                    {/* Glowing Accent */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 animate-pulse"></div>

                    <div className="flex justify-between items-start gap-2 pl-1">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono font-black text-sm flex items-center justify-center shrink-0">
                          {notif.tableNumber}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-100">მაგიდა #{notif.tableNumber}</h4>
                          <span className="text-[9px] text-slate-400 block font-sans mt-0.5">{notif.time}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-850/60 text-xs font-bold text-slate-300 text-center select-none font-sans">
                      {notif.requestType}
                    </div>

                    <button
                      onClick={() => onClearNotification(notif.id)}
                      className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-[10px] font-black flex items-center justify-center gap-1 transition-all border-none cursor-pointer shadow-3xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>მომსახურება გაწეულია</span>
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
