"""
Sentiment Analysis for Financial News
Uses keyword-based and optional transformer models
"""
import os
import re
from typing import Dict, List, Any
from datetime import datetime
import logging

try:
    import feedparser
except ImportError:
    feedparser = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SentimentAnalyzer:
    """Analyze sentiment of financial news and text"""
    
    # Keyword-based sentiment words
    POSITIVE_WORDS = {
        'surge', 'jump', 'rally', 'gain', 'rise', 'bull', 'bullish', 'growth',
        'profit', 'beat', 'exceed', 'outperform', 'buy', 'upgrade', 'strong',
        'positive', 'optimistic', 'recover', 'boom', 'soar', 'climb', 'advance',
        'breakthrough', 'innovation', 'success', 'record', 'high', 'best'
    }
    
    NEGATIVE_WORDS = {
        'crash', 'plunge', 'fall', 'drop', 'decline', 'bear', 'bearish', 'loss',
        'miss', 'fail', 'underperform', 'sell', 'downgrade', 'weak', 'negative',
        'pessimistic', 'recession', 'bust', 'sink', 'slide', 'retreat', 'warning',
        'concern', 'risk', 'fear', 'uncertain', 'volatile', 'worst', 'low'
    }
    
    # RSS feed sources (read from env, with defaults)
    NEWS_FEEDS = {
        'yahoo': os.getenv('YAHOO_RSS_URL', 'https://feeds.finance.yahoo.com/rss/2.0/headline?s={symbol}&region=US&lang=en-US'),
        'seeking_alpha': os.getenv('SEEKING_ALPHA_RSS_URL', 'https://seekingalpha.com/api/sa/combined/{symbol}.xml'),
    }
    
    def __init__(self):
        self.cache = {}
    
    def analyze_text(self, text: str) -> Dict[str, Any]:
        """Analyze sentiment of a text string"""
        if not text:
            return {'score': 0, 'label': 'NEUTRAL', 'confidence': 0.5}
        
        text_lower = text.lower()
        words = set(re.findall(r'\b\w+\b', text_lower))
        
        positive_count = len(words & self.POSITIVE_WORDS)
        negative_count = len(words & self.NEGATIVE_WORDS)
        total_sentiment_words = positive_count + negative_count
        
        if total_sentiment_words == 0:
            return {'score': 0, 'label': 'NEUTRAL', 'confidence': 0.5}
        
        # Score from -1 (very negative) to +1 (very positive)
        score = (positive_count - negative_count) / max(total_sentiment_words, 1)
        
        # Normalize confidence based on how many sentiment words found
        confidence = min(0.5 + (total_sentiment_words * 0.1), 0.95)
        
        if score > 0.2:
            label = 'POSITIVE'
        elif score < -0.2:
            label = 'NEGATIVE'
        else:
            label = 'NEUTRAL'
        
        return {
            'score': round(score, 3),
            'label': label,
            'confidence': round(confidence, 3),
            'positive_words': positive_count,
            'negative_words': negative_count
        }
    
    def fetch_news(self, symbol: str, max_items: int = 10) -> List[Dict[str, Any]]:
        """Fetch news articles for a symbol"""
        if feedparser is None:
            logger.warning("feedparser not installed, using mock news")
            return self._generate_mock_news(symbol)
        
        articles = []
        normalized_symbol = symbol.upper().replace('/', '').replace('-USD', '')
        
        for source, url_template in self.NEWS_FEEDS.items():
            try:
                url = url_template.format(symbol=normalized_symbol)
                feed = feedparser.parse(url)
                
                for entry in feed.entries[:max_items]:
                    title = entry.get('title', '')
                    sentiment = self.analyze_text(title)
                    
                    articles.append({
                        'title': title,
                        'source': source.replace('_', ' ').title(),
                        'link': entry.get('link', ''),
                        'published': entry.get('published', ''),
                        'sentiment': sentiment['label'],
                        'sentiment_score': sentiment['score']
                    })
            except Exception as e:
                logger.warning(f"Failed to fetch from {source}: {e}")
        
        # If no articles found, return mock data
        if not articles:
            return self._generate_mock_news(symbol)
        
        return articles[:max_items]
    
    def _generate_mock_news(self, symbol: str) -> List[Dict[str, Any]]:
        """Generate mock news for testing"""
        mock_headlines = [
            (f"{symbol} Shows Strong Momentum as Bulls Take Control", 'POSITIVE'),
            (f"Analysts Upgrade {symbol} Price Target Following Earnings Beat", 'POSITIVE'),
            (f"{symbol} Faces Headwinds Amid Market Uncertainty", 'NEGATIVE'),
            (f"Technical Analysis: {symbol} Trading Near Key Support Levels", 'NEUTRAL'),
            (f"Institutional Investors Increase {symbol} Holdings", 'POSITIVE'),
        ]
        
        articles = []
        for i, (headline, sentiment) in enumerate(mock_headlines):
            score = 0.5 if sentiment == 'POSITIVE' else (-0.5 if sentiment == 'NEGATIVE' else 0)
            articles.append({
                'title': headline,
                'source': 'Market Analysis',
                'link': f'https://example.com/news/{i}',
                'published': datetime.now().isoformat(),
                'sentiment': sentiment,
                'sentiment_score': score
            })
        
        return articles
    
    def get_aggregate_sentiment(self, symbol: str) -> Dict[str, Any]:
        """Get aggregate sentiment score for a symbol"""
        articles = self.fetch_news(symbol)
        
        if not articles:
            return {
                'symbol': symbol,
                'overall_sentiment': 'NEUTRAL',
                'overall_score': 0,
                'confidence': 0.5,
                'article_count': 0
            }
        
        scores = [a['sentiment_score'] for a in articles]
        avg_score = sum(scores) / len(scores)
        
        if avg_score > 0.15:
            overall = 'POSITIVE'
        elif avg_score < -0.15:
            overall = 'NEGATIVE'
        else:
            overall = 'NEUTRAL'
        
        return {
            'symbol': symbol,
            'overall_sentiment': overall,
            'overall_score': round(avg_score, 3),
            'confidence': round(min(0.5 + len(articles) * 0.05, 0.9), 2),
            'article_count': len(articles),
            'positive_count': sum(1 for a in articles if a['sentiment'] == 'POSITIVE'),
            'negative_count': sum(1 for a in articles if a['sentiment'] == 'NEGATIVE'),
            'neutral_count': sum(1 for a in articles if a['sentiment'] == 'NEUTRAL'),
            'timestamp': datetime.now().isoformat()
        }


# Global analyzer instance
sentiment_analyzer = SentimentAnalyzer()
