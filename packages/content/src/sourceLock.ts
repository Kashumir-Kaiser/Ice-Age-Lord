export const CONTENT_VERSION = 'LL01-CONTENT-0.1.0' as const;
export const RULESET_VERSION = 'LL01-RULESET-0.1.0' as const;
export const SOURCE_MAIN_COMMIT = '66f0c2adaf9e2cc5b4391978a699bda6a24ecdbd' as const;
export const READ_ONLY_FRONTEND_REFERENCE = {
  branch: 'frontend/demo-ui-v0',
  commit: '27611a2eeaf226a11ebe05615a4539f165db7cdf',
} as const;

export const SOURCE_LOCK = {
  'README.md': 'a1117d4f37b05fe35144d3ec1ddb86215fdee859bf77b833970c0b770e16d77c',
  'docs/FRESH_START.md': 'fb490bffe1e3d2281fb3d74780944c61c24c94763772474fd7aa343952d3be8a',
  'design/current/WEB-GAME-CONTENT-DESIGN-v1.3.md': '073815b15cb86c40a79e9d103da9e4a8349f3832c789d35f17e84f4b9590b643',
  'references/canonical/RELEASE-LINEAGE-LL01-1.3.0.md': 'dffe83c6e5691b9c2fdaf2de7981d93f2283a428a3e34372ee73b3202b59399d',
  'references/canonical/LORD-DND-01.md': '9c4f758b2fb8f93eaccee539f2ec6626eb32684ce8fe95aa734612f00b6d2730',
  'references/canonical/LORD-DND-02.md': '4b44a7cc041138b2c2ba0e5f1b9ef4e772e7ec5a37fe8f3b2472f41767d241bc',
  'references/canonical/LORD-DND-03.md': '1791ac670ef8cc3319bdec54733e8d8eb542dda19da47d1e6ce720b7fc36e632',
  'references/canonical/LORD-DND-04.md': '6bc5c58f58d44e256a6ae4a386b4ea06849680eea04931a46c25d4ec98248718',
  'references/canonical/LORD-DND-05.md': 'adc9f670ce37688eb69d40d09f776bcf08335d10e830dbd76a6173f2b2375248',
  'references/canonical/LORD-DND-06.md': 'a383b9b01aae2ac6f54743555a2545e89505ad91c3271f9f711a300bf3f7af20',
  'references/canonical/LORD-DND-07.md': 'b4734c66751d197134b334450bf01c0fbc5b53f0c033a10392701f7f075992e4',
  'data/events/EVENT-SOURCE-CATALOG-v3.6.json': '4108d9e2d954f291f04b88958bfbc04a087112e0c7832c843edd119171b1e894',
  'data/events/EVENT-TIMELINE-v0.6.json': '4ae98de45c94eb9b639a0ce6b8fab6f3af0719deebb0dd9f21bf3d7d03a84c22',
  'data/structures/SOURCE-STRUCTURE-CATALOG-v0.5.json': 'c0adb3461bac5f128688a38a38499e0f9b905eabeb5a7c9b20601aec42411d61',
} as const;

export const SOURCE_RELEASES: Readonly<Record<keyof typeof SOURCE_LOCK, string>> = {
  'README.md': 'repository-readme-at-main-72aa18a',
  'docs/FRESH_START.md': 'fresh-start-contract-current-at-main-66f0c2a',
  'design/current/WEB-GAME-CONTENT-DESIGN-v1.3.md': 'WEB-GAME-CONTENT-DESIGN-v1.3',
  'references/canonical/RELEASE-LINEAGE-LL01-1.3.0.md': 'LL01-RELEASE-LINEAGE-1.3.0',
  'references/canonical/LORD-DND-01.md': 'LORD-DND-01-2.7.0',
  'references/canonical/LORD-DND-02.md': 'LORD-DND-02-1.14.0',
  'references/canonical/LORD-DND-03.md': 'LORD-DND-03-1.10.0',
  'references/canonical/LORD-DND-04.md': 'LORD-DND-04-3.1.0',
  'references/canonical/LORD-DND-05.md': 'LORD-DND-05-3.2.0',
  'references/canonical/LORD-DND-06.md': 'LORD-DND-06-2.5.0',
  'references/canonical/LORD-DND-07.md': 'LORD-DND-07-1.3.0',
  'data/events/EVENT-SOURCE-CATALOG-v3.6.json': 'LL01-WEB-EVENT-SOURCE-EXTRACTION-3.6-ON-TIMELINE-0.6',
  'data/events/EVENT-TIMELINE-v0.6.json': 'LL01-WEB-EVENT-TIMELINE-RECONCILIATION-0.6-RC1',
  'data/structures/SOURCE-STRUCTURE-CATALOG-v0.5.json': 'LL01-ICE-AGE-LORD-SOURCE-STRUCTURES-0.5',
};
