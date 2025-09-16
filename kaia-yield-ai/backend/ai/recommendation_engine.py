import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import joblib
import json
import logging
from datetime import datetime, timedelta
import sys
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class YieldRecommendationEngine:
    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self.is_trained = False
        
    def generate_synthetic_data(self, n_samples=10000):
        """Generate synthetic training data for the model"""
        np.random.seed(42)
        
        # User features
        risk_tolerance = np.random.randint(1, 11, n_samples)
        investment_amount = np.random.lognormal(8, 1, n_samples)  # Log-normal distribution
        user_level = np.random.randint(1, 21, n_samples)
        days_since_last_deposit = np.random.exponential(7, n_samples)
        portfolio_diversification = np.random.beta(2, 5, n_samples)
        
        # Market features
        market_volatility = np.random.exponential(0.3, n_samples)
        days_since_start = np.random.randint(1, 365, n_samples)
        
        # Strategy features
        strategy_apy = np.random.uniform(300, 3000, n_samples)  # 3% to 30% APY
        strategy_risk = np.random.randint(1, 11, n_samples)
        strategy_min_deposit = np.random.uniform(10, 1000, n_samples)
        
        # Calculate target variable (strategy score)
        # Higher score for strategies that match user preferences
        risk_match = 1 - abs(risk_tolerance - strategy_risk) / 10
        apy_risk_ratio = strategy_apy / (strategy_risk * 100)
        affordability = np.minimum(investment_amount / strategy_min_deposit, 2) / 2
        experience_bonus = user_level / 20
        
        strategy_score = (
            risk_match * 0.3 +
            apy_risk_ratio * 0.4 +
            affordability * 0.2 +
            experience_bonus * 0.1 +
            np.random.normal(0, 0.1, n_samples)  # Add noise
        )
        
        # Normalize to 0-100 scale
        strategy_score = np.clip(strategy_score * 50 + 50, 0, 100)
        
        features = pd.DataFrame({
            'risk_tolerance': risk_tolerance,
            'investment_amount': investment_amount,
            'user_level': user_level,
            'days_since_last_deposit': days_since_last_deposit,
            'portfolio_diversification': portfolio_diversification,
            'market_volatility': market_volatility,
            'days_since_start': days_since_start,
            'strategy_apy': strategy_apy,
            'strategy_risk': strategy_risk,
            'strategy_min_deposit': strategy_min_deposit
        })
        
        return features, strategy_score
    
    def train_model(self):
        """Train the recommendation model"""
        logger.info("Generating synthetic training data...")
        X, y = self.generate_synthetic_data()
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train model
        logger.info("Training model...")
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate
        train_score = self.model.score(X_train_scaled, y_train)
        test_score = self.model.score(X_test_scaled, y_test)
        
        logger.info(f"Model trained - Train R²: {train_score:.3f}, Test R²: {test_score:.3f}")
        
        self.is_trained = True
        
        # Save model
        self.save_model()
        
    def predict_strategy_score(self, user_features, strategy_features):
        """Predict score for a strategy given user and strategy features"""
        if not self.is_trained:
            self.load_model()
            
        features = pd.DataFrame([{
            'risk_tolerance': user_features.get('risk_tolerance', 5),
            'investment_amount': user_features.get('investment_amount', 100),
            'user_level': user_features.get('user_level', 1),
            'days_since_last_deposit': user_features.get('days_since_last_deposit', 1),
            'portfolio_diversification': user_features.get('portfolio_diversification', 0),
            'market_volatility': user_features.get('market_volatility', 0.2),
            'days_since_start': user_features.get('days_since_start', 1),
            'strategy_apy': strategy_features['apy'],
            'strategy_risk': strategy_features['risk_level'],
            'strategy_min_deposit': strategy_features['min_deposit']
        }])
        
        features_scaled = self.scaler.transform(features)
        score = self.model.predict(features_scaled)[0]
        
        return max(0, min(100, score))
    
    def get_recommendations(self, user_data, strategies):
        """Get top strategy recommendations for a user"""
        recommendations = []
        
        for strategy in strategies:
            if not strategy['active']:
                continue
                
            score = self.predict_strategy_score(user_data, strategy)
            
            # Generate explanation
            explanation = self._generate_explanation(user_data, strategy, score)
            
            recommendations.append({
                'strategy_id': strategy['id'],
                'strategy_name': strategy['name'],
                'score': round(score, 1),
                'confidence': self._calculate_confidence(score),
                'explanation': explanation,
                'expected_return': self._calculate_expected_return(
                    user_data.get('investment_amount', 100),
                    strategy['apy']
                )
            })
        
        # Sort by score
        recommendations.sort(key=lambda x: x['score'], reverse=True)
        
        return recommendations[:5]  # Top 5 recommendations
    
    def _generate_explanation(self, user_data, strategy, score):
        """Generate human-readable explanation for recommendation"""
        risk_match = user_data.get('risk_tolerance', 5)
        strategy_risk = strategy['risk_level']
        
        explanations = []
        
        if abs(risk_match - strategy_risk) <= 2:
            explanations.append("matches your risk tolerance well")
        elif strategy_risk < risk_match:
            explanations.append("is more conservative than your usual preference")
        else:
            explanations.append("is more aggressive than your usual preference")
            
        apy_text = f"offers {strategy['apy']/100:.1f}% APY"
        explanations.append(apy_text)
        
        if score >= 80:
            tone = "Excellent match"
        elif score >= 60:
            tone = "Good fit"
        else:
            tone = "Consider carefully"
            
        return f"{tone}: This strategy {', '.join(explanations)}."
    
    def _calculate_confidence(self, score):
        """Convert score to confidence level"""
        if score >= 80:
            return "High"
        elif score >= 60:
            return "Medium"
        else:
            return "Low"
    
    def _calculate_expected_return(self, amount, apy):
        """Calculate expected annual return"""
        return round(amount * (apy / 10000), 2)
    
    def save_model(self):
        """Save trained model and scaler"""
        os.makedirs('models', exist_ok=True)
        joblib.dump(self.model, 'models/recommendation_model.joblib')
        joblib.dump(self.scaler, 'models/scaler.joblib')
        logger.info("Model saved successfully")
    
    def load_model(self):
        """Load trained model and scaler"""
        try:
            self.model = joblib.load('models/recommendation_model.joblib')
            self.scaler = joblib.load('models/scaler.joblib')
            self.is_trained = True
            logger.info("Model loaded successfully")
        except FileNotFoundError:
            logger.warning("No saved model found. Training new model...")
            self.train_model()

def main():
    """Main function for training and testing the model"""
    engine = YieldRecommendationEngine()
    
    if len(sys.argv) > 1 and sys.argv[1] == 'train':
        engine.train_model()
        print("Model training completed!")
        return
    
    # Test the model with sample data
    user_data = {
        'risk_tolerance': 6,
        'investment_amount': 1000,
        'user_level': 5,
        'days_since_last_deposit': 3,
        'portfolio_diversification': 0.3,
        'market_volatility': 0.25,
        'days_since_start': 30
    }
    
    strategies = [
        {
            'id': 1,
            'name': 'Stable Earn',
            'apy': 500,
            'risk_level': 2,
            'min_deposit': 10,
            'active': True
        },
        {
            'id': 2,
            'name': 'Growth Plus',
            'apy': 1200,
            'risk_level': 5,
            'min_deposit': 50,
            'active': True
        },
        {
            'id': 3,
            'name': 'High Yield Pro',
            'apy': 2500,
            'risk_level': 8,
            'min_deposit': 100,
            'active': True
        }
    ]
    
    recommendations = engine.get_recommendations(user_data, strategies)
    
    print("AI Recommendations:")
    print(json.dumps(recommendations, indent=2))

if __name__ == "__main__":
    main()