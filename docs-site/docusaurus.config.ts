import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'SolClone Docs',
  tagline: 'Build on the SolClone blockchain - a Solana-compatible L1 for learning and experimentation',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://docs.solclone.dev',
  baseUrl: '/',

  organizationName: 'solclone',
  projectName: 'solclone',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/solclone/solclone/tree/main/docs-site/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/solclone-social-card.jpg',
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'SolClone',
      logo: {
        alt: 'SolClone Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          to: '/docs/sdk-guide',
          label: 'API',
          position: 'left',
        },
        {
          to: '/docs/getting-started',
          label: 'Tutorials',
          position: 'left',
        },
        {
          href: 'https://github.com/solclone/solclone',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Introduction',
              to: '/docs/intro',
            },
            {
              label: 'Getting Started',
              to: '/docs/getting-started',
            },
            {
              label: 'CLI Reference',
              to: '/docs/cli-reference',
            },
          ],
        },
        {
          title: 'Guides',
          items: [
            {
              label: 'SDK Guide',
              to: '/docs/sdk-guide',
            },
            {
              label: 'Anchor Programs',
              to: '/docs/anchor-guide',
            },
            {
              label: 'DeFi Guide',
              to: '/docs/defi-guide',
            },
            {
              label: 'NFT Guide',
              to: '/docs/nft-guide',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/solclone/solclone',
            },
            {
              label: 'Discord',
              href: 'https://discord.gg/solclone',
            },
          ],
        },
      ],
      copyright: `Copyright ${new Date().getFullYear()} SolClone Project. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['rust', 'toml', 'bash'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
