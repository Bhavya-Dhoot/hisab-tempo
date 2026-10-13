// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @notice Stablecoin settlement vault for Tempo (no native coin: nothing is payable).
/// @dev The receivable is represented by this vault's Bill record; the original repo's
///      ReceivableToken stays as-is for the legacy local demo.
contract SettlementVault {
    using SafeERC20 for IERC20;

    uint8 constant NONE = 0;
    uint8 constant OPEN = 1;
    uint8 constant FINANCED = 2;
    uint8 constant REALISED = 3;
    uint8 constant PARTIAL = 4;

    struct Bill {
        address exporter;
        address financier;
        uint256 invoice;
        uint256 advance;
        uint16 rateBps;
        uint32 tenorDays;
        uint8 state;
    }

    error EXISTS();
    error NOT_OPEN();
    error ALREADY_LOCKED();
    error ADVANCE_TOO_HIGH();
    error NOT_FINANCED();
    error ALREADY_REALISED();
    error NOT_KEEPER();

    event Registered(bytes32 indexed sbHash, address indexed exporter, uint256 invoice);
    event Financed(bytes32 indexed sbHash, address indexed financier, uint256 advance, uint16 rateBps);
    event Realised(
        bytes32 indexed sbHash, uint256 received, uint256 toFinancier, uint256 fee, uint256 toExporter, bytes32 payTx
    );

    IERC20 public immutable token;
    address public immutable treasury;
    address public immutable keeper;
    uint16 public immutable feeBps;
    mapping(bytes32 => Bill) public bills;

    constructor(IERC20 token_, address treasury_, address keeper_, uint16 feeBps_) {
        token = token_;
        treasury = treasury_;
        keeper = keeper_;
        feeBps = feeBps_;
    }

    function register(bytes32 sbHash, uint256 invoice, uint32 tenorDays) external {
        if (bills[sbHash].state != NONE) revert EXISTS();
        bills[sbHash] = Bill(msg.sender, address(0), invoice, 0, 0, tenorDays, OPEN);
        emit Registered(sbHash, msg.sender, invoice);
    }

    function finance(bytes32 sbHash, uint256 advance, uint16 rateBps) external {
        Bill storage b = bills[sbHash];
        if (b.state >= FINANCED) revert ALREADY_LOCKED();
        if (b.state != OPEN) revert NOT_OPEN();
        if (advance > b.invoice) revert ADVANCE_TOO_HIGH();
        b.financier = msg.sender;
        b.advance = advance;
        b.rateBps = rateBps;
        b.state = FINANCED;
        token.safeTransferFrom(msg.sender, b.exporter, advance);
        emit Financed(sbHash, msg.sender, advance, rateBps);
    }

    /// @notice Keeper-trusted path: buyer already sent `received` to the vault via TIP-20
    ///         transferWithMemo(memo = sbHash); keeper asserts it.
    function realise(bytes32 sbHash, uint256 received, bytes32 payTx) external {
        if (msg.sender != keeper) revert NOT_KEEPER();
        _settle(sbHash, received, payTx);
    }

    /// @notice Trustless path: buyer approves the vault and pays directly.
    function pay(bytes32 sbHash, uint256 amount) external {
        token.safeTransferFrom(msg.sender, address(this), amount);
        _settle(sbHash, amount, bytes32(0));
    }

    function _settle(bytes32 sbHash, uint256 received, bytes32 payTx) internal {
        Bill storage b = bills[sbHash];
        if (b.state >= REALISED) revert ALREADY_REALISED();
        if (b.state != FINANCED) revert NOT_FINANCED();
        uint256 interest = (b.advance * b.rateBps * b.tenorDays) / (10000 * 365);
        uint256 rest = received;
        uint256 toFin = _min(rest, b.advance + interest);
        rest -= toFin;
        uint256 fee = _min(rest, (b.invoice * feeBps) / 10000);
        uint256 toExp = rest - fee;
        b.state = received >= b.invoice ? REALISED : PARTIAL;
        if (toFin > 0) token.safeTransfer(b.financier, toFin);
        if (fee > 0) token.safeTransfer(treasury, fee);
        if (toExp > 0) token.safeTransfer(b.exporter, toExp);
        emit Realised(sbHash, received, toFin, fee, toExp, payTx);
    }

    function _min(uint256 a, uint256 b) private pure returns (uint256) {
        return a < b ? a : b;
    }
}
