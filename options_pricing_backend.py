from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from scipy.stats import norm
from scipy.optimize import minimize
import logging

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ==========================================
# INTEREST RATE MODELS
# ==========================================

class VasicekModel:
    """
    Vasicek Interest Rate Model
    dr = a(b - r)dt + σdW
    """
    
    def __init__(self, a=0.1, b=0.05, sigma=0.01):
        """
        Parameters:
        - a: speed of mean reversion
        - b: long-term mean level
        - sigma: volatility
        """
        self.a = a
        self.b = b
        self.sigma = sigma
    
    def simulate_path(self, r0, T, n_steps, n_paths=1):
        """
        Simulate interest rate paths
        
        Returns: array of shape (n_paths, n_steps + 1)
        """
        dt = T / n_steps
        paths = np.zeros((n_paths, n_steps + 1))
        paths[:, 0] = r0
        
        for t in range(n_steps):
            dW = np.random.normal(0, np.sqrt(dt), n_paths)
            dr = self.a * (self.b - paths[:, t]) * dt + self.sigma * dW
            paths[:, t + 1] = paths[:, t] + dr
        
        return paths
    
    def bond_price(self, r0, T, face_value=100):
        """Calculate zero-coupon bond price"""
        B = (1 - np.exp(-self.a * T)) / self.a
        A = np.exp((self.b - self.sigma**2 / (2 * self.a**2)) * (B - T) - 
                   (self.sigma**2 / (4 * self.a)) * B**2)
        return face_value * A * np.exp(-B * r0)


class HullWhiteModel:
    """
    Hull-White Interest Rate Model
    dr = (θ(t) - ar)dt + σdW
    """
    
    def __init__(self, a=0.1, sigma=0.01):
        """
        Parameters:
        - a: mean reversion speed
        - sigma: volatility
        """
        self.a = a
        self.sigma = sigma
    
    def theta(self, t, forward_rate):
        """Time-dependent drift term"""
        # Simplified: assuming constant forward rate curve
        return forward_rate + 0.5 * (self.sigma**2 / self.a) * (1 - np.exp(-2 * self.a * t))
    
    def simulate_path(self, r0, T, n_steps, forward_rate=0.05, n_paths=1):
        """Simulate interest rate paths"""
        dt = T / n_steps
        paths = np.zeros((n_paths, n_steps + 1))
        paths[:, 0] = r0
        
        for t in range(n_steps):
            time = t * dt
            theta_t = self.theta(time, forward_rate)
            dW = np.random.normal(0, np.sqrt(dt), n_paths)
            dr = (theta_t - self.a * paths[:, t]) * dt + self.sigma * dW
            paths[:, t + 1] = paths[:, t] + dr
        
        return paths


class BlackDermanToyModel:
    """
    Black-Derman-Toy (BDT) Short Rate Model
    d(ln r) = [θ(t) - (σ'(t)/σ(t))ln r]dt + σ(t)dW
    """
    
    def __init__(self, sigma=0.2):
        """
        Parameters:
        - sigma: volatility (can be time-dependent)
        """
        self.sigma = sigma
    
    def simulate_path(self, r0, T, n_steps, n_paths=1):
        """Simulate short rate paths using lognormal process"""
        dt = T / n_steps
        paths = np.zeros((n_paths, n_steps + 1))
        paths[:, 0] = r0
        
        for t in range(n_steps):
            dW = np.random.normal(0, np.sqrt(dt), n_paths)
            # Lognormal evolution
            paths[:, t + 1] = paths[:, t] * np.exp(
                (self.sigma**2 / 2) * dt + self.sigma * dW
            )
        
        return paths


# ==========================================
# OPTIONS PRICING MODELS
# ==========================================

class BlackScholesModel:
    """Black-Scholes Options Pricing Model"""
    
    @staticmethod
    def call_price(S, K, T, r, sigma):
        """
        Calculate European call option price
        
        Parameters:
        - S: current stock price
        - K: strike price
        - T: time to maturity (years)
        - r: risk-free interest rate
        - sigma: volatility
        """
        d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
        d2 = d1 - sigma * np.sqrt(T)
        
        call = S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)
        return call
    
    @staticmethod
    def put_price(S, K, T, r, sigma):
        """Calculate European put option price"""
        d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
        d2 = d1 - sigma * np.sqrt(T)
        
        put = K * np.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)
        return put
    
    @staticmethod
    def greeks(S, K, T, r, sigma, option_type='call'):
        """Calculate option Greeks"""
        d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
        d2 = d1 - sigma * np.sqrt(T)
        
        # Delta
        if option_type == 'call':
            delta = norm.cdf(d1)
        else:
            delta = -norm.cdf(-d1)
        
        # Gamma (same for call and put)
        gamma = norm.pdf(d1) / (S * sigma * np.sqrt(T))
        
        # Vega (same for call and put)
        vega = S * norm.pdf(d1) * np.sqrt(T) / 100  # divided by 100 for percentage
        
        # Theta
        if option_type == 'call':
            theta = (-S * norm.pdf(d1) * sigma / (2 * np.sqrt(T)) - 
                    r * K * np.exp(-r * T) * norm.cdf(d2)) / 365
        else:
            theta = (-S * norm.pdf(d1) * sigma / (2 * np.sqrt(T)) + 
                    r * K * np.exp(-r * T) * norm.cdf(-d2)) / 365
        
        # Rho
        if option_type == 'call':
            rho = K * T * np.exp(-r * T) * norm.cdf(d2) / 100
        else:
            rho = -K * T * np.exp(-r * T) * norm.cdf(-d2) / 100
        
        return {
            'delta': delta,
            'gamma': gamma,
            'vega': vega,
            'theta': theta,
            'rho': rho
        }


class MonteCarloEngine:
    """Monte Carlo simulation engine for options pricing"""
    
    def __init__(self, n_simulations=10000, seed=42):
        """
        Parameters:
        - n_simulations: number of Monte Carlo paths
        - seed: random seed for reproducibility
        """
        self.n_simulations = n_simulations
        np.random.seed(seed)
    
    def price_european_option(self, S0, K, T, r, sigma, option_type='call', model='gbm'):
        """
        Price European option using Monte Carlo
        
        Parameters:
        - model: 'gbm' (Geometric Brownian Motion) or interest rate model
        """
        # Simulate stock price paths
        n_steps = int(T * 252)  # Daily steps
        dt = T / n_steps
        
        # Generate random paths
        Z = np.random.standard_normal((self.n_simulations, n_steps))
        
        # Initialize price array
        S = np.zeros((self.n_simulations, n_steps + 1))
        S[:, 0] = S0
        
        # Simulate GBM paths
        for t in range(n_steps):
            S[:, t + 1] = S[:, t] * np.exp((r - 0.5 * sigma**2) * dt + 
                                           sigma * np.sqrt(dt) * Z[:, t])
        
        # Calculate payoffs
        if option_type == 'call':
            payoffs = np.maximum(S[:, -1] - K, 0)
        else:
            payoffs = np.maximum(K - S[:, -1], 0)
        
        # Discount to present value
        option_price = np.exp(-r * T) * np.mean(payoffs)
        std_error = np.std(payoffs) / np.sqrt(self.n_simulations)
        
        return {
            'price': option_price,
            'std_error': std_error,
            'confidence_interval_95': [
                option_price - 1.96 * std_error,
                option_price + 1.96 * std_error
            ]
        }
    
    def price_with_interest_rate_model(self, S0, K, T, r0, sigma_stock, 
                                      option_type='call', rate_model='vasicek'):
        """Price option with stochastic interest rates"""
        n_steps = int(T * 252)
        dt = T / n_steps
        
        # Initialize models
        if rate_model == 'vasicek':
            ir_model = VasicekModel(a=0.1, b=0.05, sigma=0.01)
        elif rate_model == 'hull-white':
            ir_model = HullWhiteModel(a=0.1, sigma=0.01)
        else:  # black-derman-toy
            ir_model = BlackDermanToyModel(sigma=0.2)
        
        # Simulate rate paths
        rate_paths = ir_model.simulate_path(r0, T, n_steps, self.n_simulations)
        
        # Simulate stock price paths with stochastic rates
        S = np.zeros((self.n_simulations, n_steps + 1))
        S[:, 0] = S0
        
        for t in range(n_steps):
            r_t = rate_paths[:, t]
            dW = np.random.normal(0, np.sqrt(dt), self.n_simulations)
            S[:, t + 1] = S[:, t] * np.exp((r_t - 0.5 * sigma_stock**2) * dt + 
                                           sigma_stock * dW)
        
        # Calculate payoffs
        if option_type == 'call':
            payoffs = np.maximum(S[:, -1] - K, 0)
        else:
            payoffs = np.maximum(K - S[:, -1], 0)
        
        # Discount with path-dependent rates
        discount_factors = np.exp(-np.sum(rate_paths[:, :-1] * dt, axis=1))
        option_price = np.mean(payoffs * discount_factors)
        std_error = np.std(payoffs * discount_factors) / np.sqrt(self.n_simulations)
        
        return {
            'price': option_price,
            'std_error': std_error,
            'model_used': rate_model
        }


# ==========================================
# API ENDPOINTS
# ==========================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Options Pricing Platform API is running'
    })


@app.route('/api/price/black-scholes', methods=['POST'])
def price_black_scholes():
    """
    Calculate option price using Black-Scholes model
    
    Request body:
    {
        "stock_price": 100,
        "strike_price": 105,
        "time_to_maturity": 1.0,
        "risk_free_rate": 0.05,
        "volatility": 0.2,
        "option_type": "call"
    }
    """
    try:
        data = request.get_json()
        
        # Validate inputs
        S = float(data['stock_price'])
        K = float(data['strike_price'])
        T = float(data['time_to_maturity'])
        r = float(data['risk_free_rate'])
        sigma = float(data['volatility'])
        option_type = data.get('option_type', 'call').lower()
        
        # Calculate price
        if option_type == 'call':
            price = BlackScholesModel.call_price(S, K, T, r, sigma)
        else:
            price = BlackScholesModel.put_price(S, K, T, r, sigma)
        
        # Calculate Greeks
        greeks = BlackScholesModel.greeks(S, K, T, r, sigma, option_type)
        
        return jsonify({
            'success': True,
            'model': 'Black-Scholes',
            'option_type': option_type,
            'price': round(price, 4),
            'greeks': {k: round(v, 6) for k, v in greeks.items()},
            'inputs': data
        })
        
    except Exception as e:
        logger.error(f"Error in Black-Scholes calculation: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400


@app.route('/api/price/monte-carlo', methods=['POST'])
def price_monte_carlo():
    """
    Calculate option price using Monte Carlo simulation
    
    Request body:
    {
        "stock_price": 100,
        "strike_price": 105,
        "time_to_maturity": 1.0,
        "risk_free_rate": 0.05,
        "volatility": 0.2,
        "option_type": "call",
        "n_simulations": 10000
    }
    """
    try:
        data = request.get_json()
        
        S0 = float(data['stock_price'])
        K = float(data['strike_price'])
        T = float(data['time_to_maturity'])
        r = float(data['risk_free_rate'])
        sigma = float(data['volatility'])
        option_type = data.get('option_type', 'call').lower()
        n_sims = int(data.get('n_simulations', 10000))
        
        # Run Monte Carlo
        mc_engine = MonteCarloEngine(n_simulations=n_sims)
        result = mc_engine.price_european_option(S0, K, T, r, sigma, option_type)
        
        return jsonify({
            'success': True,
            'model': 'Monte Carlo',
            'option_type': option_type,
            'price': round(result['price'], 4),
            'std_error': round(result['std_error'], 6),
            'confidence_interval_95': [round(x, 4) for x in result['confidence_interval_95']],
            'n_simulations': n_sims,
            'inputs': data
        })
        
    except Exception as e:
        logger.error(f"Error in Monte Carlo calculation: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400


@app.route('/api/price/interest-rate-models', methods=['POST'])
def price_with_ir_models():
    """
    Calculate option price using interest rate models
    
    Request body:
    {
        "stock_price": 100,
        "strike_price": 105,
        "time_to_maturity": 1.0,
        "initial_rate": 0.05,
        "stock_volatility": 0.2,
        "option_type": "call",
        "rate_model": "vasicek",  // or "hull-white", "black-derman-toy"
        "n_simulations": 10000
    }
    """
    try:
        data = request.get_json()
        
        S0 = float(data['stock_price'])
        K = float(data['strike_price'])
        T = float(data['time_to_maturity'])
        r0 = float(data['initial_rate'])
        sigma = float(data['stock_volatility'])
        option_type = data.get('option_type', 'call').lower()
        rate_model = data.get('rate_model', 'vasicek').lower()
        n_sims = int(data.get('n_simulations', 10000))
        
        # Run pricing with stochastic rates
        mc_engine = MonteCarloEngine(n_simulations=n_sims)
        result = mc_engine.price_with_interest_rate_model(
            S0, K, T, r0, sigma, option_type, rate_model
        )
        
        return jsonify({
            'success': True,
            'model': f'Monte Carlo with {rate_model.title()} rates',
            'option_type': option_type,
            'price': round(result['price'], 4),
            'std_error': round(result['std_error'], 6),
            'rate_model': result['model_used'],
            'n_simulations': n_sims,
            'inputs': data
        })
        
    except Exception as e:
        logger.error(f"Error in IR model calculation: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400


@app.route('/api/simulate/interest-rates', methods=['POST'])
def simulate_interest_rates():
    """
    Simulate interest rate paths
    
    Request body:
    {
        "initial_rate": 0.05,
        "time_horizon": 1.0,
        "n_steps": 100,
        "n_paths": 5,
        "model": "vasicek"  // or "hull-white", "black-derman-toy"
    }
    """
    try:
        data = request.get_json()
        
        r0 = float(data['initial_rate'])
        T = float(data['time_horizon'])
        n_steps = int(data.get('n_steps', 100))
        n_paths = int(data.get('n_paths', 5))
        model_type = data.get('model', 'vasicek').lower()
        
        # Initialize model
        if model_type == 'vasicek':
            model = VasicekModel(a=0.1, b=0.05, sigma=0.01)
        elif model_type == 'hull-white':
            model = HullWhiteModel(a=0.1, sigma=0.01)
        else:  # black-derman-toy
            model = BlackDermanToyModel(sigma=0.2)
        
        # Simulate paths
        paths = model.simulate_path(r0, T, n_steps, n_paths)
        
        # Create time points
        time_points = np.linspace(0, T, n_steps + 1).tolist()
        
        return jsonify({
            'success': True,
            'model': model_type,
            'time_points': time_points,
            'paths': paths.tolist(),
            'inputs': data
        })
        
    except Exception as e:
        logger.error(f"Error simulating interest rates: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400


@app.route('/api/compare', methods=['POST'])
def compare_models():
    """
    Compare prices across different models
    
    Request body:
    {
        "stock_price": 100,
        "strike_price": 105,
        "time_to_maturity": 1.0,
        "risk_free_rate": 0.05,
        "volatility": 0.2,
        "option_type": "call",
        "models": ["black-scholes", "monte-carlo", "vasicek", "hull-white", "black-derman-toy"]
    }
    """
    try:
        data = request.get_json()
        
        S0 = float(data['stock_price'])
        K = float(data['strike_price'])
        T = float(data['time_to_maturity'])
        r = float(data['risk_free_rate'])
        sigma = float(data['volatility'])
        option_type = data.get('option_type', 'call').lower()
        models_to_compare = data.get('models', ['black-scholes', 'monte-carlo'])
        
        results = {}
        
        # Black-Scholes
        if 'black-scholes' in models_to_compare:
            if option_type == 'call':
                bs_price = BlackScholesModel.call_price(S0, K, T, r, sigma)
            else:
                bs_price = BlackScholesModel.put_price(S0, K, T, r, sigma)
            results['Black-Scholes'] = round(bs_price, 4)
        
        # Monte Carlo
        if 'monte-carlo' in models_to_compare:
            mc_engine = MonteCarloEngine(n_simulations=10000)
            mc_result = mc_engine.price_european_option(S0, K, T, r, sigma, option_type)
            results['Monte Carlo'] = round(mc_result['price'], 4)
        
        # Interest rate models
        mc_engine = MonteCarloEngine(n_simulations=5000)  # Fewer sims for speed
        
        for model_name in ['vasicek', 'hull-white', 'black-derman-toy']:
            if model_name in models_to_compare:
                ir_result = mc_engine.price_with_interest_rate_model(
                    S0, K, T, r, sigma, option_type, model_name
                )
                results[model_name.title().replace('-', ' ')] = round(ir_result['price'], 4)
        
        return jsonify({
            'success': True,
            'comparison': results,
            'inputs': data
        })
        
    except Exception as e:
        logger.error(f"Error in model comparison: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400


if __name__ == '__main__':
    logger.info("Starting Options Pricing Platform API...")
    app.run(debug=True, host='0.0.0.0', port=5000)