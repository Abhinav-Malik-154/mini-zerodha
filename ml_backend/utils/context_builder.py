from typing import Dict, Any
import asyncio
import logging

logger = logging.getLogger(__name__)

# Import predictor and sentiment analyzer
try:
    from predictor.price_predictor import predictor
    from predictor.sentiment import sentiment_analyzer
except ImportError:
    predictor = None
    sentiment_analyzer = None


async def build_context(ticker: str) -> Dict[str, Any]:
    """
    Fetch all data needed for agents using real market data
    Falls back to mock data if dependencies unavailable
    """
    context = {
        'sentiment_scores': {},
        'fundamentals': {},
        'technicals': {},
        'macro': {},
        'risk': {},
        'prediction': {}
    }
    
    # Normalize ticker
    normalized = ticker.upper().replace('/', '')
    
    try:
        # Get prediction data
        if predictor:
            pred = predictor.predict(normalized, horizon=7)
            context['prediction'] = pred
            
            # Extract technicals from prediction
            if 'technicals' in pred:
                context['technicals'] = {
                    'rsi': pred['technicals'].get('rsi', 50),
                    'macd': pred['technicals'].get('macd', 0),
                    'macd_signal': pred['technicals'].get('macd_signal', 0),
                    'moving_avg': pred['technicals'].get('ma_30', 0),
                    'current_price': pred.get('current_price', 0),
                    'ma_7': pred['technicals'].get('ma_7', 0),
                    'ma_30': pred['technicals'].get('ma_30', 0),
                    'volatility': pred['technicals'].get('volatility_7d', 2.5),
                    'bb_position': pred['technicals'].get('bb_position', 0.5)
                }
            
            # Add risk metrics
            context['risk'] = {
                'volatility': pred['technicals'].get('volatility_7d', 2.5) if 'technicals' in pred else 2.5,
                'max_drawdown': 15.0,  # Would need historical calculation
                'value_at_risk': pred['technicals'].get('volatility_7d', 2.5) * 2 if 'technicals' in pred else 5.0
            }
        
        # Get sentiment data
        if sentiment_analyzer:
            sentiment = sentiment_analyzer.get_aggregate_sentiment(normalized)
            context['sentiment_scores'] = {
                'overall': sentiment.get('overall_score', 0),
                'label': sentiment.get('overall_sentiment', 'NEUTRAL'),
                'news_count': sentiment.get('article_count', 0),
                'positive_ratio': sentiment.get('positive_count', 0) / max(sentiment.get('article_count', 1), 1)
            }
        
        # Add fundamentals (mock for now - would need external API)
        context['fundamentals'] = {
            'pe_ratio': 18.5,
            'earnings_growth': 12.3,
            'insider_trades': 5,
            'market_cap': 'Large'
        }
        
        # Add macro data (mock - would need FRED API or similar)
        context['macro'] = {
            'interest_rate': 4.5,
            'inflation': 3.2,
            'market_regime': 'neutral',
            'vix': 15.5
        }
        
    except Exception as e:
        logger.error(f"Error building context for {ticker}: {e}")
        # Return default mock data on error
        return _get_mock_context()
    
    return context


def _get_mock_context() -> Dict[str, Any]:
    """Return mock context data as fallback"""
    return {
        'sentiment_scores': {
            'overall': 0.35,
            'label': 'POSITIVE',
            'news_count': 5,
            'positive_ratio': 0.6
        },
        'fundamentals': {
            'pe_ratio': 18.5,
            'earnings_growth': 12.3,
            'insider_trades': 5,
            'market_cap': 'Large'
        },
        'technicals': {
            'rsi': 45,
            'macd': 0.02,
            'macd_signal': 0.01,
            'moving_avg': 175.50,
            'current_price': 178.30,
            'ma_7': 176.50,
            'ma_30': 175.50,
            'volatility': 2.5,
            'bb_position': 0.55
        },
        'macro': {
            'interest_rate': 4.5,
            'inflation': 3.2,
            'market_regime': 'neutral',
            'vix': 15.5
        },
        'risk': {
            'volatility': 22.5,
            'max_drawdown': 18.0,
            'value_at_risk': 4.2
        },
        'prediction': {}
    }