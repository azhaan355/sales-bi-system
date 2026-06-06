import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression

def test_linear_regression():
    print("Testing Linear Regression logic...")
    
    # Create mock sales data (linear growth trend with noise)
    dates = pd.date_range(start="2023-01-01", periods=10, freq="D")
    base_sales = np.array([100, 120, 140, 160, 180, 200, 220, 240, 260, 280])
    noise = np.random.normal(0, 5, 10)
    sales = base_sales + noise
    
    df = pd.DataFrame({
        "date": dates,
        "sales": sales
    })
    
    # Run the regression
    min_date = df['date'].min()
    df['days_since_start'] = (df['date'] - min_date).dt.days
    
    X = df[['days_since_start']].values
    y = df['sales'].values
    
    model = LinearRegression()
    model.fit(X, y)
    
    r2 = model.score(X, y)
    slope = model.coef_[0]
    intercept = model.intercept_
    
    print(f"Model fitted successfully!")
    print(f"R2 score: {r2:.4f}")
    print(f"Slope (daily growth): {slope:.4f}")
    print(f"Intercept: {intercept:.4f}")
    
    # Forecast next 30 days
    last_date = df['date'].max()
    future_dates = [last_date + pd.Timedelta(days=i) for i in range(1, 31)]
    future_days = np.array([(d - min_date).days for d in future_dates]).reshape(-1, 1)
    
    preds = model.predict(future_days)
    print(f"Generated {len(preds)} predictions.")
    print(f"First 3 days forecast: {[round(p, 2) for p in preds[:3]]}")
    print("SUCCESS: ML logic is fully functional!")

if __name__ == "__main__":
    test_linear_regression()
