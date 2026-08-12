export const BADGE_STYLES = ['flat', 'flat-square', 'for-the-badge', 'plastic', 'social'];

function shield(label, message, color, style) {
  const l = encodeURIComponent(label);
  const m = encodeURIComponent(message);
  return `![${label}](https://img.shields.io/badge/${l}-${m}-${color}?style=${style})`;
}

export function buildBadges({ languages, license, githubRepoPath, style }) {
  const badges = languages.map((lang) => shield('lang', lang.name.toLowerCase(), 'informational', style));

  if (license) {
    badges.push(shield('license', license.replace(/-/g, '--'), 'brightgreen', style));
  }

  if (githubRepoPath) {
    badges.push(`![GitHub stars](https://img.shields.io/github/stars/${githubRepoPath}?style=${style})`);
    badges.push(`![GitHub forks](https://img.shields.io/github/forks/${githubRepoPath}?style=${style})`);
    badges.push(`![GitHub issues](https://img.shields.io/github/issues/${githubRepoPath}?style=${style})`);
  }

  return badges;
}
