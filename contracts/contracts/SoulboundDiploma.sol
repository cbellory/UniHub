// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SoulboundDiploma
 * @dev Реалізація непередаваних токенів (SBT) для фіксації дипломів.
 * Токени не можуть бути передані після видачі, що гарантує автентичність диплома.
 */
contract SoulboundDiploma is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;

    constructor() ERC721("University Diploma", "UDIP") Ownable(msg.sender) {}

    /**
     * @dev Видача диплома студенту.
     * @param to Адреса студента.
     * @param uri Посилання на метадані диплома (IPFS).
     */
    function safeMint(address to, string memory uri) public onlyOwner {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    /**
     * @dev Блокування передачі токенів.
     * Забороняє будь-які трансфери, крім спалювання (burn) або мінтингу (mint).
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721)
        returns (address)
    {
        address from = _ownerOf(tokenId);
        // Дозволяємо тільки mint (from == 0) та burn (to == 0)
        if (from != address(0) && to != address(0)) {
            revert("SBT: Token transfer is not allowed");
        }
        return super._update(to, tokenId, auth);
    }

    // Необхідні override функції для ERC721URIStorage
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
