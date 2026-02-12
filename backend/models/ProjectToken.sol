// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Імпорт необхідних компонентів з бібліотеки OpenZeppelin
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ProjectToken
 * @dev Реалізація токена стандарту BEP-20 (ERC-20) для гейміфікованої
 * платформи. Має функцію мінтінгу (випуску),
 * що контролюється Власником (адміністрацією).
 */
contract ProjectToken is ERC20, Ownable(msg.sender) {

    /**
     * @dev Конструктор, що ініціалізує токен при розгортанні.
     * name_ - Повна назва токена (напр., "Project Token")
     * symbol_ - Символ/тікер токена (напр., "PRJ")
     */
    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {
        // Власник контракту (Owner) автоматично встановлюється
        // на адресу, що розгортає контракт, завдяки Ownable(msg.sender)
    }

    /**
     * @dev Функція випуску (мінтінгу) нових токенів.
     * Доступна ТІЛЬКИ власнику контракту (адміністрації проекту).
     * @param to Адреса гаманця, на який будуть зараховані токени.
     * @param amount Кількість токенів (включаючи десяткові знаки).
     */
    function mint(address to, uint256 amount) public virtual onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Функція спалювання токенів (виведення з обігу).
     * @param amount Кількість токенів для спалювання з балансу
     * поточного відправника (msg.sender).
     */
    function burn(uint256 amount) public virtual {
        _burn(msg.sender, amount);
    }
}