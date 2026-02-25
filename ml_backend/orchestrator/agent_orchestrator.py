from typing import List, Dict, Any
import asyncio
import numpy as np
from datetime import datetime
from agents.base_agent import BaseTradingAgent, AgentOpinion

class AgentOrchestrator:
    def __init__(self, agents: List[BaseTradingAgent]):
        self.agents = agents
        
    async def analyze_ticker(self, ticker: str, context: Dict[str, Any]) -> Dict:
        # Run all agents in parallel
        tasks = [agent.run_with_timeout(ticker, context) for agent in self.agents]
        opinions = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter valid opinions
        valid_opinions = [o for o in opinions if isinstance(o, AgentOpinion)]
        
        # Synthesize final decision
        final = self._synthesize(valid_opinions)
        
        return {
            'ticker': ticker,
            'timestamp': datetime.now().isoformat(),
            'individual_opinions': [o.dict() for o in valid_opinions],
            'final_recommendation': final,
            'debate_summary': self._generate_summary(valid_opinions)
        }
    
    def _synthesize(self, opinions: List[AgentOpinion]) -> Dict:
        # Weighted voting
        scores = {'bullish': 0, 'bearish': 0, 'neutral': 0}
        total_weight = 0
        
        for o in opinions:
            weight = o.weight * (o.confidence / 100)
            scores[o.direction] += weight
            total_weight += weight
        
        # Get final direction
        final_dir = max(scores, key=scores.get)
        
        # Calculate average position size from risk manager or others
        position_sizes = [o.suggested_position_size for o in opinions if o.suggested_position_size > 0]
        avg_position = np.mean(position_sizes) if position_sizes else 0.05
        
        return {
            'direction': final_dir,
            'confidence': int((scores[final_dir] / total_weight) * 100) if total_weight > 0 else 50,
            'suggested_action': 'buy' if final_dir == 'bullish' and scores[final_dir] > 0.5 else 'wait',
            'suggested_position_size': round(avg_position * 100, 1),  # as percentage
            'bullish_score': round(scores['bullish'], 2),
            'bearish_score': round(scores['bearish'], 2),
            'neutral_score': round(scores['neutral'], 2)
        }
    
    def _generate_summary(self, opinions: List[AgentOpinion]) -> str:
        lines = []
        for o in opinions:
            emoji = "📈" if o.direction == "bullish" else "📉" if o.direction == "bearish" else "➖"
            lines.append(f"{emoji} {o.agent_name}: {o.direction.upper()} ({o.confidence}%)")
        return "\n".join(lines)