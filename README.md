# BUSINESS INTELLIGENCE SYSTEM FOR SALES DATA ANALYSIS AND VISUALIZATION

A complete, responsive, full-stack Business Intelligence (BI) dashboard designed as a Final Year Engineering Project. This application provides real-time sales performance metrics, CSV data cleaning and upload capabilities, interactive Recharts graphs, tabular reports (CSV and vector PDF export), and a Machine Learning forecasting module running Linear Regression.

---

## 🛠️ Tech Stack
* **Frontend**: React.js (scaffolded via Vite), Tailwind CSS, Recharts, Axios, Lucide Icons, jsPDF.
* **Backend**: Node.js, Express.js (MVC Architecture), Multer, CSV Parser, mysql2.
* **Database**: MySQL.
* **Machine Learning**: Python, Pandas, Scikit-Learn, Flask, Flask-CORS.

---

## 📁 Project Directory Structure
```
sales/
├── backend/                  # Node.js Express MVC API
│   ├── config/               # Database connectors pool
│   ├── controllers/          # Business logic (auth, sales aggregations)
│   ├── middleware/           # JWT security guards
│   ├── models/               # SQL queries (User, Sales)
│   ├── routes/               # Express routing tables
│   ├── utils/                # CSV Parsing and data cleaning
│   ├── uploads/              # Temp storage for parsed CSVs
│   ├── .env                  # Environment secrets
│   └── server.js             # API entrypoint
│
├── ml-service/               # Python Flask ML forecasting
│   ├── app.py                # Flask listener
│   ├── test_ml.py            # Local model testing script
│   └── requirements.txt      # Pip dependencies
│
├── frontend/                 # React SPA (Vite + Tailwind)
│   ├── public/               # Static assets & sample CSV download
│   ├── src/
│   │   ├── components/       # Layouts, ProtectedRoute, Filter panels, KPIs
│   │   ├── pages/            # Login, Register, Dashboard, Forecast, Reports
│   │   ├── services/         # Axios config with JWT interceptors
│   │   ├── index.css         # Tailwind & glassmorphism styling
│   │   ├── main.jsx          # React entry
│   │   └── App.jsx           # React Router
│   ├── tailwind.config.js    # Custom brand styling colors
│   └── postcss.config.js
│
├── schema.sql                # MySQL DB schema definition
└── README.md                 # Setup & Installation documentation
```

---

## 🚀 Setup and Installation Guide

### Phase 1: Database Setup
1. Open your MySQL client (MySQL CLI, WorkBench, or phpMyAdmin on XAMPP/WAMP).
2. Execute the queries inside the `schema.sql` file at the root of the project to initialize the database and tables:
   ```sql
   source /path/to/schema.sql;
   ```
   Or copy-paste the contents of [schema.sql](schema.sql) directly into your MySQL script window.

### Phase 2: Python ML Microservice Setup
1. Open a new terminal window and navigate to the `ml-service/` folder:
   ```bash
   cd ml-service
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install the required libraries:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the ML service on port `5000`:
   ```bash
   python app.py
   ```

### Phase 3: Backend Node.js API Setup
1. Open a new terminal window and navigate to the `backend/` folder:
   ```bash
   cd backend
   ```
2. If needed, configure the `.env` file to match your local MySQL credentials:
   * `DB_HOST=localhost`
   * `DB_USER=root`
   * `DB_PASSWORD=your_password`
   * `DB_NAME=sales_bi_db`
3. Launch the Express server:
   ```bash
   npm run dev
   # Runs on http://localhost:8080
   ```

### Phase 4: Frontend React Setup
1. Open a new terminal window and navigate to the `frontend/` folder:
   ```bash
   cd frontend
   ```
2. Launch the Vite development server:
   ```bash
   npm run dev
   # Runs on http://localhost:5173
   ```

---

## 📈 System Walkthrough & User Guide
1. **Account Registration**: Navigate to `http://localhost:5173/register` and create an account.
2. **Login**: Login with your credentials. You will be redirected to the main dashboard.
3. **Data Import**: 
   - Since the database is initially empty, the dashboard will show a placeholder prompt.
   - Click the **Download Sample CSV** link to download a clean test file containing 25 pre-formatted records.
   - Select the file and click **Upload Sales CSV**. The backend will automatically handle:
     - Header normalization (e.g. converting `Order Date` or `Order ID` labels).
     - Missing numeric details (defaulting blank cells to `0`).
     - In-memory checks to skip duplicates.
4. **Analytics**: Adjust filters (date range, category, region) in the filter panel. All KPI indicators and Recharts trends (monthly sales, profit ratios, regional bars) will refresh dynamically.
5. **ML Sales Forecasting**: 
   - Navigate to the **Forecasting** page via the sidebar.
   - The system queries the Flask ML microservice.
   - The microservice computes a linear regression fit ($y = mx + c$) on the daily aggregated historical sales and predicts future sales for the next 30 days.
   - A graph renders showing historical sales (solid line) and projected forecasts (dashed line).
   - An interactive table lists the exact predicted numbers.
6. **Reports Generation**: 
   - Navigate to the **Reports** page.
   - Filter down the logs.
   - Click **Export Filtered CSV** to download the exact search query segment as a CSV sheet.
   - Click **Export PDF Summary** to download a clean vector PDF report containing calculated margins, totals, and transactional segments.

---

## 💡 Viva / Project Defense Q&A Prep

### Q: Why did you use Linear Regression for forecasting?
> **Answer**: Linear Regression is a transparent, mathematically sound baseline model suited for projecting sales trends based on time. It is highly interpretable, runs with minimal computational overhead, and serves as an excellent demonstration of statistical modeling ($y = mx + c$) without overengineering with deep learning networks like LSTMs for simple college demonstrations.

### Q: How is the time dimension fed into Scikit-Learn?
> **Answer**: Dates are parsed into Pandas. We compute the minimum date in the uploaded range, and for each row, calculate the numeric `days_since_start` offset. These integer offsets act as the independent feature $X$, and the daily sales volume acts as the target label $y$.

### Q: How does the application handle duplicate entries and data cleaning?
> **Answer**: The CSV ingestion pipeline in the Node backend normalizes spreadsheet headings to lower snake_case. If a row lacks critical keys (like `Order Date` or `Order ID`), it is skipped. The parser filters internal duplicates within the file, and then runs an in-memory set check against previously saved orders to prevent double-inserting records.
