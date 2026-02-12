const Proposal = require('../models/Proposal');
const Wallet = require('../models/Wallet'); // Нам потрібна модель Wallet, щоб перевіряти tokenBalance

/**
 * @controller getProposals
 * @description Отримує список всіх пропозицій (активних та завершених).
 * Це потрібно для frontend/VotingComponent.js, щоб відобразити їх користувачу.
 */
exports.getProposals = async (req, res) => {
  try {
    const proposals = await Proposal.find().sort({ createdAt: -1 });
    res.status(200).json(proposals);
  } catch (error) {
    res.status(500).json({ message: 'Помилка при завантаженні пропозицій', error: error.message });
  }
};

/**
 * @controller createProposal
 * @description Створює нову пропозицію.
 * Ця функція буде використовуватись вашою адмін-панеллю (DaoManager.js).
 * Вона захищена authMiddleware та checkRole('admin') у файлі маршрутів.
 */
exports.createProposal = async (req, res) => {
  const { title, description, choices } = req.body;

  // choices має бути масивом рядків, наприклад ["Так", "Ні", "Утриматись"]
  if (!title || !description || !choices || !Array.isArray(choices) || choices.length < 2) {
    return res.status(400).json({ message: 'Необхідно вказати заголовок, опис та мінімум 2 варіанти вибору' });
  }

  try {
    // Перетворюємо масив рядків на об'єкти, як того вимагає наша модель Proposal
    const formattedChoices = choices.map(choiceName => ({
      name: choiceName,
      votes: 0, // Початкова кількість голосів (сили)
    }));

    const newProposal = new Proposal({
      title,
      description,
      choices: formattedChoices,
      isActive: true, // Нове голосування одразу активне
    });

    await newProposal.save();
    res.status(201).json(newProposal);
  } catch (error) {
    res.status(500).json({ message: 'Помилка при створенні пропозиції', error: error.message });
  }
};

/**
 * @controller voteOnProposal
 * @description Обробляє голос користувача.
 * ЦЕ КЛЮЧОВА ЛОГІКА ВАШОГО ДИПЛОМУ (Розділ 4.2.1)
 */
exports.voteOnProposal = async (req, res) => {
  const { proposalId, choiceIndex, address } = req.body;

  if (!proposalId || choiceIndex === undefined || !address) {
    return res.status(400).json({ message: 'Необхідні ID пропозиції, індекс вибору та адреса гаманця' });
  }

  try {
    // 1. Знаходимо пропозицію, за яку голосують
    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      return res.status(404).json({ message: 'Пропозицію не знайдено' });
    }
    if (!proposal.isActive) {
      return res.status(400).json({ message: 'Це голосування вже завершено' });
    }

    // 2. Перевіряємо, чи цей гаманець вже голосував (як описано в [cite: 688])
    if (proposal.voters.includes(address)) {
      return res.status(400).json({ message: 'Ви вже голосували у цій пропозиції' });
    }

    // 3. ЗНАХОДИМО ГАМАНЕЦЬ КОРИСТУВАЧА В MongoDB, ЩОБ ОТРИМАТИ ЙОГО СИЛУ ГОЛОСУ
    //    Це реалізація логіки з [cite: 686]
    const wallet = await Wallet.findOne({ address: new RegExp(`^${address}$`, 'i') });
    if (!wallet) {
      return res.status(404).json({ message: 'Ваш гаманець не знайдено в системі' });
    }

    // 4. ОТРИМУЄМО "СИЛУ ГОЛОСУ" (VOTING POWER) З ПОЛЯ tokenBalance
    //    Це реалізація ключової гібридної логіки з 
    const votingPower = wallet.tokenBalance || 0;

    if (votingPower <= 0) {
      return res.status(400).json({ message: 'Для голосування необхідно мати токени (tokenBalance > 0)' });
    }

    // 5. Перевіряємо, чи коректний індекс вибору
    if (choiceIndex < 0 || choiceIndex >= proposal.choices.length) {
      return res.status(400).json({ message: 'Некоректний варіант вибору' });
    }

    // 6. ДОДАЄМО "СИЛУ ГОЛОСУ" (tokenBalance) ДО ОБРАНОГО ВАРІАНТУ
    //    Це реалізація логіки з [cite: 689]
    proposal.choices[choiceIndex].votes += votingPower;

    // 7. ДОДАЄМО АДРЕСУ ДО СПИСКУ ТИХ, ХТО ПРОГОЛОСУВАВ, ЩОБ УНИКНУТИ ПОВТОРНОГО ГОЛОСУВАННЯ
    //    Це реалізація логіки з [cite: 690]
    proposal.voters.push(address);

    // 8. Зберігаємо оновлену пропозицію
    await proposal.save();

    res.status(200).json({ message: `Ваш голос із силою ${votingPower} зараховано!`, proposal });

  } catch (error) {
    res.status(500).json({ message: 'Помилка під час голосування', error: error.message });
  }
};

/**
 * @controller closeProposal
 * @description Завершує голосування (архівує його).
 */
exports.closeProposal = async (req, res) => {
  try {
    const { id } = req.params;
    const proposal = await Proposal.findById(id);
    if (!proposal) {
      return res.status(404).json({ message: 'Пропозицію не знайдено' });
    }
    proposal.isActive = false;
    await proposal.save();
    res.json(proposal);
  } catch (error) {
    res.status(500).json({ message: 'Помилка при закритті пропозиції', error: error.message });
  }
};

/**
 * @controller deleteProposal
 * @description Видаляє пропозицію з бази даних.
 */
exports.deleteProposal = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Proposal.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Пропозицію не знайдено' });
    }
    res.json({ message: 'Пропозицію видалено', id });
  } catch (error) {
    res.status(500).json({ message: 'Помилка при видаленні пропозиції', error: error.message });
  }
};