import { Command } from 'commander';
import ora from 'ora';
import { createRpcClient } from '../lib/rpc-client';
import { loadDefaultKeypair, getPublicKeyBase58 } from '../lib/keypair';
import {
  printError,
  printKeyValue,
  printHeader,
  printWarning,
  formatSol,
  colors,
  println,
  printTable,
  formatNumber,
  truncate,
} from '../lib/display';

export function registerInfoCommand(program: Command): void {
  const info = program
    .command('info')
    .description('Show account info, cluster info, or version');

  // ─── info account ───────────────────────────────────────────────────────

  info
    .command('account [address]')
    .description('Show detailed account information')
    .action(async (address: string | undefined) => {
      try {
        let targetAddress = address;
        if (!targetAddress) {
          const keypair = loadDefaultKeypair();
          targetAddress = getPublicKeyBase58(keypair);
        }

        printHeader('Account Info');

        const spinner = ora({
          text: 'Fetching account info...',
          color: 'cyan',
        }).start();

        const rpc = createRpcClient();

        try {
          // Fetch balance and account info in parallel
          const [balanceResult, accountResult] = await Promise.all([
            rpc.getBalance(targetAddress),
            rpc.getAccountInfo(targetAddress),
          ]);
          spinner.stop();

          printKeyValue('Address', colors.address(targetAddress));
          printKeyValue('Balance', formatSol(balanceResult.value));
          printKeyValue('Slot', colors.muted(balanceResult.context.slot.toString()));
          println();

          if (accountResult.value) {
            const acct = accountResult.value;
            printKeyValue('Owner', colors.address(acct.owner));
            printKeyValue('Executable', acct.executable ? colors.warning('Yes') : 'No');
            printKeyValue('Rent Epoch', acct.rentEpoch.toString());
            printKeyValue('Data Size', `${acct.space} bytes`);
            printKeyValue('Lamports', formatNumber(acct.lamports));
          } else {
            printWarning('Account does not exist on-chain (no data).');
            console.log(
              colors.muted(
                '  This address has no on-chain state. It may still receive SOL.'
              )
            );
          }

          println();
        } catch (err: any) {
          spinner.fail('Failed to fetch account info');
          throw err;
        }
      } catch (err: any) {
        printError(err.message);
        process.exit(1);
      }
    });

  // ─── info cluster ───────────────────────────────────────────────────────

  info
    .command('cluster')
    .description('Show cluster information')
    .action(async () => {
      try {
        printHeader('Cluster Info');

        const rpc = createRpcClient();
        printKeyValue('RPC URL', colors.primary(rpc.getUrl()));
        println();

        const spinner = ora({
          text: 'Fetching cluster info...',
          color: 'cyan',
        }).start();

        try {
          // Fetch multiple pieces of info in parallel
          const [version, epochInfo, slot, blockHeight, slotLeader, txCount] =
            await Promise.all([
              rpc.getVersion().catch(() => null),
              rpc.getEpochInfo().catch(() => null),
              rpc.getSlot().catch(() => null),
              rpc.getBlockHeight().catch(() => null),
              rpc.getSlotLeader().catch(() => null),
              rpc.getTransactionCount().catch(() => null),
            ]);
          spinner.stop();

          if (version) {
            printKeyValue('Version', colors.info(version['solana-core']));
            printKeyValue('Feature Set', version['feature-set'].toString());
          }

          if (epochInfo) {
            println();
            printKeyValue('Epoch', colors.amount(epochInfo.epoch.toString()));
            printKeyValue(
              'Epoch Progress',
              `${epochInfo.slotIndex} / ${epochInfo.slotsInEpoch} slots ` +
                colors.muted(
                  `(${((epochInfo.slotIndex / epochInfo.slotsInEpoch) * 100).toFixed(1)}%)`
                )
            );
            printKeyValue(
              'Absolute Slot',
              formatNumber(epochInfo.absoluteSlot)
            );
            printKeyValue('Block Height', formatNumber(epochInfo.blockHeight));
          }

          if (slot !== null) {
            printKeyValue('Current Slot', formatNumber(slot));
          }

          if (blockHeight !== null) {
            printKeyValue('Block Height', formatNumber(blockHeight));
          }

          if (slotLeader) {
            printKeyValue('Slot Leader', colors.address(slotLeader));
          }

          if (txCount !== null) {
            printKeyValue('Transaction Count', formatNumber(txCount));
          }

          // Try to get cluster nodes
          println();
          const nodesSpinner = ora({
            text: 'Fetching cluster nodes...',
            color: 'cyan',
          }).start();

          try {
            const nodes = await rpc.getClusterNodes();
            nodesSpinner.stop();

            printKeyValue('Cluster Nodes', nodes.length.toString());
            println();

            if (nodes.length > 0) {
              const displayNodes = nodes.slice(0, 10);
              const headers = ['Pubkey', 'Version', 'Gossip', 'TPU'];
              const rows = displayNodes.map((node) => [
                truncate(node.pubkey, 16),
                node.version || 'N/A',
                node.gossip || 'N/A',
                node.tpu || 'N/A',
              ]);

              printTable(headers, rows);

              if (nodes.length > 10) {
                println();
                console.log(
                  colors.muted(`  ... and ${nodes.length - 10} more nodes`)
                );
              }
            }
          } catch {
            nodesSpinner.stop();
            printWarning('Could not fetch cluster nodes');
          }

          // Try to get vote accounts
          println();
          try {
            const voteAccounts = await rpc.getVoteAccounts();
            const totalValidators =
              voteAccounts.current.length + voteAccounts.delinquent.length;
            printKeyValue(
              'Validators',
              `${voteAccounts.current.length} active, ${voteAccounts.delinquent.length} delinquent (${totalValidators} total)`
            );
          } catch {
            // Skip if not available
          }

          println();
        } catch (err: any) {
          spinner.fail('Failed to fetch cluster info');
          throw err;
        }
      } catch (err: any) {
        printError(err.message);
        process.exit(1);
      }
    });

  // ─── info version ───────────────────────────────────────────────────────

  info
    .command('version')
    .description('Show node version information')
    .action(async () => {
      try {
        printHeader('Version Info');

        const spinner = ora({
          text: 'Fetching version...',
          color: 'cyan',
        }).start();

        const rpc = createRpcClient();

        try {
          const version = await rpc.getVersion();
          spinner.stop();

          printKeyValue('RPC URL', colors.primary(rpc.getUrl()));
          printKeyValue('Prism core', colors.primary(version['solana-core']));
          printKeyValue('Feature set', version['feature-set'].toString());
          println();
        } catch (err: any) {
          spinner.fail('Failed to fetch version');
          throw err;
        }
      } catch (err: any) {
        printError(err.message);
        process.exit(1);
      }
    });
}
