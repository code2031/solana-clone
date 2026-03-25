import { Command } from 'commander';
import * as qrcode from 'qrcode-terminal';
import {
  loadDefaultKeypair,
  loadKeypairFromFile,
  getPublicKeyBase58,
} from '../lib/keypair';
import {
  printError,
  printKeyValue,
  printHeader,
  println,
  colors,
} from '../lib/display';

export function registerAddressCommand(program: Command): void {
  program
    .command('address')
    .description('Display your wallet address with QR code')
    .option('-k, --keypair <path>', 'Path to keypair file')
    .option('--no-qr', 'Skip QR code display')
    .action(async (options) => {
      try {
        const keypair = options.keypair
          ? loadKeypairFromFile(options.keypair)
          : loadDefaultKeypair();
        const address = getPublicKeyBase58(keypair);

        printHeader('Your Wallet Address');
        printKeyValue('Address', colors.address(address));
        println();

        if (options.qr !== false) {
          console.log(colors.muted('  QR Code (scan to get address):'));
          println();

          qrcode.generate(address, { small: true }, (code: string) => {
            const indented = code
              .split('\n')
              .map((line: string) => '    ' + line)
              .join('\n');
            console.log(indented);
          });

          println();
        }

        console.log(
          colors.muted('  Share this address to receive SOL or tokens.')
        );
        println();
      } catch (err: any) {
        printError(err.message);
        if (err.message.includes('not found')) {
          console.log(
            `  Generate a keypair first with: ${colors.primary('prism keygen')}`
          );
        }
        process.exit(1);
      }
    });
}
