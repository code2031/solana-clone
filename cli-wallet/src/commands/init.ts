import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

const TEMPLATE_MAP: Record<string, string> = {
  token: 'token',
  nft: 'nft-collection',
  escrow: 'escrow',
  voting: 'voting',
  staking: 'staking-pool',
};

const VALID_TEMPLATES = Object.keys(TEMPLATE_MAP);

function copyDirRecursive(src: string, dest: string): void {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function updateProjectName(projectDir: string, projectName: string): void {
  const cargoPath = path.join(projectDir, 'programs', 'Cargo.toml');

  if (fs.existsSync(cargoPath)) {
    let content = fs.readFileSync(cargoPath, 'utf-8');
    // Replace the package name with the project name
    content = content.replace(
      /^name\s*=\s*"[^"]*"/m,
      `name = "${projectName}"`
    );
    fs.writeFileSync(cargoPath, content, 'utf-8');
  }
}

function findTemplatesDir(): string {
  // Look for templates relative to the CLI package, then common locations
  const candidates = [
    path.resolve(__dirname, '..', '..', '..', 'templates'),
    path.resolve(__dirname, '..', '..', 'templates'),
    path.resolve(process.cwd(), 'templates'),
    path.resolve(process.env.HOME || '~', 'prism-chain', 'templates'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    'Could not find templates directory. Ensure Prism is properly installed.'
  );
}

export function registerInitCommand(program: Command): void {
  program
    .command('init <name>')
    .description('Initialize a new Prism project from a template')
    .option(
      '-t, --template <template>',
      `Template to use: ${VALID_TEMPLATES.join(', ')}`,
      'token'
    )
    .option(
      '--dir <directory>',
      'Target directory (defaults to ./<name>)'
    )
    .action(async (name: string, options: { template: string; dir?: string }) => {
      try {
        const templateKey = options.template.toLowerCase();

        if (!TEMPLATE_MAP[templateKey]) {
          console.error(
            chalk.red(`\n  Invalid template: "${options.template}"`)
          );
          console.error(
            chalk.gray(`  Available templates: ${VALID_TEMPLATES.join(', ')}`)
          );
          process.exit(1);
        }

        const templateDirName = TEMPLATE_MAP[templateKey];
        const templatesBase = findTemplatesDir();
        const templateSrc = path.join(templatesBase, templateDirName);

        if (!fs.existsSync(templateSrc)) {
          console.error(
            chalk.red(`\n  Template directory not found: ${templateSrc}`)
          );
          process.exit(1);
        }

        const targetDir = path.resolve(options.dir || name);

        if (fs.existsSync(targetDir)) {
          const entries = fs.readdirSync(targetDir);
          if (entries.length > 0) {
            console.error(
              chalk.red(`\n  Directory "${targetDir}" already exists and is not empty.`)
            );
            process.exit(1);
          }
        }

        console.log(chalk.cyan('\n  Initializing Prism project...\n'));
        console.log(chalk.gray(`  Template:  ${chalk.white(templateKey)} (${templateDirName})`));
        console.log(chalk.gray(`  Project:   ${chalk.white(name)}`));
        console.log(chalk.gray(`  Directory: ${chalk.white(targetDir)}\n`));

        // Copy template files
        copyDirRecursive(templateSrc, targetDir);

        // Update project name in Cargo.toml
        updateProjectName(targetDir, name);

        console.log(chalk.green('  Project initialized successfully!\n'));
        console.log(chalk.gray('  Next steps:\n'));
        console.log(chalk.white(`    cd ${path.relative(process.cwd(), targetDir) || '.'}`));
        console.log(chalk.white('    anchor build'));
        console.log(chalk.white('    anchor test'));
        console.log(chalk.white('    anchor deploy\n'));
      } catch (err: any) {
        console.error(chalk.red(`\n  Error: ${err.message}\n`));
        process.exit(1);
      }
    });
}
