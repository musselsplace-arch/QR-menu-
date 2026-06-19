import React, { useState } from 'react';
import { MenuItem, Review } from './types';
import { INITIAL_MENU_ITEMS } from './data';
import GuestMenu from './components/GuestMenu';

export default function App() {
  const [items] = useState<MenuItem[]>(INITIAL_MENU_ITEMS);
  const [reviews, setReviews] = useState<Review[]>([
    {
      id: 'rev-1',
      rating: 5,
      comment: 'ულამაზესი ციფრული მენიუა! უსურათო, მხატვრული აღწერები ბევრად სასიამოვნო წასაკითხია და კერძის შეკვეთის სურვილს უცებ აღვიძებს. ტრიუფელის ომლეტი იყო სრული საოცრება!',
      guestName: 'ნინო კალანდაძე',
      date: 'დღეს, 12:45'
    },
    {
      id: 'rev-2',
      rating: 5,
      comment: 'კამამბერი თაფლით და როზმარინით წარმოუდგენლად გემრიელი იყო. ძალიან კომფორტულია, რომ მენიუ სწრაფად იტვირთება ტელეფონში.',
      guestName: 'ლევან ბერიძე',
      date: 'გუშინ, 20:15'
    }
  ]);

  const handleGuestSubmitReview = (newReview: Omit<Review, 'id' | 'date'>) => {
    const now = new Date();
    const reviewWithId: Review = {
      ...newReview,
      id: 'rev-' + Math.random().toString(36).substring(2, 9),
      date: `დღეს, ${now.toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })}`
    };

    setReviews(prev => [reviewWithId, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-start items-center">
      {/* Maximum-width wrapper for superb desktop look, fully responsive content on mobile */}
      <div className="w-full max-w-2xl min-h-screen flex flex-col bg-white shadow-xl shadow-slate-200/40 relative">
        <GuestMenu 
          items={items}
          onSubmitReview={handleGuestSubmitReview}
          isSimulatedMobile={false}
        />
      </div>
    </div>
  );
}
