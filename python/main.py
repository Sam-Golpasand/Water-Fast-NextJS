import sys
import json
import pandas as pd
import io
import tempfile
from sklearn.preprocessing import RobustScaler
from sklearn.ensemble import IsolationForest

class AnomalyDetector:
    def __init__(self, training_data):
        self.expected_columns = [
            'patientnumber', 'length', 'weightpre', 'weightpost',
            'bmipre', 'bmipost', 'waistpre', 'waistpost',
            'pulsepre', 'pulsepost'
        ]
        
        self.training_data = self._preprocess_data(training_data)
        self._train_models()
    
    def _preprocess_data(self, data):
        data.columns = data.columns.str.lower()
        
        missing_cols = [col for col in self.expected_columns if col not in data.columns]
        if missing_cols:
            raise ValueError(f"Missing required columns: {missing_cols}")
        
        data_cleaned = data[self.expected_columns].copy()
        
        for col in data_cleaned.columns:
            data_cleaned[col] = pd.to_numeric(data_cleaned[col], errors='coerce')
        
        data_cleaned.fillna(data_cleaned.median(), inplace=True)
        
        return data_cleaned
    
    def _train_models(self):
        numerical_cols = [col for col in self.expected_columns if col != 'patientnumber']
        
        self.scaler = RobustScaler()
        training_scaled = self.scaler.fit_transform(self.training_data[numerical_cols])
        
        self.isolation_forest = IsolationForest(
            contamination=0.40,  
            random_state=42
        )
        self.isolation_forest.fit(training_scaled)
        
        self.feature_stats = {
            col: {
                'mean': self.training_data[col].mean(),
                'std': self.training_data[col].std()
            }
            for col in numerical_cols
        }
    
    def detect_anomaly(self, new_data_row):
        try:
            new_data = pd.DataFrame([new_data_row])
            new_data_cleaned = self._preprocess_data(new_data)
            
            numerical_cols = [col for col in self.expected_columns if col != 'patientnumber']
            
            new_data_scaled = self.scaler.transform(new_data_cleaned[numerical_cols])
            
            # Isolation Forest prediction
            isolation_score = self.isolation_forest.predict(new_data_scaled)[0]
            
            # Compute feature-level Z scores
            feature_z_scores = {
                f'{col}_Z_Score': abs(new_data_cleaned[col].values[0] - self.feature_stats[col]['mean']) 
                                   / self.feature_stats[col]['std']
                for col in numerical_cols
            }
            
            # Determine overall anomalies
            isolation_anomaly = isolation_score == -1
            distance_anomaly = any(z_score > 2 for z_score in feature_z_scores.values())
            
            # Combine results in the format your frontend expects
            result = {
                'Isolation_Forest_Anomaly': bool(isolation_anomaly),
                'Distance_Based_Anomaly': bool(distance_anomaly),
                **feature_z_scores
            }
            
            return result
        
        except Exception as e:
            return {
                'error': str(e)
            }

def main():
    try:
        # Read input data from stdin
        excel_data = sys.stdin.buffer.read()
        input_data = pd.read_excel(io.BytesIO(excel_data))

        # Get the training data path from arguments
        training_data_path = sys.argv[1]
        training_data = pd.read_excel(training_data_path)

        # Initialize detector
        detector = AnomalyDetector(training_data)

        # Detect anomaly for the first row
        if not input_data.empty:
            result = detector.detect_anomaly(input_data.iloc[0].to_dict())
            print(json.dumps(result))
        else:
            print(json.dumps({'error': 'No input data provided'}))

    except Exception as e:
        print(json.dumps({'error': str(e)}))

if __name__ == "__main__":
    main()
