# v0.1.0
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json

class GenRebalancer(gl.Contract):
    # Constitution State Variables
    owner: Address              # DAO governor / deployer
    treasury_address: Address   # Gnosis Safe or multisig to receive rebalance signals
    risk_tolerance_pct: u256    # Threshold for risk_score as integer percentage (e.g. 70 = 0.70)
    speed_limit: u256           # Max percentage of holdings to sell per heartbeat
    protection_slippage: u256   # Acceptable slippage in BP (e.g. 200 = 2%)
    audit_logs: DynArray[str]   # History of executed operations

    def __init__(self, risk_tolerance_pct: int = 70, speed_limit: int = 25, protection_slippage: int = 200):
        self.owner = gl.message.sender_address
        self.treasury_address = gl.message.sender_address  # defaults to deployer; update via set_treasury
        self.risk_tolerance_pct = u256(risk_tolerance_pct)
        self.speed_limit = u256(speed_limit)
        self.protection_slippage = u256(protection_slippage)

    @gl.public.view
    def get_constitution(self) -> str:
        return json.dumps({
            "risk_tolerance": int(self.risk_tolerance_pct) / 100.0,
            "risk_tolerance_pct": int(self.risk_tolerance_pct),
            "speed_limit": int(self.speed_limit),
            "protection_slippage": int(self.protection_slippage),
            "owner": str(self.owner),
            "treasury": str(self.treasury_address)
        })

    @gl.public.view
    def get_audit_logs(self) -> str:
        return json.dumps(list(self.audit_logs))

    @gl.public.write
    def set_treasury(self, new_treasury: Address) -> None:
        """Owner can point the contract at a new Gnosis Safe / multisig treasury."""
        assert gl.message.sender_address == self.owner, "Only owner can set treasury"
        self.treasury_address = new_treasury


    @gl.public.write
    def update_constitution(self, risk_tolerance_pct: int, speed_limit: int, protection_slippage: int) -> None:
        """Only the owner (DAO governor) can update risk limits."""
        assert gl.message.sender_address == self.owner, "Only owner can update constitution"
        self.risk_tolerance_pct = u256(risk_tolerance_pct)
        self.speed_limit = u256(speed_limit)
        self.protection_slippage = u256(protection_slippage)


    @gl.public.write
    def heartbeat(
        self,
        coingecko_url: str = "https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=1&interval=daily", # Use historical/fixed URL for tests to prevent validator disagreement on live fast-changing data
        fng_url: str = "https://api.alternative.me/fng/",
        coindesk_rss: str = "https://www.coindesk.com/arc/outboundfeeds/rss/"
    ) -> str:
        """
        Fetches market context from multiple sources and triggers AI consensus 
        to decide whether to authorize a risk mitigation trade.
        """
        risk_limit = int(self.risk_tolerance_pct) / 100.0

        def run_analysis() -> str:
            fng_data = ""
            try:
                fng_data = gl.nondet.web.render("https://api.alternative.me/fng/", mode="text")
            except Exception as e:
                fng_data = f"Failed: {str(e)}"

            prompt = f"""
You are a DAO treasury risk analyst.
Fear & Greed Index data: {fng_data[:300]}

Return ONLY raw JSON, no markdown:
{{
  "risk_score": <float 0.0 to 1.0, derived from the Fear & Greed value>,
  "market_signal": "<SAFE | CAUTION | CRITICAL>",
  "authorize_trade": <boolean, true only if risk_score > {risk_limit}>,
  "reasoning": "<one sentence max>",
  "data_timestamp": "<from the data or N/A>"
}}
"""
            result = gl.nondet.exec_prompt(prompt)
            clean_result = result.strip()
            if clean_result.startswith("```"):
                clean_result = clean_result.split("\n", 1)[-1]
            if clean_result.endswith("```"):
                clean_result = clean_result.rsplit("\n", 1)[0]
            clean_result = clean_result.strip()
            try:
                parsed = json.loads(clean_result)
                required = ["risk_score", "market_signal", "authorize_trade", "reasoning", "data_timestamp"]
                for key in required:
                    if key not in parsed:
                        raise ValueError(f"Missing key: {key}")
                return clean_result
            except Exception as e:
                return json.dumps({
                    "risk_score": 0.0,
                    "market_signal": "SAFE",
                    "authorize_trade": False,
                    "reasoning": f"Parse failed: {str(e)}",
                    "data_timestamp": "N/A"
                })

        consensus_json_str = ""
        try:
            # Run via prompt_non_comparative for flexible JSON consensus
            consensus_json_str = gl.eq_principle.prompt_non_comparative(
                run_analysis,
                task="Analyze DAO risk from market data and output JSON",
                criteria="The JSON output must have equivalent 'authorize_trade' and 'market_signal' values across validators, ignoring minor reasoning variations."
            )
            parsed_consensus = json.loads(consensus_json_str)

            # prompt_non_comparative may return a wrapper: {validators:[{...}], consensus_data:{...}}
            # Extract the actual decision from the first validator's output if so
            if isinstance(parsed_consensus, dict) and "validators" in parsed_consensus:
                validators = parsed_consensus.get("validators", [])
                decision = validators[0] if validators else parsed_consensus
            else:
                decision = parsed_consensus

            # Simulated On-Chain Execution Logic
            if decision.get("authorize_trade") is True:
                # Log the trade action into the state array
                audit_entry = {
                    "action": "TRADE_AUTHORIZED",
                    "speed_limit_applied": int(self.speed_limit),
                    "protection_slippage_used": int(self.protection_slippage),
                    "ai_decision": decision
                }
                self.audit_logs.append(json.dumps(audit_entry))
                return f"Trade Authorized: {decision.get('reasoning')}"
            else:
                audit_entry = {
                    "action": "HEARTBEAT_SAFE",
                    "ai_decision": decision
                }
                self.audit_logs.append(json.dumps(audit_entry))
                return f"Heartbeat Safe: {decision.get('reasoning')}"

        except Exception as e:
            # Fallback for parse failures or unexpected AI issues
            self.audit_logs.append(json.dumps({
                "action": "ERROR",
                "message": str(e),
                "raw_output": consensus_json_str
            }))
            return f"Error executing heartbeat: {str(e)}"
