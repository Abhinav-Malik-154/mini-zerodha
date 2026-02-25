from agents.base_agent import BaseTradingAgent, AgentOpinion
from datetime import datetime
from typing import Dict, Any

class SentimentAnalystAgent(BaseTradingAgent):
    async def analyze(self, ticker: str, context: Dict[str, Any]) -> AgentOpinion:
        # Get sentiment scores from context
        sentiment = context.get('sentiment_scores', {})
        finbert = sentiment.get('finbert', 0)
        reddit = sentiment.get('reddit', 0)
        news = sentiment.get('news', 0)
        
        # Calculate composite score
        composite = (finbert * 0.5 + reddit * 0.3 + news * 0.2)
        
        # Determine direction
        if composite > 0.2:
            direction = "bullish"
            confidence = int(50 + composite * 40)
        elif composite < -0.2:
            direction = "bearish"
            confidence = int(50 + abs(composite) * 40)
        else:
            direction = "neutral"
            confidence = 30
            
        # Generate reasoning
        factors = []
        if finbert > 0.3:
            factors.append(f"FinBERT positive: {finbert:.2f}")
        if reddit > 0.4:
            factors.append("Reddit sentiment strong")
        if news < -0.2:
            factors.append("News negative")
            
        return AgentOpinion(
            agent_name=self.name,
            ticker=ticker,
            timestamp=datetime.now(),
            direction=direction,
            confidence=min(confidence, 100),
            reasoning=f"Sentiment composite: {composite:.2f}",
            key_factors=factors or ["Neutral sentiment"],
            suggested_action="buy" if direction == "bullish" and confidence > 70 else "wait",
            suggested_position_size=0.05 if confidence > 70 else 0.02
        )