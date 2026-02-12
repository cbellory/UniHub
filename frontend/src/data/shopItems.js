const shopItems = [
    // --- AVATAR FRAMES ---
    {
        id: 'frame-neon-blue',
        type: 'frame',
        name: 'Неоновий Синій',
        price: 100,
        description: 'Сяюча синя рамка для кібер-мандрівників.',
        cssClass: 'frame-neon-blue'
    },
    {
        id: 'frame-golden',
        type: 'frame',
        name: 'Золота Еліта',
        price: 500,
        description: 'Золота рамка для найкращих студентів.',
        cssClass: 'frame-golden'
    },
    {
        id: 'frame-cyber',
        type: 'frame',
        name: 'Кібер Глітч',
        price: 300,
        description: 'Глітч-ефект для тих, хто зламує систему.',
        cssClass: 'frame-cyber'
    },
    // NEW FRAMES
    { id: 'frame-plasma', type: 'frame', name: 'Плазмовий Вибух', price: 350, description: 'Енергія чистого плазмового заряду.', cssClass: 'frame-plasma' },
    { id: 'frame-nature', type: 'frame', name: 'Вартий Природи', price: 250, description: 'Для захисників цифрової природи.', cssClass: 'frame-nature' },
    { id: 'frame-ice', type: 'frame', name: 'Обмороження', price: 300, description: 'Холод космосу в одній рамці.', cssClass: 'frame-ice' },
    { id: 'frame-magma', type: 'frame', name: 'Ядро Магми', price: 450, description: 'Гаряча лава з ядра планети.', cssClass: 'frame-magma' },
    { id: 'frame-retro', type: 'frame', name: 'Ретро Піксель', price: 200, description: 'Ностальгія за 8-бітними іграми.', cssClass: 'frame-retro' },
    { id: 'frame-quantum', type: 'frame', name: 'Квантовий Спін', price: 600, description: 'Заплутані квантові стани.', cssClass: 'frame-quantum' },
    { id: 'frame-steampunk', type: 'frame', name: 'Стімпанк Механізм', price: 400, description: 'Механізми вікторіанської епохи.', cssClass: 'frame-steampunk' },
    { id: 'frame-void', type: 'frame', name: 'Порожнеча', price: 1000, description: 'Абсолютна темрява.', cssClass: 'frame-void' },
    { id: 'frame-holofoil', type: 'frame', name: 'Голографія', price: 500, description: 'Рідкісна голографічна картка.', cssClass: 'frame-holofoil' },
    { id: 'frame-crystal', type: 'frame', name: 'Кристал', price: 400, description: 'Уламки найчистішого кристалу.', cssClass: 'frame-crystal' },

    // --- NICKNAME EFFECTS ---
    {
        id: 'nick-fire',
        type: 'nick',
        name: 'Вогняний Градієнт',
        price: 200,
        description: 'Ваше ім\'я палатиме вогнем знань.',
        cssClass: 'nick-fire'
    },
    {
        id: 'nick-toxic',
        type: 'nick',
        name: 'Токсичний Зелений',
        price: 150,
        description: 'Отруйно-зелене світіння.',
        cssClass: 'nick-toxic'
    },
    {
        id: 'nick-platinum',
        type: 'nick',
        name: 'Платиновий Блиск',
        price: 600,
        description: 'Платинова анімація для еліти.',
        cssClass: 'nick-platinum'
    },
    // NEW NICKS
    { id: 'nick-rainbow', type: 'nick', name: 'Веселка', price: 500, description: 'Всі кольори спектру.', cssClass: 'nick-rainbow' },
    { id: 'nick-ice', type: 'nick', name: 'Крижаний Подих', price: 250, description: 'Холодний подих півночі.', cssClass: 'nick-ice' },
    { id: 'nick-thunder', type: 'nick', name: 'Грозовий Розряд', price: 300, description: 'Електрична іскра.', cssClass: 'nick-thunder' },
    { id: 'nick-ghost', type: 'nick', name: 'Привид', price: 400, description: 'Напівпрозорий дух.', cssClass: 'nick-ghost' },
    { id: 'nick-matrix', type: 'nick', name: 'Код Матриці', price: 200, description: 'Зелений водоспад символів.', cssClass: 'nick-matrix' },
    { id: 'nick-neon-pink', type: 'nick', name: 'Неоновий Рожевий', price: 150, description: 'Яскравий рожевий неон.', cssClass: 'nick-neon-pink' },
    { id: 'nick-camouflage', type: 'nick', name: 'Камуфляж', price: 100, description: 'Зливається з оточенням.', cssClass: 'nick-camouflage' },
    { id: 'nick-metal', type: 'nick', name: 'Хеві Метал', price: 350, description: 'Важкий металевий стиль.', cssClass: 'nick-metal' },
    { id: 'nick-galaxy', type: 'nick', name: 'Галактика', price: 600, description: 'Весь всесвіт у вашому імені.', cssClass: 'nick-galaxy' },
    { id: 'nick-pixel', type: 'nick', name: 'Піксель', price: 150, description: 'Ретро піксельний шрифт.', cssClass: 'nick-pixel' },


    // --- PROFILE BACKGROUNDS ---
    {
        id: 'bg-matrix',
        type: 'bg',
        name: 'Матриця',
        price: 400,
        description: 'Класичний дощ із коду.',
        cssClass: 'bg-matrix'
    },
    {
        id: 'bg-nebula',
        type: 'bg',
        name: 'Космічна Туманність',
        price: 350,
        description: 'Космічні простори у вашому профілі.',
        cssClass: 'bg-nebula'
    },
    {
        id: 'bg-tech',
        type: 'bg',
        name: 'Абстрактний Тех',
        price: 250,
        description: 'Абстрактний технологічний візерунок.',
        cssClass: 'bg-tech'
    },
    // NEW BACKGROUNDS
    { id: 'bg-grid', type: 'bg', name: 'Кібер Сітка', price: 150, description: 'Кібернетична розмітка.', cssClass: 'bg-grid' },
    { id: 'bg-stars', type: 'bg', name: 'Зоряне Поле', price: 400, description: 'Безкрає поле зірок.', cssClass: 'bg-stars' },
    { id: 'bg-sunset', type: 'bg', name: 'Vaporwave Захід', price: 300, description: 'Захід сонця в стилі Vaporwave.', cssClass: 'bg-sunset' },
    { id: 'bg-waves', type: 'bg', name: 'Цифрові Хвилі', price: 250, description: 'Потік цифрових хвиль.', cssClass: 'bg-waves' },
    { id: 'bg-hexagons', type: 'bg', name: 'Вулик', price: 350, description: 'Шестикутна структура.', cssClass: 'bg-hexagons' },
    { id: 'bg-circuit', type: 'bg', name: 'Друкована Плата', price: 200, description: 'Схема електроніки.', cssClass: 'bg-circuit' },
    { id: 'bg-stripes', type: 'bg', name: 'Смуги Попередження', price: 100, description: 'Індустріальні смуги.', cssClass: 'bg-stripes' },
    { id: 'bg-dots', type: 'bg', name: 'Горошок', price: 100, description: 'Точковий патерн.', cssClass: 'bg-dots' },
    { id: 'bg-radial', type: 'bg', name: 'Радіальний Імпульс', price: 250, description: 'Енергетичний імпульс.', cssClass: 'bg-radial' },
    { id: 'bg-zigzag', type: 'bg', name: 'Зигзаг', price: 300, description: 'Динамічний зигзаг.', cssClass: 'bg-zigzag' },

    // --- UKRAINE COLLECTION ---
    { id: 'frame-flag-ua', type: 'frame', name: 'Серце України', price: 500, description: 'Патріотична рамка у кольорах прапора.', cssClass: 'frame-flag-ua' },
    { id: 'nick-flag-ua', type: 'nick', name: 'Слава Україні', price: 300, description: 'Ім\'я у кольорах свободи.', cssClass: 'nick-flag-ua' },
    { id: 'bg-flag-ua', type: 'bg', name: 'Вільне Небо', price: 400, description: 'Атмосфера українського неба та полів.', cssClass: 'bg-flag-ua' }
];

export { shopItems };
