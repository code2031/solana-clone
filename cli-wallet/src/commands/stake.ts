import { Command } from 'commander';
import ora from 'ora';
import bs58 from 'bs58';
import { createRpcClient } from '../lib/rpc-client';
import {
  loadDefaultKeypair,
  getPublicKeyBase58,
  base58ToPublicKey,
  generateKeypair,
  publicKeyToBase58,
} from '../lib/keypair';
import {
  buildAndSignTransaction,
  createAccountInstruction,
  createStakeInitializeInstruction,
  createStakeDelegateInstruction,
  createStakeDeactivateInstruction,
  createStakeWithdrawInstruction,
  STAKE_PROGRAM_ID,
} from '../lib/transaction';
import {
  printError,
  printSuccess,
  printKeyValue,
  printHeader,
  printWarning,
  formatSol,
  colors,
  println,
  lamportsToSol,
} from '../lib/display';

export function registerStakeCommand(program: Command): void {
  const stake = program
    .command('stake')
    .description('Staking operations');

  // ─── Delegate Stake ───────────────────────────────────────────────────

  stake
    .command('delegate <validator> <amount>')
    .description('Create a stake account and delegate to a validator')
    .action(async (validatorAddress: string, amountStr: string) => {
      try {
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) {
          printError('Amount must be a positive number (in SOL)');
          process.exit(1);
          return;
        }

        const lamports = BigInt(Math.round(amount * 1_000_000_000));
        const keypair = loadDefaultKeypair();
        const fromAddress = getPublicKeyBase58(keypair);
        const validatorPubkey = base58ToPublicKey(validatorAddress);

        // Generate new stake account keypair
        const stakeKeypair = generateKeypair();
        const stakeAddress = getPublicKeyBase58(stakeKeypair);

        printHeader('Delegate Stake');
        printKeyValue('From', colors.address(fromAddress));
        printKeyValue('Validator', colors.address(validatorAddress));
        printKeyValue('Stake Account', colors.address(stakeAddress));
        printKeyValue('Amount', formatSol(Number(lamports)));
        println();

        const rpc = createRpcClient();

        // Get rent exemption for stake account (200 bytes)
        const rentSpinner = ora('Calculating rent...').start();
        let rentExemption: number;
        try {
          rentExemption = await rpc.getMinimumBalanceForRentExemption(200);
          rentSpinner.stop();
        } catch (err: any) {
          rentSpinner.fail('Failed to get rent exemption');
          throw err;
        }

        const totalLamports = lamports + BigInt(rentExemption);

        // Get blockhash
        const bhResult = await rpc.getLatestBlockhash();
        const recentBlockhash = bhResult.value.blockhash;

        // Build transaction:
        // 1. Create stake account
        // 2. Initialize stake
        // 3. Delegate stake
        const createIx = createAccountInstruction(
          keypair.publicKey,
          stakeKeypair.publicKey,
          totalLamports,
          BigInt(200),
          STAKE_PROGRAM_ID
        );

        const initIx = createStakeInitializeInstruction(
          stakeKeypair.publicKey,
          keypair.publicKey, // staker
          keypair.publicKey  // withdrawer
        );

        const delegateIx = createStakeDelegateInstruction(
          stakeKeypair.publicKey,
          validatorPubkey,
          keypair.publicKey
        );

        const txBase64 = buildAndSignTransaction(
          {
            feePayer: keypair.publicKey,
            recentBlockhash,
            instructions: [createIx, initIx, delegateIx],
          },
          [keypair.secretKey, stakeKeypair.secretKey]
        );

        const sendSpinner = ora('Delegating stake...').start();
        try {
          const signature = await rpc.sendTransaction(txBase64);
          sendSpinner.succeed('Stake delegated');

          const confirmSpinner = ora('Confirming...').start();
          try {
            await rpc.confirmTransaction(signature);
            confirmSpinner.succeed('Confirmed');
          } catch {
            confirmSpinner.warn('Confirmation timed out');
          }

          printKeyValue('Signature', colors.primary(signature));
          println();
          printSuccess(
            `Delegated ${lamportsToSol(Number(lamports))} SOL to ${validatorAddress}`
          );
          printKeyValue('Stake Account', colors.address(stakeAddress));
          printWarning(
            'Save the stake account address above. You will need it to deactivate or withdraw.'
          );
        } catch (err: any) {
          sendSpinner.fail('Failed to delegate stake');
          throw err;
        }
      } catch (err: any) {
        printError(err.message);
        process.exit(1);
      }
    });

  // ─── Deactivate Stake ─────────────────────────────────────────────────

  stake
    .command('deactivate <stake-account>')
    .description('Deactivate a stake account')
    .action(async (stakeAccountAddress: string) => {
      try {
        const keypair = loadDefaultKeypair();
        const stakeAccountPubkey = base58ToPublicKey(stakeAccountAddress);

        printHeader('Deactivate Stake');
        printKeyValue('Stake Account', colors.address(stakeAccountAddress));
        println();

        const rpc = createRpcClient();
        const bhResult = await rpc.getLatestBlockhash();
        const recentBlockhash = bhResult.value.blockhash;

        const deactivateIx = createStakeDeactivateInstruction(
          stakeAccountPubkey,
          keypair.publicKey
        );

        const txBase64 = buildAndSignTransaction(
          {
            feePayer: keypair.publicKey,
            recentBlockhash,
            instructions: [deactivateIx],
          },
          [keypair.secretKey]
        );

        const sendSpinner = ora('Deactivating stake...').start();
        try {
          const signature = await rpc.sendTransaction(txBase64);
          sendSpinner.succeed('Stake deactivated');

          const confirmSpinner = ora('Confirming...').start();
          try {
            await rpc.confirmTransaction(signature);
            confirmSpinner.succeed('Confirmed');
          } catch {
            confirmSpinner.warn('Confirmation timed out');
          }

          printKeyValue('Signature', colors.primary(signature));
          println();
          printSuccess('Stake account deactivated');
          printWarning(
            'Stake will be fully deactivated at the end of the current epoch. ' +
              'You can then withdraw with: prism stake withdraw ' +
              stakeAccountAddress
          );
        } catch (err: any) {
          sendSpinner.fail('Failed to deactivate stake');
          throw err;
        }
      } catch (err: any) {
        printError(err.message);
        process.exit(1);
      }
    });

  // ─── Withdraw Stake ───────────────────────────────────────────────────

  stake
    .command('withdraw <stake-account>')
    .description('Withdraw SOL from a deactivated stake account')
    .option('--amount <sol>', 'Amount to withdraw (default: all)')
    .action(async (stakeAccountAddress: string, options) => {
      try {
        const keypair = loadDefaultKeypair();
        const fromAddress = getPublicKeyBase58(keypair);
        const stakeAccountPubkey = base58ToPublicKey(stakeAccountAddress);

        printHeader('Withdraw Stake');
        printKeyValue('Stake Account', colors.address(stakeAccountAddress));
        printKeyValue('Withdraw To', colors.address(fromAddress));
        println();

        const rpc = createRpcClient();

        // Get stake account balance
        const balSpinner = ora('Checking stake account balance...').start();
        let withdrawLamports: bigint;
        try {
          const balResult = await rpc.getBalance(stakeAccountAddress);
          balSpinner.stop();

          if (options.amount) {
            withdrawLamports = BigInt(
              Math.round(parseFloat(options.amount) * 1_000_000_000)
            );
            if (withdrawLamports > BigInt(balResult.value)) {
              printError(
                `Requested ${options.amount} SOL but stake account only has ${lamportsToSol(balResult.value)} SOL`
              );
              process.exit(1);
              return;
            }
          } else {
            withdrawLamports = BigInt(balResult.value);
          }

          printKeyValue('Withdraw Amount', formatSol(Number(withdrawLamports)));
        } catch (err: any) {
          balSpinner.fail('Failed to check balance');
          throw err;
        }

        const bhResult = await rpc.getLatestBlockhash();
        const recentBlockhash = bhResult.value.blockhash;

        const withdrawIx = createStakeWithdrawInstruction(
          stakeAccountPubkey,
          keypair.publicKey,
          keypair.publicKey,
          withdrawLamports
        );

        const txBase64 = buildAndSignTransaction(
          {
            feePayer: keypair.publicKey,
            recentBlockhash,
            instructions: [withdrawIx],
          },
          [keypair.secretKey]
        );

        const sendSpinner = ora('Withdrawing stake...').start();
        try {
          const signature = await rpc.sendTransaction(txBase64);
          sendSpinner.succeed('Stake withdrawn');

          const confirmSpinner = ora('Confirming...').start();
          try {
            await rpc.confirmTransaction(signature);
            confirmSpinner.succeed('Confirmed');
          } catch {
            confirmSpinner.warn('Confirmation timed out');
          }

          printKeyValue('Signature', colors.primary(signature));
          println();
          printSuccess(
            `Withdrew ${lamportsToSol(Number(withdrawLamports))} SOL from stake account`
          );
        } catch (err: any) {
          sendSpinner.fail('Failed to withdraw stake');
          throw err;
        }
      } catch (err: any) {
        printError(err.message);
        process.exit(1);
      }
    });
}
