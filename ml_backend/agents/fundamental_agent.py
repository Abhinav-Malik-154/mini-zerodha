from agents.base_agent import BaseTradingAgent, AgentOpinion
from datetime import datetime
from typing import Dict, Any

class FundamentalAnalystAgent(BaseTradingAgent):
    async def analyze(self, ticker: str, context: Dict[str, Any]) -> AgentOpinion:
        # Get fundamental data
        fundamentals = context.get('fundamentals', {})
        pe_ratio = fundamentals.get('pe_ratio', 20)
        earnings_growth = fundamentals.get('earnings_growth', 0)
        insider_trades = fundamentals.get('insider_trades', 0)
        
        # Simple analysis logic
        score = 0
        factors = []
        
        # P/E analysis
        if pe_ratio < 15:
            score += 1
            factors.append(f"Low P/E: {pe_ratio}")
        elif pe_ratio > 25:
            score -= 1
            factors.append(f"High P/E: {pe_ratio}")
            
        # Earnings growth
        if earnings_growth > 10:
            score += 1
            factors.append(f"Strong growth: {earnings_growth}%")
        elif earnings_growth < 0:
            score -= 1
            factors.append("Negative growth")
            
        # Insider trades
        if insider_trades > 0:
            score += 1
            factors.append("Insider buying")
        elif insider_trades < 0:
            score -= 1
            factors.append("Insider selling")
        
        # Determine direction
        if score >= 2:
            direction = "bullish"
            confidence = 70 + score * 5
        elif score <= -1:
            direction = "bearish"
            confidence = 60 + abs(score) * 10
        else:
            direction = "neutral"
            confidence = 40
            
        return AgentOpinion(
            agent_name=self.name,
            ticker=ticker,
            timestamp=datetime.now(),
            direction=direction,
            confidence=min(confidence, 100),
            reasoning=f"Fundamental score: {score}",
            key_factors=factors or ["Mixed fundamentals"],
            suggested_action="buy" if direction == "bullish" and confidence > 70 else "wait",
            suggested_position_size=0.04 if direction == "bullish" else 0.01
        )