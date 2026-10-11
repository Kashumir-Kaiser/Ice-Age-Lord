export const CONTENT_VERSION = 'LL01-CONTENT-0.3.0' as const;
export const RULESET_VERSION = 'LL01-RULESET-0.3.0' as const;
export const SOURCE_MAIN_COMMIT = '32f34d8b5bb85671ec6301a30f045e30c0f8f161' as const;
export const READ_ONLY_FRONTEND_REFERENCE = {
  branch: 'frontend/demo-ui-v0',
  commit: '27611a2eeaf226a11ebe05615a4539f165db7cdf',
} as const;

export const SOURCE_LOCK = {
  'README.md': '411b9629c2935752b1a67f70882c137446ceb4eed6317d0f47a64264c5bb973c',
  'docs/FRESH_START.md': '298de25154bb9e6c1d02339a24fc68d87c1d9c8771e11390de63f01f5887a84f',
  'design/current/WEB-GAME-CONTENT-DESIGN-v1.3.md': '073815b15cb86c40a79e9d103da9e4a8349f3832c789d35f17e84f4b9590b643',
  'references/canonical/RELEASE-LINEAGE-LL01-1.3.0.md': 'dffe83c6e5691b9c2fdaf2de7981d93f2283a428a3e34372ee73b3202b59399d',
  'references/canonical/LORD-DND-01.md': '9c4f758b2fb8f93eaccee539f2ec6626eb32684ce8fe95aa734612f00b6d2730',
  'references/canonical/LORD-DND-02.md': '4b44a7cc041138b2c2ba0e5f1b9ef4e772e7ec5a37fe8f3b2472f41767d241bc',
  'references/canonical/LORD-DND-03.md': '1791ac670ef8cc3319bdec54733e8d8eb542dda19da47d1e6ce720b7fc36e632',
  'references/canonical/LORD-DND-04.md': '6bc5c58f58d44e256a6ae4a386b4ea06849680eea04931a46c25d4ec98248718',
  'references/canonical/LORD-DND-05.md': 'adc9f670ce37688eb69d40d09f776bcf08335d10e830dbd76a6173f2b2375248',
  'references/canonical/LORD-DND-06.md': 'a383b9b01aae2ac6f54743555a2545e89505ad91c3271f9f711a300bf3f7af20',
  'references/canonical/LORD-DND-07.md': 'b4734c66751d197134b334450bf01c0fbc5b53f0c033a10392701f7f075992e4',
  'data/events/EVENT-SOURCE-CATALOG-v4.6.json': '3798c889de3ca79afe5941acdf9a674c8618442d0a4343777095f3d054f788b1',
  'data/events/EVENT-SOURCE-ITEMS-v4.6.csv': '9b79b5d34a9060f682bf56bb54606c8f48402f88df036b6b03001f9098363bee',
  'data/events/EVENT-TIMELINE-v0.6.json': '4ae98de45c94eb9b639a0ce6b8fab6f3af0719deebb0dd9f21bf3d7d03a84c22',
  'data/structures/SOURCE-STRUCTURE-CATALOG-v1.0.json': 'dd1d7d5d11a926ce02b0f1bf735bade395f7b5c4f7b2db0ef24fd276ae40e62c',
} as const;

export const SOURCE_RELEASES: Readonly<Record<keyof typeof SOURCE_LOCK, string>> = {
  'README.md': 'repository-readme-at-main-32f34d8',
  'docs/FRESH_START.md': 'fresh-start-contract-at-main-32f34d8',
  'design/current/WEB-GAME-CONTENT-DESIGN-v1.3.md': 'WEB-GAME-CONTENT-DESIGN-v1.3',
  'references/canonical/RELEASE-LINEAGE-LL01-1.3.0.md': 'LL01-RELEASE-LINEAGE-1.3.0',
  'references/canonical/LORD-DND-01.md': 'LORD-DND-01-2.7.0',
  'references/canonical/LORD-DND-02.md': 'LORD-DND-02-1.14.0',
  'references/canonical/LORD-DND-03.md': 'LORD-DND-03-1.10.0',
  'references/canonical/LORD-DND-04.md': 'LORD-DND-04-3.1.0',
  'references/canonical/LORD-DND-05.md': 'LORD-DND-05-3.2.0',
  'references/canonical/LORD-DND-06.md': 'LORD-DND-06-2.5.0',
  'references/canonical/LORD-DND-07.md': 'LORD-DND-07-1.3.0',
  'data/events/EVENT-SOURCE-CATALOG-v4.6.json': 'LL01-WEB-EVENT-SOURCE-EXTRACTION-4.6-ON-TIMELINE-0.6',
  'data/events/EVENT-SOURCE-ITEMS-v4.6.csv': 'LL01-WEB-EVENT-SOURCE-ITEMS-4.6',
  'data/events/EVENT-TIMELINE-v0.6.json': 'LL01-WEB-EVENT-TIMELINE-RECONCILIATION-0.6-RC1',
  'data/structures/SOURCE-STRUCTURE-CATALOG-v1.0.json': 'LL01-ICE-AGE-LORD-SOURCE-STRUCTURES-1.0',
} as const;
