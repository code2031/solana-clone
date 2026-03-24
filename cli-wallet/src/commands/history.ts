import { Command } from 'commander';
import ora from 'ora';
import { createRpcClient } from '../lib/rpc-client';
import { loadDefaultKeypair, getPublicKeyBase58 } from '../lib/keypair';
import {
  printError,
  printKeyValue,
  printHeader,
  printWarning,
  colors,
  println,
  printTable,
  truncate,
  formatTimestamp,
  formatSol,
  lamportsToSol,
} from '../lib/display';

export function registerHistoryCommand(program: Command): void {
  program
    .command('history [address]')
    .description('Show transaction history for an account')
    .option('-l, --limit <number>', 'Number of transactions to show', '10')
    .option('-v, --verbose', 'Show detailed transaction info', false)
    .action(async (address: string | undefined, options) => {
      try {
        let targetAddress = address;
        if (!targetAddress) {
          const keypair = loadDefaultKeypair();
          targetAddress = getPublicKeyBase58(keypair);
        }

        const limit = parseInt(options.limit, 10) || 10;

        printHeader('Transaction History');
        printKeyValue('Address', colors.address(targetAddress));
        printKeyValue('Limit', limit.toString());
        println();

        const rpc = createRpcClient();

        // Fetch signatures
        const sigSpinner = ora('Fetching transaction history...').start();
        try {
          const signatures = await rpc.getSignaturesForAddress(targetAddress, limit);
          sigSpinner.stop();

          if (signatures.length === 0) {
            printWarning('No transactions found for this address.');
            return;
          }

          if (options.verbose) {
            // Detailed view: fetch full transaction data for each
            for (let i = 0; i < signatures.length; i++) {
              const sig = signatures[i];
              console.log(
                `  ${colors.muted(`[${i + 1}/${signatures.length}]`)} ${colors.primary(
                  truncate(sig.signature, 44)
                )}`
              );
              printKeyValue('    Slot', sig.slot.toString(), 0);
              printKeyValue('    Time', formatTimestamp(sig.blockTime), 0);
              printKeyValue(
                '    Status',
                sig.err
                  ? colors.error('Failed')
                  : colors.success('Success'),
                0
              );
              printKeyValue(
                '    Confirmation',
                sig.confirmationStatus || 'unknown',
                0
              );

              if (sig.memo) {
                printKeyValue('    Memo', sig.memo, 0);
              }

              // Fetch detailed transaction info
              try {
                const txDetail = await rpc.getTransaction(sig.signature);
                if (txDetail && txDetail.meta) {
                  printKeyValue(
                    '    Fee',
                    `${lamportsToSol(txDetail.meta.fee)} SOL`,
                    0
                  );

                  // Show balance changes
                  if (txDetail.transaction.message.accountKeys.length > 0) {
                    const accountKeys = txDetail.transaction.message.accountKeys;
                    for (let j = 0; j < accountKeys.length; j++) {
                      const pre = txDetail.meta.preBalances[j] || 0;
                      const post = txDetail.meta.postBalances[j] || 0;
                      const diff = post - pre;
                      if (diff !== 0) {
                        const diffStr =
                          diff > 0
                            ? colors.success(`+${lamportsToSol(diff)}`)
                            : colors.error(lamportsToSol(diff));
                        console.log(
                          `      ${truncate(accountKeys[j], 20)}: ${diffStr} SOL`
                        );
                      }
                    }
                  }
                }
              } catch {
                // Skip detailed info if unavailable
              }

              println();
            }
          } else {
            // Table view
            const headers = ['Signature', 'Slot', 'Time', 'Status'];
            const rows = signatures.map((sig) => [
              truncate(sig.signature, 24),
              sig.slot.toString(),
              sig.blockTime
                ? new Date(sig.blockTime * 1000).toLocaleString()
                : 'N/A',
              sig.err ? colors.error('Failed') : colors.success('OK'),
            ]);

            printTable(headers, rows);
          }

          println();
          console.log(
            colors.muted(`  Showing ${signatures.length} of latest transactions`)
          );
          if (!options.verbose) {
            console.log(
              colors.muted('  Use --verbose for detailed transaction info')
            );
          }
          println();
        } catch (err: any) {
          sigSpinner.fail('Failed to fetch transaction history');
          throw err;
        }
      } catch (err: any) {
        printError(err.message);
        process.exit(1);
      }
    });
}
