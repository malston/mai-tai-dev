import type { ComponentType } from 'react';

// Getting Started
import WhatIsMaiTai from '../../../content/docs/getting-started/what-is-mai-tai.mdx';
import QuickStart from '../../../content/docs/getting-started/quick-start.mdx';

// Setting Up Agents
import McpInstallation from '../../../content/docs/setting-up-agents/mcp-installation.mdx';
import ClaudeCode from '../../../content/docs/setting-up-agents/claude-code.mdx';
import Augment from '../../../content/docs/setting-up-agents/augment.mdx';
import ClaudeDesktop from '../../../content/docs/setting-up-agents/claude-desktop.mdx';

// Using Mai-Tai
import StartingMode from '../../../content/docs/using-mai-tai/starting-mode.mdx';
import BestPractices from '../../../content/docs/using-mai-tai/best-practices.mdx';

// Troubleshooting
import CommonIssues from '../../../content/docs/troubleshooting/common-issues.mdx';
import Faq from '../../../content/docs/troubleshooting/faq.mdx';

export const mdxContent: Record<string, ComponentType> = {
  'what-is-mai-tai': WhatIsMaiTai,
  'quick-start': QuickStart,
  'mcp-installation': McpInstallation,
  'claude-code': ClaudeCode,
  augment: Augment,
  'claude-desktop': ClaudeDesktop,
  'starting-mode': StartingMode,
  'best-practices': BestPractices,
  'common-issues': CommonIssues,
  faq: Faq,
};

