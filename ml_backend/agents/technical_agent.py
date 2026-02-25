from agents.base_agent import BaseTradingAgent, AgentOpinion
from datetime import datetime
from typing import Dict, Any

class TechnicalAnalystAgent(BaseTradingAgent):
    async def analyze(self, ticker: str, context: Dict[str, Any]) -> AgentOpinion:
        # Get technical indicators
        technicals = context.get('technicals', {})
        rsi = technicals.get('rsi', 50)
        macd = technicals.get('macd', 0)
        moving_avg = technicals.get('moving_avg', 0)
        current_price = technicals.get('current_price', 0)
        
        score = 0
        factors = []
        
        # RSI analysis
        if rsi < 30:
            score += 1
            factors.append(f"Oversold (RSI: {rsi})")
        elif rsi > 70:
            score -= 1
            factors.append(f"Overbought (RSI: {rsi})")
            
        # MACD
        if macd > 0:
            score += 1
            factors.append("MACD positive")
        elif macd < 0:
            score -= 1
            factors.append("MACD negative")
            
        # Moving average
        if current_price > moving_avg:
            score += 1
            factors.append("Above MA")
        else:
            score -= 1
            factors.append("Below MA")
        
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
            reasoning=f"Technical score: {score}",
            key_factors=factors or ["Mixed technicals"],
            suggested_action="buy" if direction == "bullish" and confidence > 70 else "wait",
            suggested_position_size=0.03 if direction == "bullish" else 0.01
        )