import requests
import logging

logger = logging.getLogger(__name__)

class SentimentAnalyzer:
    """
    Service d'analyse de sentiment utilisant Hugging Face Inference API (100% gratuit)
    """

    MODEL_URL = "https://router.huggingface.co/hf-inference/models/nlptown/bert-base-multilingual-uncased-sentiment"
    HEADERS = {"Authorization": "Bearer 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"}


    @staticmethod
    def analyze_sentiment(text):
        """
        Analyse le sentiment d'un texte
        Retourne: 'POSITIVE', 'NEGATIVE', ou 'NEUTRAL'
        """
        if not text or not text.strip():
            return 'NEUTRAL'

        try:
            payload = {"inputs": text[:500]}

            response = requests.post(
                SentimentAnalyzer.MODEL_URL,
                headers=SentimentAnalyzer.HEADERS,
                json=payload,
                timeout=10
            )

            if response.status_code == 200:
                result = response.json()

                if isinstance(result, list) and len(result) > 0 and isinstance(result[0], list):
                    scores = result[0]

                    scores.sort(key=lambda x: x['score'], reverse=True)
                    top_sentiment = scores[0]['label']

                    # Mapping pour le modèle multilingual (1-5 étoiles)
                    # 1-2 étoiles = négatif, 3 étoiles = neutre, 4-5 étoiles = positif
                    star_mapping = {
                        '1 star': 'NEGATIVE',
                        '2 stars': 'NEGATIVE',
                        '3 stars': 'NEUTRAL',
                        '4 stars': 'POSITIVE',
                        '5 stars': 'POSITIVE',
                    }

                    return star_mapping.get(top_sentiment, 'NEUTRAL')

            logger.warning(f"Erreur API Hugging Face: {response.status_code} - {response.text}")
            return 'NEUTRAL'

        except Exception as e:
            logger.error(f"Erreur lors de l'analyse de sentiment: {str(e)}")
            print(f"DEBUG: Erreur API sentiment: {str(e)}")  # Debug temporaire
            return 'NEUTRAL'

    @staticmethod
    def get_sentiment_emoji(sentiment):
        """Retourne un emoji selon le sentiment"""
        emojis = {
            'POSITIVE': '😊',
            'NEGATIVE': '😞',
            'NEUTRAL': '😐'
        }
        return emojis.get(sentiment, '😐')

    @staticmethod
    def get_sentiment_color(sentiment):
        """Retourne une classe CSS selon le sentiment"""
        colors = {
            'POSITIVE': 'sentiment-positive',
            'NEGATIVE': 'sentiment-negative',
            'NEUTRAL': 'sentiment-neutral'
        }
        return colors.get(sentiment, 'sentiment-neutral')
