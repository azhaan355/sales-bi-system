import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.linear_model import LinearRegression

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "OK", "message": "ML Forecasting microservice is running."})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        if not data or 'historical' not in data:
            return jsonify({"error": "Missing 'historical' data key in request body."}), 400

        historical_list = data['historical']
        if len(historical_list) < 5:
            return jsonify({"error": "Insufficient data. Need at least 5 points to build a linear regression model."}), 400

        # Load into Pandas DataFrame
        df = pd.DataFrame(historical_list)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date').reset_index(drop=True)

        # Convert date to numerical representation: Days since start date
        min_date = df['date'].min()
        df['days_since_start'] = (df['date'] - min_date).dt.days

        # Reshape for scikit-learn
        X = df[['days_since_start']].values
        y = df['sales'].values

        # Build and fit Linear Regression model
        model = LinearRegression()
        model.fit(X, y)

        # Calculate model evaluation metrics
        r_squared = model.score(X, y)
        slope = model.coef_[0]
        intercept = model.intercept_

        # Forecast the next 30 days
        last_date = df['date'].max()
        future_dates = [last_date + pd.Timedelta(days=i) for i in range(1, 31)]
        
        future_days = np.array([(d - min_date).days for d in future_dates]).reshape(-1, 1)
        future_predictions = model.predict(future_days)
        
        # Ensure we don't return negative sales
        future_predictions = np.maximum(0, future_predictions)

        # Prepare forecast response
        forecast_result = []
        for d, val in zip(future_dates, future_predictions):
            forecast_result.append({
                "date": d.strftime('%Y-%m-%d'),
                "sales": round(float(val), 2)
            })

        # Prepare historical data for output (as standard strings)
        historical_result = []
        for _, row in df.iterrows():
            historical_result.append({
                "date": row['date'].strftime('%Y-%m-%d'),
                "sales": round(float(row['sales']), 2)
            })

        return jsonify({
            "historical": historical_result,
            "forecast": forecast_result,
            "metrics": {
                "r2_score": round(float(r_squared), 4),
                "slope": round(float(slope), 4),
                "intercept": round(float(intercept), 4)
            }
        })

    except Exception as e:
        print("ML prediction error:", str(e))
        return jsonify({"error": "Failed to generate prediction.", "details": str(e)}), 500

if __name__ == '__main__':
    # Run the server on port 5000
    app.run(host='0.0.0.0', port=5000, debug=True)
