export type Severity = "Critical" | "High" | "Medium" | "Low" | "Info";

export interface AuditFinding {
  severity: Severity;
  title: string;
  description: string;
  line: number;
  suggestion: string;
}

export interface AuditResult {
  findings: AuditFinding[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    total: number;
    score: number;
  };
}

interface Rule {
  id: string;
  severity: Severity;
  title: string;
  pattern: RegExp;
  description: string;
  suggestion: string;
  antiPattern?: RegExp;
}

const AUDIT_RULES: Rule[] = [
  {
    id: "missing-signer",
    severity: "Critical",
    title: "Missing Signer Check",
    pattern: /pub\s+(\w+)\s*:\s*(?:AccountInfo|UncheckedAccount)/g,
    description: "Account declared without Signer constraint. An attacker could pass any account, performing unauthorized operations.",
    suggestion: "Add the Signer constraint or use #[account(signer)] to validate the account signed the transaction.",
    antiPattern: /Signer|#\[account\(.*signer.*\)\]/,
  },
  {
    id: "missing-owner-check",
    severity: "Critical",
    title: "Missing Owner Check",
    pattern: /pub\s+(\w+)\s*:\s*AccountInfo/g,
    description: "Account used without verifying its owner. An attacker could pass a fake account owned by a different program.",
    suggestion: "Add owner check using #[account(owner = program_id)] or validate account.owner in instruction logic.",
    antiPattern: /owner\s*=|has_one|constraint\s*=.*owner/,
  },
  {
    id: "unchecked-arithmetic",
    severity: "High",
    title: "Unchecked Arithmetic Operation",
    pattern: /(\w+)\s*[\+\-\*]\s*(\w+)/g,
    description: "Arithmetic without overflow/underflow protection. Could lead to unexpected behavior or exploits.",
    suggestion: "Use checked_add(), checked_sub(), checked_mul(), or checked_div() to prevent overflow/underflow.",
    antiPattern: /checked_add|checked_sub|checked_mul|checked_div|saturating_/,
  },
  {
    id: "hardcoded-address",
    severity: "Medium",
    title: "Hardcoded Address Detected",
    pattern: /Pubkey::from_str\s*\(\s*"[1-9A-HJ-NP-Za-km-z]{32,44}"\s*\)/g,
    description: "Hardcoded public key found. Reduces flexibility and could be problematic if the key needs updating.",
    suggestion: "Use a configurable account or PDA instead. Consider storing keys in a config account.",
  },
  {
    id: "missing-close",
    severity: "Medium",
    title: "Missing Account Close (Rent Recovery)",
    pattern: /init\s*,/g,
    description: "Account initialized but no corresponding close instruction. Prevents recovery of rent-exempt SOL.",
    suggestion: "Implement a close instruction using #[account(close = recipient)] for rent recovery.",
    antiPattern: /close\s*=/,
  },
  {
    id: "unwrap-usage",
    severity: "High",
    title: "Unsafe unwrap() Usage",
    pattern: /\.unwrap\(\)/g,
    description: "unwrap() will panic on None/Err, crashing the program. Could be exploited for denial of service.",
    suggestion: "Replace unwrap() with match, if let, or the ? operator with custom error types.",
  },
  {
    id: "unused-account",
    severity: "Low",
    title: "Potentially Unused Account in Instruction",
    pattern: /\/\/\/\s*CHECK:\s*This account is not read or written/g,
    description: "Account marked as unused. Unused accounts increase transaction size and cost.",
    suggestion: "Remove unused accounts or document why the account is required.",
  },
  {
    id: "pda-seed-collision",
    severity: "High",
    title: "Potential PDA Seed Collision",
    pattern: /seeds\s*=\s*\[\s*b"(\w+)"\s*\]/g,
    description: "PDA uses a single static seed without unique identifiers. Multiple PDAs could collide.",
    suggestion: "Include unique identifiers in PDA seeds (user pubkey, counter, or timestamp).",
  },
  {
    id: "missing-lamport-check",
    severity: "Medium",
    title: "Missing Lamport Balance Check",
    pattern: /token::transfer|invoke_signed|system_instruction/g,
    description: "SOL transfer without explicit lamport balance verification. Insufficient balance could cause failures.",
    suggestion: "Check lamport balance before transfer: require!(account.lamports() >= amount, Error::InsufficientFunds).",
    antiPattern: /lamports\(\)\s*>=|lamports\(\)\s*>/,
  },
  {
    id: "no-access-control",
    severity: "Critical",
    title: "Missing Access Control",
    pattern: /pub\s+fn\s+(\w+)\s*\(/g,
    description: "Public function without visible access control. Ensure only authorized users can call sensitive instructions.",
    suggestion: "Add access control: verify the signer is the expected authority using has_one or constraint checks.",
    antiPattern: /require!|has_one|constraint|authority.*Signer|admin.*Signer|#\[access_control/,
  },
  {
    id: "type-cosplay",
    severity: "High",
    title: "Potential Type Cosplay Vulnerability",
    pattern: /AccountInfo<'info>/g,
    description: "Using raw AccountInfo without type checking. An attacker could pass an account of the wrong type.",
    suggestion: "Use typed Account<T> wrappers. Add discriminator checks if manual deserialization is needed.",
  },
  {
    id: "missing-rent-exempt",
    severity: "Low",
    title: "Missing Rent Exemption Check",
    pattern: /init\s*,\s*payer/g,
    description: "Account initialization found. Ensure allocated space is sufficient for rent exemption.",
    suggestion: "Verify space includes 8 bytes for Anchor discriminator: space = 8 + YourStruct::INIT_SPACE.",
    antiPattern: /INIT_SPACE|space\s*=\s*8\s*\+/,
  },
];

function findLineNumber(code: string, index: number): number {
  return code.substring(0, index).split("\n").length;
}

function checkAntiPattern(code: string, matchIndex: number, antiPattern: RegExp, windowSize: number = 200): boolean {
  const start = Math.max(0, matchIndex - windowSize);
  const end = Math.min(code.length, matchIndex + windowSize);
  const context = code.substring(start, end);
  return antiPattern.test(context);
}

export function auditCode(code: string): AuditResult {
  const findings: AuditFinding[] = [];
  const lines = code.split("\n");

  for (const rule of AUDIT_RULES) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(code)) !== null) {
      if (rule.antiPattern && checkAntiPattern(code, match.index, rule.antiPattern)) {
        continue;
      }

      const lineNum = findLineNumber(code, match.index);
      const lineContent = lines[lineNum - 1] || "";
      if (lineContent.trim().startsWith("//") || lineContent.trim().startsWith("*") || lineContent.trim().startsWith("/*")) {
        continue;
      }

      const existing = findings.find((f) => f.line === lineNum && f.title === rule.title);
      if (existing) continue;

      findings.push({
        severity: rule.severity,
        title: rule.title,
        description: rule.description,
        line: lineNum,
        suggestion: rule.suggestion,
      });
    }
  }

  const severityOrder: Record<Severity, number> = {
    Critical: 0, High: 1, Medium: 2, Low: 3, Info: 4,
  };
  findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity] || a.line - b.line);

  const summary = {
    critical: findings.filter((f) => f.severity === "Critical").length,
    high: findings.filter((f) => f.severity === "High").length,
    medium: findings.filter((f) => f.severity === "Medium").length,
    low: findings.filter((f) => f.severity === "Low").length,
    info: findings.filter((f) => f.severity === "Info").length,
    total: findings.length,
    score: 100,
  };

  summary.score -= summary.critical * 20;
  summary.score -= summary.high * 10;
  summary.score -= summary.medium * 5;
  summary.score -= summary.low * 2;
  summary.score -= summary.info * 1;
  summary.score = Math.max(0, Math.min(100, summary.score));

  return { findings, summary };
}

export const EXAMPLE_CODE = `use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod vulnerable_token_vault {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, vault_bump: u8) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.authority = ctx.accounts.authority.key();
        vault.token_account = ctx.accounts.token_account.key();
        vault.bump = vault_bump;
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token.to_account_info(),
                to: ctx.accounts.vault_token.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, amount)?;

        let vault = &mut ctx.accounts.vault;
        vault.total_deposits = vault.total_deposits + amount;

        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let vault = &ctx.accounts.vault;
        let seeds = &[b"vault", &[vault.bump]];
        let signer_seeds = &[&seeds[..]];

        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault_token.to_account_info(),
                to: ctx.accounts.user_token.to_account_info(),
                authority: ctx.accounts.vault.to_account_info(),
            },
            signer_seeds,
        );
        token::transfer(transfer_ctx, amount)?;

        let vault = &mut ctx.accounts.vault;
        vault.total_deposits = vault.total_deposits - amount;

        Ok(())
    }

    pub fn emergency_drain(ctx: Context<EmergencyDrain>) -> Result<()> {
        let balance = ctx.accounts.vault_token.amount;
        let vault = &ctx.accounts.vault;
        let seeds = &[b"vault", &[vault.bump]];
        let signer_seeds = &[&seeds[..]];

        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault_token.to_account_info(),
                to: ctx.accounts.drain_to.to_account_info(),
                authority: ctx.accounts.vault.to_account_info(),
            },
            signer_seeds,
        );
        token::transfer(transfer_ctx, balance)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Vault::INIT_SPACE,
        seeds = [b"vault"],
        bump
    )]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_account: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub user_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault_token: Account<'info, TokenAccount>,
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub vault_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_token: Account<'info, TokenAccount>,
    /// CHECK: This account is not read or written
    pub user: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct EmergencyDrain<'info> {
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub vault_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub drain_to: Account<'info, TokenAccount>,
    pub authority: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
}

#[account]
#[derive(InitSpace)]
pub struct Vault {
    pub authority: Pubkey,
    pub token_account: Pubkey,
    pub total_deposits: u64,
    pub bump: u8,
}`;
