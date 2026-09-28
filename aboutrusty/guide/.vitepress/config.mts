import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

// Inside Rusty — the book. Deployed under the aboutrusty.com landing site,
// so the base path is fixed and the palette borrows the Rusty design
// language (oxidised canvas, ember accent) rather than VitePress defaults.
export default withMermaid(
  defineConfig({
    title: 'Inside Rusty',
    description:
      'The guide and reference book for the Rusty agent platform: the concepts, the internals, and the craft of building durable agents.',
    base: '/guide/',
    lang: 'en-US',
    appearance: 'force-dark',
    // The guide is served by the aboutrusty.com static host under /guide/;
    // dumb static file servers cannot resolve extensionless URLs, so links
    // keep their .html suffix.
    cleanUrls: false,
    lastUpdated: false,

    head: [
      ['meta', { name: 'theme-color', content: '#0d0a09' }],
      ['link', { rel: 'icon', href: '/guide/favicon.svg', type: 'image/svg+xml' }],
    ],

    markdown: {
      theme: { light: 'github-light', dark: 'github-dark' },
      lineNumbers: false,
    },

    mermaid: {
      theme: 'dark',
      themeVariables: {
        darkMode: true,
        background: '#0d0a09',
        primaryColor: '#1a1310',
        primaryTextColor: '#fff3ea',
        primaryBorderColor: '#f0862b',
        lineColor: '#cbb3a2',
        secondaryColor: '#1f1713',
        tertiaryColor: '#110c0a',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      },
    },

    themeConfig: {
      logo: '/favicon.svg',

      nav: [
        { text: 'aboutrusty.com', link: 'https://aboutrusty.com/' },
        { text: 'Chapters', link: '/00-preface' },
        {
          text: 'Repository',
          link: 'https://github.com/dev-amjad-shaikh/rusty',
        },
      ],

      sidebar: [
        {
          text: 'Part I — Orientation',
          items: [
            { text: '00 · Preface', link: '/00-preface' },
            { text: '01 · The problem: why agents need a runtime', link: '/01-the-problem' },
            { text: '02 · The Rusty mental model', link: '/02-mental-model' },
          ],
        },
        {
          text: 'Part II — Concepts and internals',
          items: [
            { text: '03 · Journals & evidence', link: '/03-journals' },
            { text: '04 · Memory', link: '/04-memory' },
            { text: '05 · The learning loop', link: '/05-learning-loop' },
            { text: '06 · Skills', link: '/06-skills' },
            { text: '07 · Capsules', link: '/07-capsules' },
            { text: '08 · Blueprints & agents', link: '/08-blueprints-agents' },
            { text: '09 · Tools & connectors', link: '/09-tools-connectors' },
            { text: '10 · Durability', link: '/10-durability' },
            { text: '11 · Sub-agents & delegation', link: '/11-sub-agents' },
            { text: '12 · Policy & security', link: '/12-policy-security' },
            { text: '13 · The server & the SDKs', link: '/13-server-sdks' },
            { text: '14 · Studio', link: '/14-studio' },
          ],
        },
        {
          text: 'Part III — Building with Rusty',
          items: [
            { text: '15 · Quickstart', link: '/15-quickstart' },
            { text: '16 · Build an agent end to end', link: '/16-build-an-agent' },
            { text: '17 · Build a skill', link: '/17-build-a-skill' },
            { text: '18 · Build a tool / connector', link: '/18-build-a-tool' },
            { text: '19 · Wire memory', link: '/19-wire-memory' },
            { text: '20 · Evaluate with rusty-eval', link: '/20-evaluate' },
            { text: '21 · Observe with rusty-otel', link: '/21-observe' },
            { text: '22 · Deploy & operate', link: '/22-deploy-operate' },
          ],
        },
        {
          text: 'Appendices',
          items: [
            { text: 'A · Glossary', link: '/appendix-a-glossary' },
            { text: 'B · Design-doc index', link: '/appendix-b-design-docs' },
            { text: 'C · Release history', link: '/appendix-c-releases' },
            { text: 'D · Where it’s going', link: '/appendix-d-roadmap' },
          ],
        },
      ],

      outline: { level: [2, 3], label: 'On this page' },

      socialLinks: [
        { icon: 'github', link: 'https://github.com/dev-amjad-shaikh/rusty' },
      ],

      footer: {
        message:
          'Inside Rusty is part of the Rusty project. Dual-licensed MIT OR Apache-2.0.',
        copyright: 'Hosted at aboutrusty.com/guide/',
      },

      search: { provider: 'local' },

      editLink: {
        pattern: 'https://github.com/dev-amjad-shaikh/rusty/edit/main/guide/:path',
        text: 'Suggest an edit to this page',
      },
    },
  })
)
