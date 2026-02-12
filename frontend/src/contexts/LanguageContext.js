import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
    en: {
        // Navigation & General
        systemOnline: 'SYSTEM ONLINE',
        connectWallet: 'CONNECT WALLET',
        disconnect: 'DISCONNECT',
        profile: 'PROFILE',

        // Tabs
        tasks: 'TASKS',
        voting: 'VOTING',
        leaderboard: 'LEADERBOARD',

        // Battle Pass
        battlePass: 'BATTLE PASS',
        level: 'LEVEL',
        balance: 'BALANCE',
        xp: 'XP',

        // Tasks
        allTasks: 'ALL TASKS',
        filters: 'FILTERS',
        recommended: 'Recommended',
        highestXP: 'Highest XP',
        lowestXP: 'Lowest XP',
        tagsDatabase: 'TAGS DATABASE',
        xpRange: 'XP RANGE',
        selectTags: 'Select Tags',
        xpPoints: 'XP POINTS',
        completed: 'COMPLETED',
        startTask: 'START TASK',
        noTasksFound: 'NO TASKS FOUND',

        // Voting
        daoVoting: 'DAO VOTING CONSOLE',
        decentralizedGovernance: 'DECENTRALIZED GOVERNANCE',
        yourVotingPower: 'YOUR VOTING POWER',
        noActiveProposals: 'NO ACTIVE PROPOSALS',
        active: 'ACTIVE',
        closed: 'CLOSED',
        totalVotes: 'Total Votes',
        verifyOnChain: 'VERIFY ON-CHAIN',
        connectWalletToVote: 'Connect wallet to vote',
        needTokensToVote: 'You need tokens to vote',
        alreadyVoted: 'You have already voted on this proposal',
        voteCastSuccess: 'Your vote with power {power} has been cast!',
        voteError: 'Voting error',

        // Leaderboard
        topAgents: 'TOP AGENTS',
        noAgentsFound: 'NO AGENTS FOUND',
        recruits: 'RECRUITS',

        // Profile
        agentProfile: 'AGENT PROFILE',
        identity: 'IDENTITY',
        network: 'NETWORK',
        archive: 'ARCHIVE',
        codename: 'CODENAME (USERNAME)',
        quantumTokens: 'QUANTUM TOKENS',
        edit: 'EDIT',
        saveChanges: 'SAVE CHANGES',
        recruitmentLink: 'YOUR RECRUITMENT LINK',
        clickToCopy: 'CLICK TO COPY',
        linkCopied: 'LINK COPIED TO CLIPBOARD',

        // Diplomas
        digitalCredentials: 'DIGITAL CREDENTIALS',
        university: 'UNIVERSITY',
        specialty: 'SPECIALTY',
        graduationYear: 'GRADUATION YEAR',
        averageGrade: 'AVERAGE GRADE',
        honors: 'HONORS',
        issuedAt: 'ISSUED AT',
        blockchainTransaction: 'BLOCKCHAIN TRANSACTION',
        credentialDetails: 'CREDENTIAL DETAILS',
        sbtNote: 'This credential is a Soulbound Token (SBT). It is permanently bound to your wallet address and cannot be transferred.',
        close: 'CLOSE',
        noCredentialsFound: 'NO CREDENTIALS FOUND',
        scanningArchives: 'SCANNING ARCHIVES...',
        internalBalance: '(Internal Balance)',
        nicknamePreview: 'NICKNAME PREVIEW',
        universeShop: 'UNIVERSE SHOP',
        avatarFrames: 'AVATAR FRAMES',
        nickEffects: 'NICKNAME EFFECTS',
        profileBackgrounds: 'PROFILE BACKGROUNDS',
        insufficientTokens: 'Not enough tokens!',
        confirmPurchase: 'Buy "{name}" for {price} tokens?',
        purchaseSuccess: 'Successfully purchased: {name}',
        purchaseError: 'Purchase error',
        platformTagline: 'Gamified Motivation Platform',

        // Shop
        shop: 'SHOP',
        buy: 'BUY',
        equip: 'EQUIP',
        unequip: 'UNEQUIP',
        inventory: 'INVENTORY',
        price: 'PRICE',
        purchased: 'PURCHASED',
        equipped: 'EQUIPPED',
        noItemsInShop: 'NO ITEMS AVAILABLE',

        // Inventory
        myCollection: 'MY COLLECTION',
        emptyInventory: 'Your inventory is empty. Visit the Shop!',

        // Student Profile
        studentProfile: 'STUDENT PROFILE',
        noGroup: 'No group',
        battlePassLevel: 'BATTLE PASS LEVEL',
        completedTasksCount: 'Completed Tasks',
        diplomasCount: 'Diplomas',
        studentNoTasks: 'Student has not completed any tasks yet',
        studentNoDiplomas: 'Student has no diplomas',
        loadingData: 'Loading data...',
        failedToLoadProfile: 'Failed to load profile',
        failedToLoadData: 'Failed to load data',

        // SkillTree
        missionControl: 'MISSION CONTROL',
        selectPath: 'Select a learning path to begin your training.',
        additionalMissions: 'ADDITIONAL MISSIONS',
        missionLogicRoute: 'Mission Logic Route',
        progress: 'PROGRESS',
        missionReport: 'Mission Report',
        secretCode: 'Secret Code',
        openMissionLink: 'OPEN MISSION LINK',
        abort: 'ABORT',
        submitReport: 'SUBMIT REPORT',
        completeMission: 'COMPLETE MISSION',
        noDescription: 'No description provided.',
        noCoursesAssigned: 'No courses assigned to group',
        searchCourses: 'SEARCH COURSES...',
        searchTasks: 'SEARCH TASKS...',
        hideCompleted: 'Hide Completed',
        noActiveMissions: 'NO ACTIVE MISSIONS FOUND',
        noCoursesFound: 'NO COURSES FOUND',
    },
    ua: {
        // Navigation & General
        systemOnline: 'СИСТЕМА ОНЛАЙН',
        connectWallet: 'ПІДКЛЮЧИТИ ГАМАНЕЦЬ',
        disconnect: 'ВІДКЛЮЧИТИ',
        profile: 'ПРОФІЛЬ',

        // Tabs
        tasks: 'ЗАВДАННЯ',
        voting: 'ГОЛОСУВАННЯ',
        leaderboard: 'РЕЙТИНГ',

        // Battle Pass
        battlePass: 'БОЙОВИЙ ПРОПУСК',
        level: 'РІВЕНЬ',
        balance: 'БАЛАНС',
        xp: 'ДОСВІД',

        // Tasks
        allTasks: 'ВСІ ЗАВДАННЯ',
        filters: 'ФІЛЬТРИ',
        recommended: 'Рекомендовані',
        highestXP: 'Найбільше XP',
        lowestXP: 'Найменше XP',
        tagsDatabase: 'БАЗА ТЕГІВ',
        xpRange: 'ДІАПАЗОН XP',
        selectTags: 'Оберіть теги',
        xpPoints: 'ОЧКИ XP',
        completed: 'ВИКОНАНО',
        startTask: 'ПОЧАТИ',
        noTasksFound: 'ЗАВДАНЬ НЕ ЗНАЙДЕНО',

        // Voting
        daoVoting: 'КОНСОЛЬ ГОЛОСУВАННЯ DAO',
        decentralizedGovernance: 'ДЕЦЕНТРАЛІЗОВАНЕ УПРАВЛІННЯ',
        yourVotingPower: 'ВАША СИЛА ГОЛОСУ',
        noActiveProposals: 'НЕМАЄ АКТИВНИХ ПРОПОЗИЦІЙ',
        active: 'АКТИВНО',
        closed: 'ЗАКРИТО',
        totalVotes: 'Всього голосів',
        verifyOnChain: 'ПЕРЕВІРИТИ В БЛОКЧЕЙНІ',
        connectWalletToVote: 'Підключіть гаманець для голосування',
        needTokensToVote: 'Для голосування необхідно мати токени',
        alreadyVoted: 'Ви вже голосували у цій пропозиції',
        voteCastSuccess: 'Ваш голос із силою {power} зараховано!',
        voteError: 'Помилка голосування',

        // Leaderboard
        topAgents: 'ТОП АГЕНТИ',
        noAgentsFound: 'АГЕНТІВ НЕ ЗНАЙДЕНО',
        recruits: 'РЕКРУТИ',

        // Profile
        agentProfile: 'ПРОФІЛЬ АГЕНТА',
        identity: 'ОСОБИСТІСТЬ',
        network: 'МЕРЕЖА',
        archive: 'АРХІВ',
        codename: 'КОДОВЕ ІМ\'Я (НІКНЕЙМ)',
        quantumTokens: 'КВАНТОВІ ТОКЕНИ',
        edit: 'ЗМІНИТИ',
        saveChanges: 'ЗБЕРЕГТИ ЗМІНИ',
        recruitmentLink: 'ВАШЕ ПОСИЛАННЯ ДЛЯ ЗАПРОШЕНЬ',
        clickToCopy: 'НАТИСНІТЬ ДЛЯ КОПІЮВАННЯ',
        linkCopied: 'ПОСИЛАННЯ СКОПІЙОВАНО',

        // Diplomas
        digitalCredentials: 'ЦИФРОВІ СЕРТИФІКАТИ',
        university: 'УНІВЕРСИТЕТ',
        specialty: 'СПЕЦІАЛЬНІСТЬ',
        graduationYear: 'РІК ВИПУСКУ',
        averageGrade: 'СЕРЕДНІЙ БАЛ',
        honors: 'ВІДЗНАКА',
        issuedAt: 'ДАТА ВИДАЧІ',
        blockchainTransaction: 'ТРАНЗАКЦІЯ В БЛОКЧЕЙНІ',
        credentialDetails: 'ДЕТАЛІ СЕРТИФІКАТА',
        sbtNote: 'Цей сертифікат є Soulbound Token (SBT). Він назавжди прив\'язаний до вашого гаманця і не може бути переданий.',
        close: 'ЗАКРИТИ',
        noCredentialsFound: 'СЕРТИФІКАТІВ НЕ ЗНАЙДЕНО',
        scanningArchives: 'СКАНУВАННЯ АРХІВІВ...',
        internalBalance: '(Внутрішній Баланс)',
        nicknamePreview: 'ПЕРЕГЛЯД НІКНЕЙМУ',
        universeShop: 'МАГАЗИН UNIVERSE',
        avatarFrames: 'РАМКИ АВАТАРА',
        nickEffects: 'ЕФЕКТИ НІКНЕЙМУ',
        profileBackgrounds: 'ФОНИ ПРОФІЛЮ',
        insufficientTokens: 'Недостатньо токенів!',
        confirmPurchase: 'Купити "{name}" за {price} токенів?',
        purchaseSuccess: 'Успішно куплено: {name}',
        purchaseError: 'Помилка покупки',
        platformTagline: 'Гейміфікована Платформа Мотивації',

        // Shop
        shop: 'МАГАЗИН',
        buy: 'КУПИТИ',
        equip: 'ОДЯГНУТИ',
        unequip: 'ЗНЯТИ',
        inventory: 'ІНВЕНТАР',
        price: 'ЦІНА',
        purchased: 'КУПЛЕНО',
        equipped: 'ОДЯГНЕНО',
        noItemsInShop: 'ТОВАРІВ НЕМАЄ',

        // Inventory
        myCollection: 'МОЯ КОЛЕКЦІЯ',
        emptyInventory: 'Ваш інвентар порожній. Відвідайте Магазин!',

        // Student Profile
        studentProfile: 'ПРОФАЙЛ СТУДЕНТА',
        noGroup: 'Без групи',
        battlePassLevel: 'РІВЕНЬ BATTLE PASS',
        completedTasksCount: 'Виконані завдання',
        diplomasCount: 'Сертифікати',
        studentNoTasks: 'Студент ще не виконав жодного завдання',
        studentNoDiplomas: 'У студента немає сертифікатів',
        loadingData: 'Завантаження даних...',
        failedToLoadProfile: 'Не вдалося завантажити профіль',
        failedToLoadData: 'Не вдалося завантажити дані',

        // SkillTree
        missionControl: 'ЦЕНТР УПРАВЛІННЯ',
        selectPath: 'Оберіть шлях навчання, щоб розпочати тренування.',
        additionalMissions: 'ДОДАТКОВІ МІСІЇ',
        missionLogicRoute: 'Логічний Маршрут Місії',
        progress: 'ПРОГРЕС',
        missionReport: 'Звіт про місію',
        secretCode: 'Секретний код',
        openMissionLink: 'ВІДКРИТИ ПОСИЛАННЯ МІСІЇ',
        abort: 'СКАСУВАТИ',
        submitReport: 'НАДІСЛАТИ ЗВІТ',
        completeMission: 'ЗАВЕРШИТИ МІСІЮ',
        noDescription: 'Опис відсутній.',
        noCoursesAssigned: 'Для групи курси не призначено',
        searchCourses: 'ПОШУК КУРСІВ...',
        searchTasks: 'ПОШУК ЗАВДАНЬ...',
        hideCompleted: 'Приховати виконані',
        noActiveMissions: 'АКТИВНИХ МІСІЙ НЕ ЗНАЙДЕНО',
        noCoursesFound: 'КУРСІВ НЕ ЗНАЙДЕНО',
    }
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('language') || 'ua';
    });

    useEffect(() => {
        localStorage.setItem('language', language);
    }, [language]);

    const t = (key) => {
        return translations[language][key] || key;
    };

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'en' ? 'ua' : 'en');
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, toggleLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }
    return context;
};
