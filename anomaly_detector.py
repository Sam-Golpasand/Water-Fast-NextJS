import pandas as pd
import numpy as np
import sys
import json
import io
from sklearn.preprocessing import RobustScaler
from sklearn.ensemble import IsolationForest

class AnomalyDetector:
    def __init__(self, training_data_path, training_sheet_name='Ark1'):
        """
        Initialize the Anomaly Detector with a training dataset.
        
        Parameters:
        - training_data_path: Path to the Excel file with training data
        - training_sheet_name: Name of the sheet containing training data
        """
        # Define expected columns
        self.expected_columns = [
            'patientnumber', 'length', 'weightpre', 'weightpost',
            'bmipre', 'bmipost', 'waistpre', 'waistpost',
            'pulsepre', 'pulsepost'
        ]
        
        # Load and preprocess training data
        self.training_data = self.load_and_preprocess_data(
            training_data_path, 
            training_sheet_name
        )
        
        # Train anomaly detection models
        self.train_models()
    
    def load_and_preprocess_data(self, file_path, sheet_name):
        """
        Load and preprocess the dataset.
        
        Parameters:
        - file_path: Path to the Excel file
        - sheet_name: Name of the sheet to load
        
        Returns:
        - Preprocessed DataFrame
        """
        try:
            # Load the Excel file
            data = pd.read_excel(file_path, sheet_name=sheet_name)
            
            # Normalize column names
            data.columns = data.columns.str.lower()
            
            # Validate columns
            missing_cols = [col for col in self.expected_columns if col not in data.columns]
            if missing_cols:
                raise ValueError(f"Missing required columns: {missing_cols}")
            
            # Select and clean data
            data_cleaned = data[self.expected_columns].copy()
            
            # Convert to numeric, handling potential non-numeric entries
            for col in data_cleaned.columns:
                data_cleaned[col] = pd.to_numeric(data_cleaned[col], errors='coerce')
            
            # Fill missing values with median
            data_cleaned.fillna(data_cleaned.median(), inplace=True)
            
            return data_cleaned
        
        except Exception as e:
            print(json.dumps({"error": f"Error loading data: {str(e)}"}), flush=True)
            sys.exit(1)
    
    def train_models(self):
        """
        Train anomaly detection models using the training dataset.
        """
        # Prepare numerical columns for training
        numerical_cols = [col for col in self.expected_columns if col != 'patientnumber']
        
        # Scale the data
        self.scaler = RobustScaler()
        training_scaled = self.scaler.fit_transform(self.training_data[numerical_cols])
        
        # Train Isolation Forest
        self.isolation_forest = IsolationForest(
            contamination=0.23,  
            random_state=42
        )
        self.isolation_forest.fit(training_scaled)
        
        # Compute reference statistics
        self.feature_stats = {
            col: {
                'mean': self.training_data[col].mean(),
                'std': self.training_data[col].std()
            }
            for col in numerical_cols
        }
    
    def assess_new_data(self, new_data_path=None, new_data_buffer=None):
        """
        Assess data for anomalies.
        
        Parameters:
        - new_data_path: Path to the new data Excel file
        - new_data_buffer: Buffer containing Excel data
        
        Returns:
        - DataFrame with anomaly assessment
        """
        try:
            # Load new data from either file path or buffer
            if new_data_path:
                new_data = pd.read_excel(new_data_path, sheet_name='Ark1')
            elif new_data_buffer:
                new_data = pd.read_excel(io.BytesIO(new_data_buffer))
            else:
                raise ValueError("Must provide either new_data_path or new_data_buffer")
            
            new_data.columns = new_data.columns.str.lower()
            
            # Validate columns
            missing_cols = [col for col in self.expected_columns if col not in new_data.columns]
            if missing_cols:
                raise ValueError(f"Missing columns in new dataset: {missing_cols}")
            
            # Prepare new data
            new_data_cleaned = new_data[self.expected_columns].copy()
            for col in new_data_cleaned.columns:
                new_data_cleaned[col] = pd.to_numeric(new_data_cleaned[col], errors='coerce')
            
            # Fill missing values (use training data median)
            new_data_cleaned.fillna(
                {col: self.training_data[col].median() for col in new_data_cleaned.columns}, 
                inplace=True
            )
            
            # Prepare numerical columns
            numerical_cols = [col for col in self.expected_columns if col != 'patientnumber']
            
            # Scale new data using training scaler
            new_data_scaled = self.scaler.transform(new_data_cleaned[numerical_cols])
            
            # Anomaly detection methods
            anomaly_results = self.compute_anomaly_scores(
                new_data_cleaned, 
                new_data_scaled, 
                numerical_cols
            )
            
            return anomaly_results
        
        except Exception as e:
            print(json.dumps({"error": f"Error assessing new data: {str(e)}"}), flush=True)
            sys.exit(1)
    
    def compute_anomaly_scores(self, new_data_cleaned, new_data_scaled, numerical_cols):
        """
        Compute multiple anomaly scores for the new data.
        """
        # Isolation Forest prediction
        isolation_scores = self.isolation_forest.predict(new_data_scaled)
        
        # Compute distance-based anomaly score
        distance_anomalies = []
        for _, row in new_data_cleaned[numerical_cols].iterrows():
            feature_distances = [
                abs(row[col] - self.feature_stats[col]['mean']) / self.feature_stats[col]['std']
                for col in numerical_cols
            ]
            distance_anomalies.append(np.mean(feature_distances) > 2)
        
        # Combine anomaly detection methods
        anomaly_results = pd.DataFrame({
            'Patient': new_data_cleaned['patientnumber'],
            'Isolation_Forest_Anomaly': isolation_scores == -1,
            'Distance_Based_Anomaly': distance_anomalies
        })
        
        # Detailed feature-wise anomaly breakdown
        for col in numerical_cols:
            anomaly_results[f'{col}_Z_Score'] = (
                abs(new_data_cleaned[col] - self.feature_stats[col]['mean']) 
                / self.feature_stats[col]['std']
            )
        
        return anomaly_results

def main():
    """
    Main function to demonstrate anomaly detection with two datasets.
    """
    try:
        # Check if command line arguments are provided
        if len(sys.argv) != 3:
            print(json.dumps({"error": "Expected 2 arguments: training_data_path and '-' for stdin"}))
            sys.exit(1)

        training_data_path = sys.argv[1]
        
        # Initialize anomaly detector with training data
        detector = AnomalyDetector(training_data_path)
        
        # Read new data from stdin
        new_data_buffer = sys.stdin.buffer.read()
        
        # Assess new data
        anomaly_results = detector.assess_new_data(new_data_buffer=new_data_buffer)
        
        # Convert results to JSON and print to stdout
        results_json = anomaly_results.to_dict(orient='records')
        print(json.dumps(results_json), flush=True)
    
    except Exception as e:
        print(json.dumps({"error": str(e)}), flush=True)
        sys.exit(1)

if __name__ == "__main__":
    main()