# Options Pricing Platform

![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)
![React](https://img.shields.io/badge/React-18.2-blue.svg)
![Flask](https://img.shields.io/badge/Flask-3.0-green.svg)

An advanced financial platform for options pricing using multiple interest rate models including **Black-Derman-Toy**, **Vasicek**, and **Hull-White** models with **Monte Carlo simulations**.

## 🎯 Features

### Core Capabilities
- ✅ **Black-Scholes Model** - Classical analytical solution for European options
- ✅ **Monte Carlo Simulation** - 10,000+ simulations for accurate pricing
- ✅ **Interest Rate Models**:
  - Vasicek Model
  - Hull-White Model  
  - Black-Derman-Toy Model
- ✅ **Option Greeks** - Delta, Gamma, Vega, Theta, Rho calculations
- ✅ **Real-time Pricing** - Instant calculations with user input
- ✅ **Model Comparison** - Side-by-side comparison of all models
- ✅ **Interest Rate Simulation** - Visualize stochastic rate paths
- ✅ **Interactive Visualizations** - Charts and graphs with Recharts

### Technical Features
- 📊 **Data Visualization** - Interactive charts for comparison and simulation
- ⚡ **Fast API** - Flask backend with RESTful endpoints
- 🎨 **Modern UI** - React frontend with Tailwind CSS
- 📈 **Statistical Analysis** - Confidence intervals and standard errors
- 🔬 **Rate Bootstrapping** - Spline and Nelson-Siegel interpolation methods

## 🛠️ Installation

### Prerequisites
- Python 3.8 or higher
- Node.js 14 or higher
- npm or yarn


## 🚀 Usage

### 1. Basic Option Pricing

1. Enter parameters in the left panel:
   - Stock Price (S)
   - Strike Price (K)
   - Time to Maturity
   - Risk-Free Rate
   - Volatility
   - Option Type (Call/Put)

2. Click on a pricing model button:
   - **Black-Scholes** for analytical solution
   - **Monte Carlo** for simulation-based pricing

3. View results including:
   - Option price
   - Greeks (Delta, Gamma, Vega, Theta, Rho)
   - Confidence intervals (for Monte Carlo)

### 2. Model Comparison

1. Go to the "Model Comparison" tab
2. Click "Run Comparison"
3. View bar chart comparing all models
4. See price differences across models

### 3. Interest Rate Simulation

1. Go to the "Rate Simulation" tab
2. Select an interest rate model:
   - Vasicek
   - Hull-White
   - Black-Derman-Toy
3. View simulated rate paths over time

## 📊 Models Explained

### Black-Scholes Model
The classical option pricing formula:
- **Assumptions**: Constant volatility and interest rates, no dividends, European exercise
- **Advantages**: Fast, analytical solution, produces Greeks
- **Use Case**: Quick estimates, standard European options

### Monte Carlo Simulation
Simulates thousands of price paths:
- **Method**: Geometric Brownian Motion with 10,000+ paths
- **Advantages**: Flexible, handles complex payoffs, provides confidence intervals
- **Use Case**: Exotic options, path-dependent features

### Vasicek Model
Mean-reverting interest rate model:
- **Formula**: dr = a(b - r)dt + σdW
- **Characteristics**: Rates can go negative, mean reversion
- **Use Case**: Government bonds, stable rate environments

### Hull-White Model
Extended Vasicek with time-dependent parameters:
- **Formula**: dr = (θ(t) - ar)dt + σdW  
- **Characteristics**: Fits current term structure, more flexible
- **Use Case**: Calibrating to market data, term structure modeling

### Black-Derman-Toy Model
Lognormal short rate model:
- **Characteristics**: Rates always positive, volatility term structure
- **Advantages**: No negative rates, industry standard
- **Use Case**: Interest rate derivatives, caps and floors


## 🎓 Mathematical Background

### Black-Scholes Formula
```
C = S₀N(d₁) - Ke⁻ʳᵀN(d₂)
P = Ke⁻ʳᵀN(-d₂) - S₀N(-d₁)

where:
d₁ = [ln(S₀/K) + (r + σ²/2)T] / (σ√T)
d₂ = d₁ - σ√T
```

### Monte Carlo Payoff
```
Option Price = e⁻ʳᵀ × (1/N) × Σ max(Sᵢ - K, 0)
```

### Vasicek SDE
```
dr(t) = a[b - r(t)]dt + σdW(t)
```

## 🛡️ Error Handling

The API includes comprehensive error handling:
- **400 Bad Request**: Invalid input parameters
- **500 Internal Server Error**: Calculation errors
- Input validation for all parameters
- Graceful fallback for failed calculations

## 📚 References

- Black, F., & Scholes, M. (1973). "The Pricing of Options and Corporate Liabilities"
- Hull, J., & White, A. (1990). "Pricing Interest-Rate-Derivative Securities"
- Vasicek, O. (1977). "An Equilibrium Characterization of the Term Structure"
- Black, F., Derman, E., & Toy, W. (1990). "A One-Factor Model of Interest Rates"

## 🚧 Future Enhancements

- [ ] Add American option pricing
- [ ] Implement binomial tree model
- [ ] Add exotic options (Asian, Barrier, Lookback)
- [ ] Real-time market data integration
- [ ] Portfolio optimization tools
- [ ] Historical volatility calculation
- [ ] Implied volatility surface visualization
- [ ] Save and load calculation history



