const SECTION_TITLES = {
  description: 'Description',
  features: 'Features',
  installation: 'Installation',
  usage: 'Usage',
  contributing: 'Contributing',
  support: 'Support',
  acknowledgements: 'Acknowledgements',
  license: 'License'
};

function buildSectionBody(key, ctx) {
  const { description, features, installation, usage, githubUrl, license } = ctx;
  switch (key) {
    case 'description':
      return description ? `## Description\n${description}` : null;
    case 'features':
      return features.length > 0 ? `## Features\n${features.map((f) => `- ${f}`).join('\n')}` : null;
    case 'installation':
      return `## Installation\n\`\`\`bash\n${installation}\n\`\`\``;
    case 'usage':
      return `## Usage\n${usage}`;
    case 'contributing':
      return githubUrl
        ? `## Contributing\nContributions, issues and feature requests are welcome. Check the [issues page](${githubUrl}/issues) or open a pull request.`
        : `## Contributing\nContributions, issues and feature requests are welcome.`;
    case 'support':
      return githubUrl
        ? `## Support\nIf this project is useful to you, consider starring it on [GitHub](${githubUrl}).`
        : `## Support\nOpen an issue if you run into problems.`;
    case 'acknowledgements':
      return `## Acknowledgements\nThanks to the open-source libraries this project builds on.`;
    case 'license':
      return license
        ? `## License\nDistributed under the ${license} License. See [LICENSE](LICENSE) for details.`
        : `## License\nNo license file was found in this project.`;
    default:
      return null;
  }
}

// Builds the final README.md text from wizard answers. `sections` is the
// ordered list of section keys the user chose to include (subset of
// SECTION_TITLES' keys). A section that ends up with nothing to say (e.g.
// "Features" with no detected dependencies) is dropped from both the body
// and the table of contents, so the TOC never links to a heading that isn't
// actually there.
export function renderReadme(answers) {
  const { projectName, badges, sections, githubUrl, includeToc } = answers;

  const rendered = sections
    .map((key) => ({ key, body: buildSectionBody(key, answers) }))
    .filter((s) => s.body);

  const parts = [`# ${projectName}`];

  if (badges.length > 0) {
    parts.push(badges.join(' '));
  }

  if (githubUrl) {
    parts.push(`View on [GitHub](${githubUrl}).`);
  }

  if (includeToc && rendered.length > 0) {
    const toc = rendered
      .map(({ key }) => `- [${SECTION_TITLES[key]}](#${SECTION_TITLES[key].toLowerCase()})`)
      .join('\n');
    parts.push(`## Table of Contents\n${toc}`);
  }

  for (const { body } of rendered) parts.push(body);

  return parts.filter(Boolean).join('\n\n') + '\n';
}
