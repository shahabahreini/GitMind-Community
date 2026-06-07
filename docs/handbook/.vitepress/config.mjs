import { defineConfig } from "vitepress";

const repo = "https://github.com/shahabahreini/AI-Commit-Assistant";

export default defineConfig({
  title: "GitMind Handbook",
  description: "Complete user documentation for GitMind 5.x",
  base: "/AI-Commit-Assistant/",
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: false,
  head: [["link", { rel: "icon", href: "/AI-Commit-Assistant/assets/logo.png" }]],
  themeConfig: {
    logo: "/assets/logo.png",
    siteTitle: "GitMind",
    search: { provider: "local" },
    nav: [
      { text: "Quick Start", link: "/Installation-And-Quick-Start" },
      { text: "Providers", link: "/Providers-And-Models" },
      { text: "Reference", link: "/Complete-Settings-Reference" },
      { text: "GitHub", link: repo },
    ],
    sidebar: [
      {
        text: "Start",
        items: [
          { text: "Handbook Home", link: "/" },
          { text: "Installation & Quick Start", link: "/Installation-And-Quick-Start" },
          { text: "Interface Map", link: "/Interface-Map" },
          { text: "Generate Commit Messages", link: "/Generating-Commit-Messages" },
        ],
      },
      {
        text: "Configure",
        items: [
          { text: "Providers & Models", link: "/Providers-And-Models" },
          { text: "Provider Details", link: "/Provider-Reference" },
          { text: "Commit Styles & Emoji", link: "/Commit-Styles-And-Emoji" },
          { text: "Settings Reference", link: "/Complete-Settings-Reference" },
          { text: "Commands & Shortcuts", link: "/Commands-And-Shortcuts" },
        ],
      },
      {
        text: "GitMind Pro",
        items: [
          { text: "Free vs Pro", link: "/GitMind-Pro" },
          { text: "Activation & Licenses", link: "/Activation-And-License-Management" },
          { text: "Advanced Features", link: "/Advanced-Pro-Features" },
          { text: "Automatic Recovery", link: "/Automatic-Recovery" },
          { text: "Changelog Generation", link: "/Changelog-Generation" },
          { text: "Custom API", link: "/Custom-API-Guide" },
        ],
      },
      {
        text: "Help",
        items: [
          { text: "Security & Privacy", link: "/Security-And-Privacy" },
          { text: "Troubleshooting & FAQ", link: "/Troubleshooting-And-FAQ" },
          { text: "Support & Requests", link: "/Support-And-Requests" },
          { text: "Maintainer Guide", link: "/Maintainer-Guide" },
          { text: "Coverage Audit", link: "/Coverage-Audit" },
        ],
      },
    ],
    socialLinks: [{ icon: "github", link: repo }],
    editLink: { pattern: `${repo}/edit/main/docs/handbook/:path`, text: "Edit this page on GitHub" },
    footer: { message: "GitMind 5.x rolling user reference", copyright: "MIT licensed documentation" },
  },
});
