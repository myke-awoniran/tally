"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionStatus = exports.TransactionType = exports.AssetType = exports.AssetSymbol = exports.ClerkType = void 0;
var ClerkType;
(function (ClerkType) {
    ClerkType["DEBIT"] = "DEBIT";
    ClerkType["CREDIT"] = "CREDIT";
})(ClerkType = exports.ClerkType || (exports.ClerkType = {}));
var AssetSymbol;
(function (AssetSymbol) {
    AssetSymbol["NGN"] = "NGN";
    AssetSymbol["USD"] = "USD";
    AssetSymbol["GBP"] = "GBP";
})(AssetSymbol = exports.AssetSymbol || (exports.AssetSymbol = {}));
var AssetType;
(function (AssetType) {
    AssetType["NAIRA"] = "NAIRA";
    AssetType["DOLLAR"] = "DOLLAR";
    AssetType["POUND"] = "POUND";
})(AssetType = exports.AssetType || (exports.AssetType = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType["WITHDRAWAL"] = "WITHDRAWAL";
    TransactionType["PURCHASE"] = "PURCHASE";
    TransactionType["SALES"] = "SALES";
    TransactionType["WITHDRAWAL_REVERSAL"] = "WITHDRAWAL_REVERSAL";
    TransactionType["PURCHASE_REFUND"] = "PURCHASE_REFUND";
})(TransactionType = exports.TransactionType || (exports.TransactionType = {}));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PENDING"] = "PENDING";
    TransactionStatus["REVERSED"] = "REVERSED";
    TransactionStatus["SUCCESS"] = "SUCCESS";
    TransactionStatus["FAILED"] = "FAILED";
    TransactionStatus["PROCESSING"] = "PROCESSING";
    TransactionStatus["PROVIDER_PROCESSING"] = "PROVIDER_PROCESSING";
})(TransactionStatus = exports.TransactionStatus || (exports.TransactionStatus = {}));
