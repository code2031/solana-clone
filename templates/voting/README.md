# Prism Voting Template

An on-chain governance voting program built with the Anchor framework for the Prism blockchain. Supports proposals with multiple options, weighted voting, and automatic finalization.

## Features

- **create_proposal** - Create a proposal with title, description, up to 10 options, and a voting deadline
- **cast_vote** - Cast a weighted vote for a specific option (one vote per wallet)
- **finalize** - After voting ends, count votes and determine the winning option

## Usage

```bash
# Initialize from template
prism init my-dao --template voting

# Build
anchor build

# Test
anchor test

# Deploy
anchor deploy
```

## Account Structure

- `Proposal` - Stores proposal metadata, options, vote tallies, and finalization state
  - PDA seeds: `["proposal", authority, proposal_id]`
- `Ballot` - Per-voter record preventing double voting
  - PDA seeds: `["ballot", proposal_key, voter_key]`

## Error Handling

| Error | Description |
|-------|-------------|
| `TitleTooLong` | Title exceeds 64 characters |
| `DescriptionTooLong` | Description exceeds 256 characters |
| `NoOptions` | At least one option required |
| `TooManyOptions` | Maximum 10 options per proposal |
| `AlreadyVoted` | Wallet has already voted |
| `VotingEnded` | Voting period has passed |
| `VotingNotEnded` | Cannot finalize before deadline |
| `ProposalFinalized` | Already finalized |
