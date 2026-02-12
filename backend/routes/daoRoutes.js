const express = require('express');
const router = express.Router();
const daoController = require('../controllers/daoController');
const { authMiddleware, checkRole } = require('../middleware/authMiddleware');

// --- Публичные маршруты (для Frontend) ---

/**
 * @route   GET /api/dao/proposals
 * @desc    Получить список всех голосований
 * @access  Public
 * @uses    daoController.getProposals
 * @used_by VotingComponent.js
 */
router.get('/proposals', daoController.getProposals);

/**
 * @route   POST /api/dao/vote
 * @desc    Принять голос пользователя
 * @access  Public (проверка на tokenBalance происходит в контроллере)
 * @uses    daoController.voteOnProposal
 * @used_by VotingComponent.js
 */
router.post('/vote', daoController.voteOnProposal);


// --- Административные маршруты (для Admin Panel) ---

/**
 * @route   POST /api/dao/proposals
 * @desc    Создать новое голосование
 * @access  Private (Admin / Superadmin)
 * @uses    authMiddleware, checkRole, daoController.createProposal
 * @used_by DaoManager.js (в админ-панели)
 */
router.post(
  '/proposals',
  authMiddleware, // 1. Проверяем, что админ авторизован (валидный JWT)
  checkRole(['superadmin', 'admin']), // 2. Проверяем, что роль достаточна
  daoController.createProposal // 3. Только после этого даем доступ к созданию
);

// 4. Завершити голосування (зробити неактивним)
router.put('/proposals/:id/close', authMiddleware, checkRole(['superadmin', 'admin']), daoController.closeProposal);

// 5. Видалити голосування повністю
router.delete('/proposals/:id', authMiddleware, checkRole(['superadmin', 'admin']), daoController.deleteProposal);


module.exports = router;