# Round 69 Data Correction — Version 6.9.1

## Defect and repair

The original Round 69 CSV v6.9 contained 13 malformed shop/market offer rows (SX-1089, SX-1090, SX-1102, and SX-1104–SX-1113). Their positional fields were shifted during row generation: translated names, subtypes, prices, currency, and chapter/source metadata landed in incorrect columns. Receipt rows and event-rule rows in v6.9 were unaffected.

This correction rebuilds those 13 offer rows from the source notes and leaves all other 1,108 rows unchanged. The corrected rows now have printed chapter numbers, Chinese source names, Vietnamese display names, correct offer subtypes/prices/currencies/limits, working source and mirror URLs, and a clear offer-versus-acquisition distinction. The 1.5-billion-mark Dragon Scroll purchases remain separate acquisition rows.

## Verification

- 1,121 cumulative data rows remain (header plus 1,121 records).
- IDs remain contiguous SX-0001–SX-1121.
- All 69 columns are retained.
- 13 offer rows retain shop_offer_verified=true and acquisition_verified=false.
- The corrected market offers are mapped to Chapters 1104 and 1109; the ten Dragon Soul Envoy shop listings are mapped to Chapter 1109.
- No source facts or quantities outside these rows were changed.

## Files

- Corrected cumulative file: `data/events/EVENT-SOURCE-ITEMS-v6.9.1.csv`
- Round 69 source addendum remains: `data/events/EVENT-SOURCE-CATALOG-v6.9-ADDENDUM.json`
- Original v6.9 file is retained for traceability; use v6.9.1 as the current Round 69 dataset.