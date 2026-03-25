use anchor_lang::prelude::*;

declare_id!("VotingProg1111111111111111111111111111111111");

pub const MAX_OPTIONS: usize = 10;
pub const MAX_TITLE_LEN: usize = 64;
pub const MAX_DESCRIPTION_LEN: usize = 256;
pub const MAX_OPTION_LABEL_LEN: usize = 32;

#[program]
pub mod prism_voting {
    use super::*;

    /// Create a new proposal with a title, description, and voting options.
    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        proposal_id: u64,
        title: String,
        description: String,
        options: Vec<String>,
        voting_ends_at: i64,
    ) -> Result<()> {
        require!(title.len() <= MAX_TITLE_LEN, VotingError::TitleTooLong);
        require!(
            description.len() <= MAX_DESCRIPTION_LEN,
            VotingError::DescriptionTooLong
        );
        require!(!options.is_empty(), VotingError::NoOptions);
        require!(options.len() <= MAX_OPTIONS, VotingError::TooManyOptions);
        for opt in &options {
            require!(opt.len() <= MAX_OPTION_LABEL_LEN, VotingError::OptionLabelTooLong);
        }

        let clock = Clock::get()?;
        require!(
            voting_ends_at > clock.unix_timestamp,
            VotingError::InvalidEndTime
        );

        let proposal = &mut ctx.accounts.proposal;
        proposal.authority = ctx.accounts.authority.key();
        proposal.proposal_id = proposal_id;
        proposal.title = title.clone();
        proposal.description = description;
        proposal.options = options.clone();
        proposal.vote_counts = vec![0u64; options.len()];
        proposal.total_votes = 0;
        proposal.voting_ends_at = voting_ends_at;
        proposal.is_finalized = false;
        proposal.winning_option = None;
        proposal.bump = ctx.bumps.proposal;

        msg!(
            "Proposal '{}' created with {} options, voting ends at {}",
            title,
            options.len(),
            voting_ends_at
        );
        Ok(())
    }

    /// Cast a vote for a specific option with a given weight.
    pub fn cast_vote(
        ctx: Context<CastVote>,
        option_index: u8,
        weight: u64,
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        require!(!proposal.is_finalized, VotingError::ProposalFinalized);

        let clock = Clock::get()?;
        require!(
            clock.unix_timestamp < proposal.voting_ends_at,
            VotingError::VotingEnded
        );

        let idx = option_index as usize;
        require!(idx < proposal.options.len(), VotingError::InvalidOption);
        require!(weight > 0, VotingError::InvalidWeight);

        // Record the voter's ballot
        let ballot = &mut ctx.accounts.ballot;
        require!(!ballot.has_voted, VotingError::AlreadyVoted);

        ballot.voter = ctx.accounts.voter.key();
        ballot.proposal = proposal.key();
        ballot.option_index = option_index;
        ballot.weight = weight;
        ballot.has_voted = true;
        ballot.voted_at = clock.unix_timestamp;
        ballot.bump = ctx.bumps.ballot;

        // Update proposal tallies
        proposal.vote_counts[idx] = proposal.vote_counts[idx]
            .checked_add(weight)
            .ok_or(VotingError::Overflow)?;
        proposal.total_votes = proposal
            .total_votes
            .checked_add(weight)
            .ok_or(VotingError::Overflow)?;

        msg!(
            "Vote cast: option {} ('{}') with weight {}",
            option_index,
            proposal.options[idx],
            weight
        );
        Ok(())
    }

    /// Finalize the proposal: count votes and determine the winner.
    pub fn finalize(ctx: Context<Finalize>) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        require!(!proposal.is_finalized, VotingError::ProposalFinalized);

        let clock = Clock::get()?;
        require!(
            clock.unix_timestamp >= proposal.voting_ends_at,
            VotingError::VotingNotEnded
        );

        // Determine the winning option (highest vote count)
        let mut max_votes: u64 = 0;
        let mut winner: Option<u8> = None;

        for (i, &count) in proposal.vote_counts.iter().enumerate() {
            if count > max_votes {
                max_votes = count;
                winner = Some(i as u8);
            }
        }

        proposal.is_finalized = true;
        proposal.winning_option = winner;

        match winner {
            Some(idx) => msg!(
                "Proposal '{}' finalized. Winner: option {} ('{}') with {} votes",
                proposal.title,
                idx,
                proposal.options[idx as usize],
                max_votes
            ),
            None => msg!(
                "Proposal '{}' finalized with no votes cast",
                proposal.title
            ),
        }

        Ok(())
    }
}

// ─── Account Structs ─────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(proposal_id: u64)]
pub struct CreateProposal<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Proposal::SPACE,
        seeds = [b"proposal", authority.key().as_ref(), &proposal_id.to_le_bytes()],
        bump
    )]
    pub proposal: Account<'info, Proposal>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(
        mut,
        seeds = [b"proposal", proposal.authority.as_ref(), &proposal.proposal_id.to_le_bytes()],
        bump = proposal.bump
    )]
    pub proposal: Account<'info, Proposal>,
    #[account(
        init,
        payer = voter,
        space = 8 + Ballot::SPACE,
        seeds = [b"ballot", proposal.key().as_ref(), voter.key().as_ref()],
        bump
    )]
    pub ballot: Account<'info, Ballot>,
    #[account(mut)]
    pub voter: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Finalize<'info> {
    #[account(
        mut,
        has_one = authority @ VotingError::Unauthorized,
        seeds = [b"proposal", authority.key().as_ref(), &proposal.proposal_id.to_le_bytes()],
        bump = proposal.bump
    )]
    pub proposal: Account<'info, Proposal>,
    pub authority: Signer<'info>,
}

// ─── State ───────────────────────────────────────────────────────────────────

#[account]
pub struct Proposal {
    pub authority: Pubkey,               // 32
    pub proposal_id: u64,               // 8
    pub title: String,                   // 4 + 64
    pub description: String,             // 4 + 256
    pub options: Vec<String>,            // 4 + (10 * (4 + 32))
    pub vote_counts: Vec<u64>,           // 4 + (10 * 8)
    pub total_votes: u64,                // 8
    pub voting_ends_at: i64,             // 8
    pub is_finalized: bool,              // 1
    pub winning_option: Option<u8>,      // 1 + 1
    pub bump: u8,                        // 1
}

impl Proposal {
    pub const SPACE: usize = 32 + 8 + (4 + 64) + (4 + 256) + (4 + MAX_OPTIONS * (4 + MAX_OPTION_LABEL_LEN))
        + (4 + MAX_OPTIONS * 8) + 8 + 8 + 1 + 2 + 1;
}

#[account]
pub struct Ballot {
    pub voter: Pubkey,           // 32
    pub proposal: Pubkey,        // 32
    pub option_index: u8,        // 1
    pub weight: u64,             // 8
    pub has_voted: bool,         // 1
    pub voted_at: i64,           // 8
    pub bump: u8,                // 1
}

impl Ballot {
    pub const SPACE: usize = 32 + 32 + 1 + 8 + 1 + 8 + 1;
}

// ─── Errors ──────────────────────────────────────────────────────────────────

#[error_code]
pub enum VotingError {
    #[msg("Title exceeds 64 characters")]
    TitleTooLong,
    #[msg("Description exceeds 256 characters")]
    DescriptionTooLong,
    #[msg("Option label exceeds 32 characters")]
    OptionLabelTooLong,
    #[msg("At least one option is required")]
    NoOptions,
    #[msg("Maximum of 10 options allowed")]
    TooManyOptions,
    #[msg("End time must be in the future")]
    InvalidEndTime,
    #[msg("Invalid option index")]
    InvalidOption,
    #[msg("Vote weight must be greater than zero")]
    InvalidWeight,
    #[msg("Already voted on this proposal")]
    AlreadyVoted,
    #[msg("Voting period has ended")]
    VotingEnded,
    #[msg("Voting period has not ended yet")]
    VotingNotEnded,
    #[msg("Proposal has already been finalized")]
    ProposalFinalized,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Arithmetic overflow")]
    Overflow,
}
