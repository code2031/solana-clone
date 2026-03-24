# =============================================================================
# SolClone Validator Infrastructure — Terraform Configuration
#
# Provisions a production-ready validator node on AWS with:
#   - r6a.8xlarge EC2 instance (256 GB RAM, 32 vCPU)
#   - 2 TB gp3 SSD (16,000 IOPS, 1,000 MB/s throughput)
#   - Security group with validator-required ports
#   - Elastic IP for stable public address
#   - User data script for automated validator installation
# =============================================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "solclone-terraform-state"
    key            = "validators/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "solclone-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "SolClone"
      Component   = "Validator"
      Environment = var.cluster
      ManagedBy   = "Terraform"
    }
  }
}

# =============================================================================
# Data Sources
# =============================================================================

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

# =============================================================================
# Networking
# =============================================================================

resource "aws_vpc" "validator" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "solclone-validator-vpc-${var.cluster}"
  }
}

resource "aws_subnet" "validator" {
  vpc_id                  = aws_vpc.validator.id
  cidr_block              = var.subnet_cidr
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name = "solclone-validator-subnet-${var.cluster}"
  }
}

resource "aws_internet_gateway" "validator" {
  vpc_id = aws_vpc.validator.id

  tags = {
    Name = "solclone-validator-igw-${var.cluster}"
  }
}

resource "aws_route_table" "validator" {
  vpc_id = aws_vpc.validator.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.validator.id
  }

  tags = {
    Name = "solclone-validator-rt-${var.cluster}"
  }
}

resource "aws_route_table_association" "validator" {
  subnet_id      = aws_subnet.validator.id
  route_table_id = aws_route_table.validator.id
}

# =============================================================================
# Security Group
# =============================================================================

resource "aws_security_group" "validator" {
  name_prefix = "solclone-validator-${var.cluster}-"
  description = "Security group for SolClone ${var.cluster} validator"
  vpc_id      = aws_vpc.validator.id

  # SSH
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.ssh_allowed_cidrs
  }

  # Gossip, Turbine, Repair — TCP
  ingress {
    description = "SolClone Gossip/Repair TCP"
    from_port   = 8000
    to_port     = 8020
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Gossip, Turbine, Repair — UDP
  ingress {
    description = "SolClone Gossip/Turbine/Repair UDP"
    from_port   = 8000
    to_port     = 8020
    protocol    = "udp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # JSON-RPC (optional, controlled by variable)
  dynamic "ingress" {
    for_each = var.enable_rpc ? [1] : []
    content {
      description = "SolClone JSON-RPC"
      from_port   = 8899
      to_port     = 8899
      protocol    = "tcp"
      cidr_blocks = var.rpc_allowed_cidrs
    }
  }

  # WebSocket RPC (optional)
  dynamic "ingress" {
    for_each = var.enable_rpc ? [1] : []
    content {
      description = "SolClone WebSocket RPC"
      from_port   = 8900
      to_port     = 8900
      protocol    = "tcp"
      cidr_blocks = var.rpc_allowed_cidrs
    }
  }

  # Metrics (Prometheus)
  dynamic "ingress" {
    for_each = var.enable_metrics ? [1] : []
    content {
      description = "Prometheus metrics"
      from_port   = 9125
      to_port     = 9125
      protocol    = "tcp"
      cidr_blocks = var.monitoring_cidrs
    }
  }

  # All outbound
  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "solclone-validator-sg-${var.cluster}"
  }
}

# =============================================================================
# EC2 Instance
# =============================================================================

resource "aws_instance" "validator" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = var.key_pair_name
  subnet_id              = aws_subnet.validator.id
  vpc_security_group_ids = [aws_security_group.validator.id]

  # Disable source/dest check for direct networking
  source_dest_check = false

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 100
    throughput            = 250
    iops                  = 3000
    encrypted             = true
    delete_on_termination = true

    tags = {
      Name = "solclone-validator-root-${var.cluster}"
    }
  }

  # Validator ledger/accounts storage
  ebs_block_device {
    device_name           = "/dev/sdf"
    volume_type           = var.data_volume_type
    volume_size           = var.data_volume_size
    iops                  = var.data_volume_iops
    throughput            = var.data_volume_throughput
    encrypted             = true
    delete_on_termination = false

    tags = {
      Name = "solclone-validator-data-${var.cluster}"
    }
  }

  # Enable detailed monitoring
  monitoring = true

  # Use IMDSv2
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  user_data = base64encode(templatefile("${path.module}/userdata.sh.tpl", {
    cluster         = var.cluster
    validator_name  = var.validator_name
    solclone_version = var.solclone_version
    entrypoint      = var.entrypoint
    genesis_hash    = var.expected_genesis_hash
  }))

  tags = {
    Name = "solclone-validator-${var.validator_name}-${var.cluster}"
  }

  lifecycle {
    ignore_changes = [ami, user_data]
  }
}

# =============================================================================
# Elastic IP
# =============================================================================

resource "aws_eip" "validator" {
  domain = "vpc"

  tags = {
    Name = "solclone-validator-eip-${var.validator_name}-${var.cluster}"
  }
}

resource "aws_eip_association" "validator" {
  instance_id   = aws_instance.validator.id
  allocation_id = aws_eip.validator.id
}

# =============================================================================
# CloudWatch Alarms
# =============================================================================

resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "solclone-validator-${var.validator_name}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 90
  alarm_description   = "Validator CPU utilization exceeded 90% for 15 minutes"
  alarm_actions       = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  dimensions = {
    InstanceId = aws_instance.validator.id
  }

  tags = {
    Name = "solclone-validator-cpu-alarm-${var.cluster}"
  }
}

resource "aws_cloudwatch_metric_alarm" "disk_read_ops" {
  alarm_name          = "solclone-validator-${var.validator_name}-disk-iops"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "VolumeReadOps"
  namespace           = "AWS/EBS"
  period              = 300
  statistic           = "Sum"
  threshold           = 15000
  alarm_description   = "Data volume IOPS approaching provisioned limit"
  alarm_actions       = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  dimensions = {
    VolumeId = aws_instance.validator.ebs_block_device[*].volume_id[0]
  }

  tags = {
    Name = "solclone-validator-disk-alarm-${var.cluster}"
  }
}

resource "aws_cloudwatch_metric_alarm" "status_check" {
  alarm_name          = "solclone-validator-${var.validator_name}-status"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "StatusCheckFailed"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Maximum"
  threshold           = 0
  alarm_description   = "Validator instance status check failed"
  alarm_actions       = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  dimensions = {
    InstanceId = aws_instance.validator.id
  }

  tags = {
    Name = "solclone-validator-status-alarm-${var.cluster}"
  }
}

# =============================================================================
# Outputs
# =============================================================================

output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.validator.id
}

output "public_ip" {
  description = "Elastic IP address of the validator"
  value       = aws_eip.validator.public_ip
}

output "private_ip" {
  description = "Private IP address of the validator"
  value       = aws_instance.validator.private_ip
}

output "security_group_id" {
  description = "Security group ID"
  value       = aws_security_group.validator.id
}

output "ssh_command" {
  description = "SSH command to connect to the validator"
  value       = "ssh -i ~/.ssh/${var.key_pair_name}.pem ubuntu@${aws_eip.validator.public_ip}"
}

output "gossip_address" {
  description = "Gossip entrypoint address for other validators"
  value       = "${aws_eip.validator.public_ip}:8001"
}

output "rpc_url" {
  description = "RPC endpoint URL"
  value       = var.enable_rpc ? "http://${aws_eip.validator.public_ip}:8899" : "RPC not enabled"
}
