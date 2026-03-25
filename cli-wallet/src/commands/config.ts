import { Command } from 'commander';
import {
  loadConfig,
  updateConfig,
  getConfigFile,
  getConfigDir,
  isValidCommitment,
} from '../lib/config';
import {
  printError,
  printSuccess,
  printKeyValue,
  printHeader,
  printWarning,
  colors,
  println,
} from '../lib/display';
import { Commitment } from '../types';

// ─── Network Presets ────────────────────────────────────────────────────────

interface NetworkPreset {
  rpc_url: string;
  label: string;
}

const NETWORK_PRESETS: Record<string, NetworkPreset> = {
  localnet: {
    rpc_url: 'http://localhost:8899',
    label: 'Localnet',
  },
  devnet: {
    rpc_url: 'http://localhost:8899',
    label: 'Devnet',
  },
  testnet: {
    rpc_url: 'http://localhost:8799',
    label: 'Testnet',
  },
  mainnet: {
    rpc_url: 'http://localhost:8699',
    label: 'Mainnet',
  },
};

const NETWORK_REMOTE: Record<string, string> = {
  devnet: 'https://api.devnet.prism.io',
  testnet: 'https://api.testnet.prism.io',
  mainnet: 'https://api.mainnet.prism.io',
};

export function registerConfigCommand(program: Command): void {
  const config = program
    .command('config')
    .description('View and update CLI configuration');

  // ─── config get ─────────────────────────────────────────────────────────

  config
    .command('get')
    .description('Display current configuration')
    .action(() => {
      try {
        const cfg = loadConfig();

        printHeader('Current Configuration');
        printKeyValue('Config file', getConfigFile());
        printKeyValue('Config dir', getConfigDir());
        println();
        printKeyValue('RPC URL', colors.primary(cfg.rpc_url));
        printKeyValue('Keypair path', cfg.keypair_path);
        printKeyValue('Commitment', cfg.commitment);

        // Detect network from URL
        const network = detectNetwork(cfg.rpc_url);
        if (network) {
          printKeyValue('Network', colors.primary(network));
        }

        println();
      } catch (err: any) {
        printError(err.message);
        process.exit(1);
      }
    });

  // ─── config set ─────────────────────────────────────────────────────────

  config
    .command('set')
    .description('Update configuration values')
    .option('-u, --url <rpc-url>', 'Set the RPC URL')
    .option('-k, --keypair <path>', 'Set the default keypair path')
    .option('-c, --commitment <level>', 'Set commitment level (processed|confirmed|finalized)')
    .action((options) => {
      try {
        let changed = false;

        if (options.url) {
          // Validate URL format
          try {
            new URL(options.url);
          } catch {
            printError(`Invalid URL: ${options.url}`);
            process.exit(1);
          }
          updateConfig({ rpc_url: options.url });
          printSuccess(`RPC URL set to: ${colors.primary(options.url)}`);
          changed = true;
        }

        if (options.keypair) {
          updateConfig({ keypair_path: options.keypair });
          printSuccess(`Keypair path set to: ${options.keypair}`);
          changed = true;
        }

        if (options.commitment) {
          if (!isValidCommitment(options.commitment)) {
            printError('Invalid commitment level. Must be: processed, confirmed, or finalized.');
            process.exit(1);
          }
          updateConfig({ commitment: options.commitment as Commitment });
          printSuccess(`Commitment set to: ${options.commitment}`);
          changed = true;
        }

        if (!changed) {
          printWarning('No configuration values provided. Use --help to see options.');
          println();
          console.log('  Examples:');
          console.log(`    ${colors.primary('prism config set --url http://localhost:8899')}`);
          console.log(`    ${colors.primary('prism config set --keypair ~/.prism/id.json')}`);
          console.log(`    ${colors.primary('prism config set --commitment finalized')}`);
          println();
        }
      } catch (err: any) {
        printError(err.message);
        process.exit(1);
      }
    });

  // ─── config use (network switching) ─────────────────────────────────────

  config
    .command('use <network>')
    .description('Switch to a network preset (localnet|devnet|testnet|mainnet)')
    .option('--remote', 'Use the remote RPC URL instead of localhost')
    .action((network: string, options) => {
      try {
        const networkLower = network.toLowerCase();
        const preset = NETWORK_PRESETS[networkLower];

        if (!preset) {
          printError(`Unknown network: ${network}`);
          println();
          console.log('  Available networks:');
          for (const [name, p] of Object.entries(NETWORK_PRESETS)) {
            const remote = NETWORK_REMOTE[name];
            console.log(`    ${colors.primary(name.padEnd(12))} ${colors.muted(p.rpc_url)}${remote ? colors.muted('  (remote: ' + remote + ')') : ''}`);
          }
          println();
          process.exit(1);
        }

        let rpcUrl = preset.rpc_url;

        // Use remote URL if requested and available
        if (options.remote) {
          const remoteUrl = NETWORK_REMOTE[networkLower];
          if (remoteUrl) {
            rpcUrl = remoteUrl;
          } else {
            printWarning(`No remote URL available for ${networkLower}. Using local: ${rpcUrl}`);
          }
        }

        updateConfig({ rpc_url: rpcUrl });

        printHeader('Network Changed');
        printKeyValue('Network', colors.primary(preset.label));
        printKeyValue('RPC URL', colors.primary(rpcUrl));

        if (options.remote && NETWORK_REMOTE[networkLower]) {
          printKeyValue('Mode', 'Remote');
        } else {
          printKeyValue('Mode', 'Local');
        }

        println();
        printSuccess(`Switched to ${preset.label}`);
      } catch (err: any) {
        printError(err.message);
        process.exit(1);
      }
    });
}

/**
 * Detect network name from an RPC URL.
 */
function detectNetwork(url: string): string | null {
  for (const [name, preset] of Object.entries(NETWORK_PRESETS)) {
    if (url === preset.rpc_url) return name;
  }
  for (const [name, remoteUrl] of Object.entries(NETWORK_REMOTE)) {
    if (url === remoteUrl) return `${name} (remote)`;
  }

  // Fallback heuristic
  const lower = url.toLowerCase();
  if (lower.includes('mainnet')) return 'Mainnet';
  if (lower.includes('testnet')) return 'Testnet';
  if (lower.includes('devnet')) return 'Devnet';
  if (lower.includes('localhost') || lower.includes('127.0.0.1')) return 'Localnet';
  return null;
}
