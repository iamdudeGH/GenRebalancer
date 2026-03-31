#!/bin/bash
# Deploy GenRebalancer to Bradbury testnet
echo "Deploying GenRebalancer..."

# Use the genlayer CLI to deploy the contract
genlayer deploy --contract contracts/GenRebalancer.py
