// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title UniversityCoin
 * @dev Утилітарний токен екосистеми "Цифровий Університет".
 * Реалізує стандарт ERC-20 з розширеними можливостями управління доступом.
 */
contract UniversityCoin is ERC20, ERC20Burnable, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Подія, що емітується при нарахуванні нагороди студенту
    event TokensMinted(address indexed to, uint256 amount, string reason);

    constructor() ERC20("University Coin", "UCN") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    /**
     * @dev Емісія нових токенів.
     * @param to Адреса студента.
     * @param amount Кількість токенів (в wei).
     */
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
        emit TokensMinted(to, amount, "Academic Reward");
    }

    /**
     * @dev Зупинка операцій з токеном (Circuit Breaker).
     */
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // Hook, що викликається перед будь-яким трансфером
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20)
        whenNotPaused
    {
        super._update(from, to, value);
    }
}
