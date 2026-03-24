# =============================================================================
# SolClone Validator Infrastructure — Terraform Variables
# =============================================================================

# -----------------------------------------------------------------------------
# General
# -----------------------------------------------------------------------------

variable "cluster" {
  description = "SolClone cluster: devnet, testnet, or mainnet"
  type        = string
  default     = "mainnet"

  validation {
    condition     = contains(["devnet", "testnet", "mainnet"], var.cluster)
    error_message = "Cluster must be one of: devnet, testnet, mainnet."
  }
}

variable "validator_name" {
  description = "Friendly name for this validator (used in resource naming and tags)"
  type        = string
  default     = "validator-01"

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]{0,30}[a-z0-9]$", var.validator_name))
    error_message = "Validator name must be lowercase alphanumeric with hyphens, 2-32 characters."
  }
}

variable "solclone_version" {
  description = "SolClone release version to install (e.g., 1.0.0)"
  type        = string
  default     = "1.0.0"
}

# -----------------------------------------------------------------------------
# AWS Region and Networking
# -----------------------------------------------------------------------------

variable "aws_region" {
  description = "AWS region for the validator infrastructure"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "CIDR block for the validator VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "subnet_cidr" {
  description = "CIDR block for the validator subnet"
  type        = string
  default     = "10.0.1.0/24"
}

# -----------------------------------------------------------------------------
# EC2 Instance
# -----------------------------------------------------------------------------

variable "instance_type" {
  description = "EC2 instance type for the validator (minimum r6a.8xlarge for 256GB RAM, 32 vCPU)"
  type        = string
  default     = "r6a.8xlarge"
}

variable "key_pair_name" {
  description = "Name of the AWS key pair for SSH access"
  type        = string
}

variable "ssh_allowed_cidrs" {
  description = "CIDR blocks allowed to SSH into the validator"
  type        = list(string)
  default     = []

  validation {
    condition     = length(var.ssh_allowed_cidrs) > 0
    error_message = "At least one SSH allowed CIDR must be specified."
  }
}

# -----------------------------------------------------------------------------
# Data Volume (Ledger/Accounts Storage)
# -----------------------------------------------------------------------------

variable "data_volume_type" {
  description = "EBS volume type for the data volume"
  type        = string
  default     = "gp3"

  validation {
    condition     = contains(["gp3", "io2"], var.data_volume_type)
    error_message = "Data volume type must be gp3 or io2."
  }
}

variable "data_volume_size" {
  description = "Size of the data volume in GB"
  type        = number
  default     = 2000

  validation {
    condition     = var.data_volume_size >= 1000
    error_message = "Data volume must be at least 1000 GB."
  }
}

variable "data_volume_iops" {
  description = "Provisioned IOPS for the data volume"
  type        = number
  default     = 16000

  validation {
    condition     = var.data_volume_iops >= 3000
    error_message = "Data volume IOPS must be at least 3000."
  }
}

variable "data_volume_throughput" {
  description = "Provisioned throughput in MB/s for gp3 volumes"
  type        = number
  default     = 1000

  validation {
    condition     = var.data_volume_throughput >= 125
    error_message = "Data volume throughput must be at least 125 MB/s."
  }
}

# -----------------------------------------------------------------------------
# SolClone Network Configuration
# -----------------------------------------------------------------------------

variable "entrypoint" {
  description = "Gossip entrypoint for joining the network (host:port)"
  type        = string
  default     = ""
}

variable "expected_genesis_hash" {
  description = "Expected genesis hash for the target cluster"
  type        = string
  default     = ""
}

# -----------------------------------------------------------------------------
# RPC Configuration
# -----------------------------------------------------------------------------

variable "enable_rpc" {
  description = "Whether to expose the JSON-RPC and WebSocket ports"
  type        = bool
  default     = false
}

variable "rpc_allowed_cidrs" {
  description = "CIDR blocks allowed to access the RPC endpoint"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

# -----------------------------------------------------------------------------
# Monitoring
# -----------------------------------------------------------------------------

variable "enable_metrics" {
  description = "Whether to expose the Prometheus metrics port"
  type        = bool
  default     = true
}

variable "monitoring_cidrs" {
  description = "CIDR blocks allowed to scrape metrics"
  type        = list(string)
  default     = ["10.0.0.0/8"]
}

variable "alarm_sns_topic_arn" {
  description = "SNS topic ARN for CloudWatch alarm notifications (empty to disable)"
  type        = string
  default     = ""
}
