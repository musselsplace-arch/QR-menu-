export interface TranslationSet {
  name: string;
  description: string;
  tags?: string[];
}

export const itemTranslations: Record<string, {
  ru: TranslationSet;
  en?: TranslationSet;
  ka?: TranslationSet;
}> = {
  'truffle-omelette': {
    ru: {
      name: 'Фирменный трюфельный омлет',
      description: 'Ароматный и легкий завтрак. Нежно взбитые яйца в сочетании с роскошной трюфельной пастой, сливками и пармезаном. Подается с хрустящим французским багетом.',
      tags: ['Вегетарианское', 'Фирменное']
    }
  },
  'burrata-berries': {
    ru: {
      name: 'Буррата с теплыми лесными ягодами',
      description: 'Бархатистый сыр буррата с кремовой текстурой в прекрасном сочетании с теплыми карамелизированными лесными ягодами, обжаренными фисташками и свежей мятой.',
      tags: ['Вегетарианское']
    }
  },
  'baked-camembert': {
    ru: {
      name: 'Запеченный камамбер с лавандовым медом',
      description: 'Запеченный до золотистой корочки камамбер с нежным жидким центром, натуральным медом, розмарином и чесноком. Подается с хрустящим багетом.',
      tags: ['Вегетарианское', 'Горячее']
    }
  },
  'assorted-bruschetta': {
    ru: {
      name: 'Ассорти брускетт',
      description: 'Три мини-брускетты для идеального старта: с лососем и страчателлой; с прошутто и инжиром; классическая с томатами черри, песто и моцареллой.',
      tags: ['Ассорти', 'Популярное']
    }
  },
  'stracciatella-salad': {
    ru: {
      name: 'Зеленый салат со страчателлой',
      description: 'Салат из свежей зелени, хрустящих огурцов, заправленный нежными нитями страчателлы, соусом песто и легкой кислинкой лайма.',
      tags: ['Вегетарианское', 'Полезное']
    }
  },
  'shrimp-salad': {
    ru: {
      name: 'Азиатский салат с креветками',
      description: 'Нежные тигровые креветки на гриле со свежими листьями салата, спелыми томатами черри и пикантной азиатской заправкой.',
      tags: ['Морепродукты', 'Пикантное']
    }
  },
  'angus-sandwich': {
    ru: {
      name: 'Сэндвич с вырезкой Блэк Ангус',
      description: 'Хрустящий багет с начинкой из нежной вырезки ангуса, расплавленной моцареллой, свежей рукколой и пикантным штрихом дижонской горчицы.',
      tags: ['Популярное']
    }
  },
  'prosciutto-sandwich': {
    ru: {
      name: 'Классический сэндвич с прошутто',
      description: 'Итальянская классика: сыровяленое прошутто, моцарелла, ароматный соус песто и спелые томаты черри в теплом хрустящем багете.',
      tags: ['Итальянское']
    }
  },
  'salmon-sandwich': {
    ru: {
      name: 'Сэндвич с копченым лососем',
      description: 'Ломтики нежного копченого лосося с нежным творожным сыром, свежим огурцом и ароматным укропом в хрустящем багете.',
      tags: ['Морепродукты', 'Полезное']
    }
  },
  'beef-tartare': {
    ru: {
      name: 'Тартар из говядины Блэк Ангус',
      description: 'Классический тартар из лучшей вырезки ангуса с каперсами, красным луком, дижонской горчицей и желтком. Подается с теплыми тостами.',
      tags: ['Гурман', 'К вину']
    }
  },
  'salmon-sashimi': {
    ru: {
      name: 'Сашими из лосося с лаймом',
      description: 'Тончайшие ломтики подкопченного лосося премиум-класса, сбрызнутые соком свежего лайма, оливковым маслом экстра-вирджин и каперсами.',
      tags: ['Морепродукты', 'Минимализм']
    }
  },
  'baked-oysters': {
    ru: {
      name: 'Запеченные устрицы под пармезаном',
      description: 'Нежнейшие запеченные устрицы (3 шт.) под золотистой пармезановой корочкой с чесночным маслом и ароматной зеленью.',
      tags: ['Морепродукты', 'Эксклюзив']
    }
  },
  'seared-octopus': {
    ru: {
      name: 'Обжаренный осьминог',
      description: 'Нежное щупальце осьминога, обжаренное до идеальной корочки, подается с шелковистым нежным картофельным муссом.',
      tags: ['Деликатес', 'Популярное']
    }
  },
  'cheese-platter': {
    ru: {
      name: 'Европейское сырное ассорти',
      description: 'Сет из изысканных сыров: нежная моцарелла, ароматная горгонзола, выдержанные кавказские сыры. Подается с медом, орехами и сухофруктами.',
      tags: ['Ассорти', 'Вегетарианское']
    }
  },
  'meat-platter': {
    ru: {
      name: 'Премиальное мясное плато',
      description: 'Изысканная мясная тарелка: прошутто, пикантная салями, крупные зеленые оливки и хрустящие корнишоны.',
      tags: ['Ассорти', 'К вину']
    }
  },
  'san-sebastian': {
    ru: {
      name: 'Чизкейк Сан-Себастьян',
      description: 'Легендарный баскский чизкейк с нежным кремовым центром и карамельной корочкой. Подается с теплым ягодным соусом.',
      tags: ['Сладкое', 'Бестселлер']
    }
  },
  'sea-salt-brownie': {
    ru: {
      name: 'Брауни с морской солью',
      description: 'Насыщенный шоколадный брауни с фисташками и фундуком, оттененный крупными кристаллами соли Maldon для глубины вкуса.',
      tags: ['Сладкое']
    }
  },
  'espresso': {
    ru: {
      name: 'Эспрессо',
      description: 'Классический итальянский эспрессо с ровной бархатистой пенкой карамельного цвета.',
      tags: ['Горячее', 'Кофеин']
    }
  },
  'americano': {
    ru: {
      name: 'Американо',
      description: 'Классический черный кофе средней крепости, приготовленный на основе двойного эспрессо и горячей воды.',
      tags: ['Горячее', 'Кофеин']
    }
  },
  'cappuccino-small': {
    ru: {
      name: 'Капучино (маленький)',
      description: 'Нежный кофейно-молочный напиток с шелковистой глянцевой молочной пенкой.',
      tags: ['Горячее', 'С молоком']
    }
  },
  'cappuccino-large': {
    ru: {
      name: 'Капучино (большой)',
      description: 'Большая порция классического капучино на основе двойного эспрессо и воздушного молока.',
      tags: ['Горячее', 'С молоком']
    }
  },
  'flat-white': {
    ru: {
      name: 'Флэт Уайт',
      description: 'Насыщенный кофейный вкус двойного эспрессо с тонким бархатным слоем горячего молока.',
      tags: ['Горячее', 'Крепкий']
    }
  },
  'latte': {
    ru: {
      name: 'Латте',
      description: 'Воздушный кофейный напиток с нежной кофейно-молочной пеной и мягким сливочным вкусом.',
      tags: ['Горячее', 'Мягкий']
    }
  },
  'iced-americano': {
    ru: {
      name: 'Айс Американо',
      description: 'Освежающий эспрессо с добавлением колотого льда и очищенной воды.',
      tags: ['Холодное', 'Кофеин']
    }
  },
  'iced-latte': {
    ru: {
      name: 'Айс Латте',
      description: 'Прохладный кофейно-молочный микс с добавлением кубиков льда и нежной глянцевой пенки.',
      tags: ['Холодное', 'Мягкий']
    }
  },
  'milk': {
    ru: {
      name: 'Молоко',
      description: 'Порция цельного или альтернативного молока по вашему предпочтению.',
      tags: ['Добавка']
    }
  },
  // WINES
  'chiche-tsinandali': {
    ru: {
      name: 'Chiche • Цинандали',
      description: 'Изысканное белое сухое вино из микрозоны Цинандали. Отличается элегантными тонами цитрусов и белых цветов.',
      tags: ['Белое классическое', '2024']
    }
  },
  'damilie-kisi': {
    ru: {
      name: 'Damilie • Киси Мадрасаули',
      description: 'Выразительное сухое белое вино из винограда Киси. Обладает богатым телом и ароматами спелых желтых фруктов.',
      tags: ['Белое классическое', '2025']
    }
  },
  'first-winery-khikhvi': {
    ru: {
      name: 'First Winery • Хихви Классик',
      description: 'Редкое сухое вино из винограда Хихви, приготовленное по классическому методу. Фруктовые оттенки и свежая текстура.',
      tags: ['Белое классическое', 'Классика']
    }
  },
  'first-winery-kisi-classic': {
    ru: {
      name: 'First Winery • Киси Классик',
      description: 'Элегантное легкое вино из винограда сорта Киси с нежным деликатным ароматом персиков и полевых цветов.',
      tags: ['Белое классическое', 'Премиум']
    }
  },
  'me-wine-chardonnay': {
    ru: {
      name: 'Me&Wine • Шардоне Совиньон Блан',
      description: 'Премиальный купаж Шардоне и Совиньон Блан. Изумительный баланс тропических фруктов и спелого яблока.',
      tags: ['Белое классическое', '2022']
    }
  },
  'chiora-tsolikouri': {
    ru: {
      name: 'Chiora • Цоликоури Лечхуми',
      description: 'Вино из уникального терруара Лечхуми. Яркая свежесть, бодрящая цитрусовая кислотность.',
      tags: ['Белое классическое', '2023']
    }
  },
  'damilie-goruli-mtsvane': {
    ru: {
      name: 'Damilie • Горули Мцване - Чинури',
      description: 'Оранжевое (янтарное) вино, выдержанное в квеври. Оттенки сухофруктов, грецкого ореха и восточных пряностей.',
      tags: ['Квеври и Янтарное', '2023']
    }
  },
  'first-winery-kisi-qvevri': {
    ru: {
      name: 'First Winery • Киси Квеври',
      description: 'Традиционное янтарное вино из квеври. Насыщенные танины, глубокие тона кураги, инжира и меда.',
      tags: ['Квеври и Янтарное', '2023']
    }
  }
};

export const categoryTranslations: Record<string, {
  ka: string;
  en: string;
  ru: string;
}> = {
  'breakfast-starters': {
    ka: 'საუზმე და სტარტერები',
    en: 'Breakfast & Starters',
    ru: 'Завтраки и стартеры'
  },
  'salads': {
    ka: 'სალათები',
    en: 'Salads',
    ru: 'Салаты'
  },
  'sandwiches': {
    ka: 'სენდვიჩები',
    en: 'Sandwiches',
    ru: 'Сэндвичи'
  },
  'wine-bites': {
    ka: 'ღვინის დასაყოლებელი',
    en: 'Wine Bites & Platters',
    ru: 'Закуски к вину'
  },
  'desserts': {
    ka: 'დესერტები',
    en: 'Desserts',
    ru: 'Десерты'
  },
  'coffee': {
    ka: 'ყავა & სასმელები',
    en: 'Coffee & Drinks',
    ru: 'Кофе и Напитки'
  },
  'wine': {
    ka: 'ღვინის ასორტიმენტი',
    en: 'Wine Collection',
    ru: 'Винная карта'
  }
};

export const uiTranslations = {
  ka: {
    welcome: 'მოგესალმებით',
    barDisclaimer: 'მენიუს ნახვა • შეუკვეთეთ ბართან',
    barDisclaimerDesc: 'გთხოვთ, შეარჩიოთ სასურველი კერძები და სასმელები და შეუკვეთოთ ბართან.',
    menu: 'მენიუ',
    favorites: 'რჩეულები',
    feedback: 'შეფასება',
    searchPlaceholder: 'მოძებნეთ კერძი ან აღწერა...',
    allDishes: 'ყველა კერძი',
    allDiets: 'ყველა დიეტა',
    shownItems: 'ნაჩვენებია {count} პოზიცია',
    clearFilters: 'ფილტრების გასუფთავება',
    emptySearchTitle: 'კერძები ვერ მოიძებნა',
    emptySearchDesc: 'სცადეთ სხვა საძიებო სიტყვა ან შეცვალეთ არჩეული კატეგორია.',
    favoritesTitle: 'თქვენი შერჩეული კერძები',
    favoritesDesc: 'დაუმატეთ გული თქვენს სასურველ პოზიციებს მენიუში, რათა სწრაფად მიმართოთ მათ შეკვეთისას ან აჩვენოთ მიმტანს ბართან.',
    emptyFavoritesTitle: 'რჩეულების სია ცარიელია',
    emptyFavoritesDesc: 'მონიშნეთ თქვენთვის სასურველი გემოები მენიუში გულის სიმბოლოთი',
    backToMenu: 'მენიუში დაბრუნება',
    orderTotal: 'შერჩეული პოზიციები ({count}):',
    orderInstructions: 'შეკვეთისთვის მიმართეთ ბარმენს/მიმტანს ბართან და უკარნახეთ ეს კერძები.',
    feedbackTitle: 'გაგვიზიარეთ თქვენი აზრი',
    feedbackDesc: 'თქვენი შეფასება გვეხმარება გავაუმჯობესოთ ჩვენი სერვისი',
    feedbackSuccessTitle: 'დიდი მადლობა შეფასებისთვის!',
    feedbackSuccessDesc: 'თქვენი სათუთი შეფასება შენახულია წარმატებით!',
    yourName: 'თქვენი სახელი',
    yourNamePlaceholder: 'მაგ: გიორგი ბერიძე',
    commentLabel: 'კომენტარი / შთაბეჭდილება',
    commentPlaceholder: 'მოგვიყევით თქვენი გამოცდილებისა და გარემოს შესახებ...',
    sendFeedback: 'შეფასების გაგზავნა',
    ratingsPlaceholder: 'დააჭირეთ ვარსკვლავს',
    price: 'ფასი',
    glass: 'ჭიქა',
    bottle: 'ბოთლი',
    descriptionLabel: 'აღწერა',
    addToFavorites: 'რჩეულებში დამატება',
    removeFromFavorites: 'რჩეულებიდან ამოშლა',
    downloadQR: 'QR კოდის ჩამოტვირთვა',
    printQR: 'QR ბეჭდვა',
    qrButtonTooltip: 'მენიუს QR კოდების ამობეჭდვა მაგიდებისთვის',
    selectLanguage: 'ენა / Language / Язык',
    qrTitle: 'ციფრული მენიუს QR კოდი',
    qrInstructions: 'დაასკანერეთ კამერით მენიუს სანახავად',
    qrDesc: 'დაბეჭდეთ ეს კოდი და განათავსეთ მაგიდებზე, რათა სტუმრებმა მარტივად გახსნან მენიუ ტელეფონით.'
  },
  en: {
    welcome: 'Welcome',
    barDisclaimer: 'Browse Menu • Order at the Bar',
    barDisclaimerDesc: 'Please choose your favorite food or drinks and order directly at the bar.',
    menu: 'Menu',
    favorites: 'Favorites',
    feedback: 'Feedback',
    searchPlaceholder: 'Search dishes or description...',
    allDishes: 'All Dishes',
    allDiets: 'All Diets',
    shownItems: 'Showing {count} items',
    clearFilters: 'Clear filters',
    emptySearchTitle: 'Dishes not found',
    emptySearchDesc: 'Try another search query or change category filter.',
    favoritesTitle: 'Your Favorite Dishes',
    favoritesDesc: 'Add a heart to your preferred dishes to easily find them or show them at the bar.',
    emptyFavoritesTitle: 'Your list is empty',
    emptyFavoritesDesc: 'Mark your favorite dishes in the menu with the heart symbol.',
    backToMenu: 'Back to Menu',
    orderTotal: 'Selected positions ({count}):',
    orderInstructions: 'To order, please proceed to the bar and dictate these items.',
    feedbackTitle: 'Share your thoughts',
    feedbackDesc: 'Your feedback helps us improve our service.',
    feedbackSuccessTitle: 'Thank you for your feedback!',
    feedbackSuccessDesc: 'Your opinion has been successfully saved!',
    yourName: 'Your Name',
    yourNamePlaceholder: 'e.g. John Doe',
    commentLabel: 'Comment / Review',
    commentPlaceholder: 'Tell us about your experience and the cozy atmosphere...',
    sendFeedback: 'Submit Review',
    ratingsPlaceholder: 'Tap a star to rate',
    price: 'Price',
    glass: 'Glass',
    bottle: 'Bottle',
    descriptionLabel: 'Description',
    addToFavorites: 'Add to Favorites',
    removeFromFavorites: 'Remove from Favorites',
    downloadQR: 'Download QR Code',
    printQR: 'Print QR Code',
    qrButtonTooltip: 'Print table QR codes for physical tables',
    selectLanguage: 'Language',
    qrTitle: 'Digital Menu QR Code',
    qrInstructions: 'Scan with camera to view the menu',
    qrDesc: 'Print this code and place it on your tables so guests can open the menu easily on their phones.'
  },
  ru: {
    welcome: 'Добро пожаловать',
    barDisclaimer: 'Просмотр меню • Заказ у стойки',
    barDisclaimerDesc: 'Пожалуйста, выберите понравившиеся блюда или напитки и сделайте заказ у стойки бара.',
    menu: 'Меню',
    favorites: 'Избранное',
    feedback: 'Отзывы',
    searchPlaceholder: 'Поиск блюд или описания...',
    allDishes: 'Все блюда',
    allDiets: 'Все диеты',
    shownItems: 'Показано {count} позиций',
    clearFilters: 'Очистить фильтры',
    emptySearchTitle: 'Блюда не найдены',
    emptySearchDesc: 'Попробуйте изменить поисковый запрос или категорию.',
    favoritesTitle: 'Ваши избранные блюда',
    favoritesDesc: 'Отмечайте понравившиеся блюда сердечком, чтобы быстро найти их или показать при заказе у барной стойки.',
    emptyFavoritesTitle: 'Список избранного пуст',
    emptyFavoritesDesc: 'Отметьте ваши любимые блюда в меню значком сердечка.',
    backToMenu: 'Вернуться в меню',
    orderTotal: 'Выбранные позиции ({count}):',
    orderInstructions: 'Для заказа обратитесь к сотруднику у барной стойки и продиктуйте эти блюда.',
    feedbackTitle: 'Поделитесь мнением',
    feedbackDesc: 'Ваш отзыв помогает нам становиться лучше.',
    feedbackSuccessTitle: 'Спасибо за ваш отзыв!',
    feedbackSuccessDesc: 'Ваш отзыв был успешно сохранен!',
    yourName: 'Ваше имя',
    yourNamePlaceholder: 'Например: Александр',
    commentLabel: 'Комментарий / впечатление',
    commentPlaceholder: 'Расскажите о ваших впечатлениях, блюдах и атмосфере...',
    sendFeedback: 'Отправить отзыв',
    ratingsPlaceholder: 'Нажмите на звезду для оценки',
    price: 'Цена',
    glass: 'Бокал',
    bottle: 'Бутылка',
    descriptionLabel: 'Описание',
    addToFavorites: 'Добавить в избранное',
    removeFromFavorites: 'Убрать из избранного',
    downloadQR: 'Скачать QR-код',
    printQR: 'Печать QR-кода',
    qrButtonTooltip: 'Распечатать QR-код для физических столов',
    selectLanguage: 'Выбрать язык',
    qrTitle: 'QR-код Цифрового Меню',
    qrInstructions: 'Сканируйте камерой для просмотра меню',
    qrDesc: 'Распечатайте этот код и разместите его на столах, чтобы гости могли легко открыть меню на своем телефоне.'
  }
};

export function getTranslatedItem(item: any, lang: 'ka' | 'en' | 'ru') {
  const trans = itemTranslations[item.id];
  if (lang === 'ka') {
    return {
      ...item,
      name: item.nameGeo,
      description: item.description,
      tags: item.tags
    };
  } else if (lang === 'en') {
    return {
      ...item,
      name: item.nameEng,
      description: trans?.en?.description || item.description, // some can fallback
      tags: trans?.en?.tags || item.tags
    };
  } else {
    // Russian
    return {
      ...item,
      name: trans?.ru?.name || item.nameEng,
      description: trans?.ru?.description || trans?.en?.description || item.description,
      tags: trans?.ru?.tags || trans?.en?.tags || item.tags
    };
  }
}
