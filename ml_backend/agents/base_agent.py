from abc import ABC, abstractmethod
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from datetime import datetime
import asyncio

class AgentOpinion(BaseModel):
    agent_name: str
    ticker: str
    timestamp: datetime
    direction: str  # "bullish", "bearish", "neutral"
    confidence: int  # 0-100
    reasoning: str
    key_factors: List[str]
    suggested_action: Optional[str] = "wait"
    suggested_position_size: Optional[float] = 0.0
    weight: float = 1.0  # ← ADD THIS LINE

class BaseTradingAgent(ABC):
    def __init__(self, name: str, weight: float = 1.0):
        self.name = name
        self.weight = weight
        
    @abstractmethod
    async def analyze(self, ticker: str, context: Dict[str, Any]) -> AgentOpinion:
        pass
    
    async def run_with_timeout(self, ticker: str, context: Dict, timeout: int = 5):
        try:
            return await asyncio.wait_for(
                self.analyze(ticker, context), 
                timeout=timeout
            )
        except asyncio.TimeoutError:
            return AgentOpinion(
                agent_name=self.name,
                ticker=ticker,
                timestamp=datetime.now(),
                direction="neutral",
                confidence=0,
                reasoning=f"Analysis timed out",
                key_factors=["timeout"]
            )