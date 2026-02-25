from agents.base_agent import BaseTradingAgent, AgentOpinion
from datetime import datetime
from typing import Dict, Any

class RiskManagerAgent(BaseTradingAgent):
    async def analyze(self, ticker: str, context: Dict[str, Any]) -> AgentOpinion:
        # Get risk data
        risk_data = context.get('risk', {})
        volatility = risk_data.get('volatility', 20)
        max_drawdown = risk_data.get('max_drawdown', 15)
        var = risk_data.get('value_at_risk', 5)
        
        # Calculate risk score (0-100, higher = riskier)
        risk_score = (volatility * 0.4 + max_drawdown * 0.3 + var * 0.3)
        
        factors = []
        if volatility > 30:
            factors.append(f"High volatility: {volatility}%")
        if max_drawdown > 20:
            factors.append(f"Large drawdown risk: {max_drawdown}%")
        
        # Determine position sizing based on risk
        if risk_score < 20:
            max_position = 10  # 10% of portfolio
            risk_level = "low"
        elif risk_score < 40:
            max_position = 5   # 5% of portfolio
            risk_level = "medium"
        else:
            max_position = 2   # 2% of portfolio
            risk_level = "high"
        
        return AgentOpinion(
            agent_name=self.name,
            ticker=ticker,
            timestamp=datetime.now(),
            direction="neutral",  # Risk manager doesn't predict direction
            confidence=int(100 - risk_score),
            reasoning=f"Risk score: {risk_score:.1f} - {risk_level.upper()} risk",
            key_factors=factors or [f"Volatility: {volatility}%"],
            suggested_action="wait",
            suggested_position_size=max_position / 100  # Convert to decimal
        )