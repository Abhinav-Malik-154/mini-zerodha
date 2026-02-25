from agents.base_agent import BaseTradingAgent, AgentOpinion
from datetime import datetime
from typing import Dict, Any

class MacroEconomistAgent(BaseTradingAgent):
    async def analyze(self, ticker: str, context: Dict[str, Any]) -> AgentOpinion:
        # Get macro data
        macro = context.get('macro', {})
        interest_rate = macro.get('interest_rate', 5)
        inflation = macro.get('inflation', 3)
        market_regime = macro.get('market_regime', 'neutral')
        
        score = 0
        factors = []
        
        # Interest rates
        if interest_rate < 3:
            score += 1
            factors.append("Low rates (bullish)")
        elif interest_rate > 5:
            score -= 1
            factors.append("High rates (bearish)")
            
        # Inflation
        if inflation < 2:
            score += 1
            factors.append("Low inflation")
        elif inflation > 4:
            score -= 1
            factors.append("High inflation")
            
        # Market regime
        if market_regime == 'bullish':
            score += 1
            factors.append("Bullish market regime")
        elif market_regime == 'bearish':
            score -= 1
            factors.append("Bearish market regime")
        
        # Determine direction
        if score >= 2:
            direction = "bullish"
            confidence = 75
        elif score <= -1:
            direction = "bearish"
            confidence = 70
        else:
            direction = "neutral"
            confidence = 50
            
        return AgentOpinion(
            agent_name=self.name,
            ticker=ticker,
            timestamp=datetime.now(),
            direction=direction,
            confidence=confidence,
            reasoning=f"Macro score: {score}",
            key_factors=factors or ["Mixed macro"],
            suggested_action="wait",
            suggested_position_size=0.02
        )