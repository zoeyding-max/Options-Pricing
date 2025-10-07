import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Calculator, TrendingUp, Activity, DollarSign, Info } from 'lucide-react';

const OptionsPricingPlatform = () => {
  const [inputs, setInputs] = useState({
    stockPrice: 100,
    strikePrice: 105,
    timeToMaturity: 1.0,
    riskFreeRate: 0.05,
    volatility: 0.2,
    optionType: 'call'
  });

  const [results, setResults] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [simulationData, setSimulationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pricing');

  const API_URL = 'http://localhost:5000/api';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: name === 'optionType' ? value : parseFloat(value) || value
    }));
  };

  const calculatePrice = async (model) => {
    setLoading(true);
    try {
      const endpoint = model === 'black-scholes' ? 
        `${API_URL}/price/black-scholes` : 
        `${API_URL}/price/monte-carlo`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stock_price: inputs.stockPrice,
          strike_price: inputs.strikePrice,
          time_to_maturity: inputs.timeToMaturity,
          risk_free_rate: inputs.riskFreeRate,
          volatility: inputs.volatility,
          option_type: inputs.optionType,
          n_simulations: 10000
        })
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to calculate price. Make sure the backend server is running.');
    }
    setLoading(false);
  };

  const compareModels = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stock_price: inputs.stockPrice,
          strike_price: inputs.strikePrice,
          time_to_maturity: inputs.timeToMaturity,
          risk_free_rate: inputs.riskFreeRate,
          volatility: inputs.volatility,
          option_type: inputs.optionType,
          models: ['black-scholes', 'monte-carlo', 'vasicek', 'hull-white', 'black-derman-toy']
        })
      });

      const data = await response.json();
      const chartData = Object.entries(data.comparison).map(([model, price]) => ({
        model,
        price
      }));
      setComparison(chartData);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const simulateRates = async (model) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/simulate/interest-rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initial_rate: inputs.riskFreeRate,
          time_horizon: inputs.timeToMaturity,
          n_steps: 100,
          n_paths: 5,
          model: model
        })
      });

      const data = await response.json();
      
      const chartData = data.time_points.map((time, idx) => {
        const point = { time: time.toFixed(2) };
        data.paths.forEach((path, pathIdx) => {
          point[`Path ${pathIdx + 1}`] = path[idx];
        });
        return point;
      });
      
      setSimulationData(chartData);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Options Pricing Platform
              </h1>
              <p className="text-gray-600 mt-1">Advanced financial modeling with multiple interest rate models</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl mb-8">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('pricing')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'pricing' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-600 hover:text-blue-500'
              }`}
            >
              <Calculator className="inline w-5 h-5 mr-2" />
              Pricing Calculator
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'comparison' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-600 hover:text-blue-500'
              }`}
            >
              <Activity className="inline w-5 h-5 mr-2" />
              Model Comparison
            </button>
            <button
              onClick={() => setActiveTab('simulation')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'simulation' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-600 hover:text-blue-500'
              }`}
            >
              <TrendingUp className="inline w-5 h-5 mr-2" />
              Rate Simulation
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-blue-500" />
                Input Parameters
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Stock Price (S)
                  </label>
                  <input
                    type="number"
                    name="stockPrice"
                    value={inputs.stockPrice}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Strike Price (K)
                  </label>
                  <input
                    type="number"
                    name="strikePrice"
                    value={inputs.strikePrice}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Time to Maturity (Years)
                  </label>
                  <input
                    type="number"
                    name="timeToMaturity"
                    value={inputs.timeToMaturity}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Risk-Free Rate (r)
                  </label>
                  <input
                    type="number"
                    name="riskFreeRate"
                    value={inputs.riskFreeRate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                    step="0.001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Volatility (σ)
                  </label>
                  <input
                    type="number"
                    name="volatility"
                    value={inputs.volatility}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Option Type
                  </label>
                  <select
                    name="optionType"
                    value={inputs.optionType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  >
                    <option value="call">Call Option</option>
                    <option value="put">Put Option</option>
                  </select>
                </div>

                <div className="pt-4 border-t">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-800">
                        Adjust parameters above to see how option prices change across different models.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {activeTab === 'pricing' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Select Pricing Model</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => calculatePrice('black-scholes')}
                      disabled={loading}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                      {loading ? 'Calculating...' : 'Black-Scholes Model'}
                    </button>
                    <button
                      onClick={() => calculatePrice('monte-carlo')}
                      disabled={loading}
                      className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-6 py-4 rounded-xl font-semibold hover:from-indigo-600 hover:to-indigo-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                      {loading ? 'Calculating...' : 'Monte Carlo Simulation'}
                    </button>
                  </div>
                </div>

                {results && results.success && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
                      <h3 className="text-xl font-semibold mb-2 opacity-90">Option Price</h3>
                      <div className="text-5xl font-bold mb-2">${results.price}</div>
                      <p className="text-blue-100">Using {results.model} Model</p>
                      {results.confidence_interval_95 && (
                        <div className="mt-4 pt-4 border-t border-blue-400">
                          <p className="text-sm opacity-90">95% Confidence Interval:</p>
                          <p className="font-semibold">
                            ${results.confidence_interval_95[0].toFixed(4)} - ${results.confidence_interval_95[1].toFixed(4)}
                          </p>
                        </div>
                      )}
                    </div>

                    {results.greeks && (
                      <div className="bg-white rounded-2xl shadow-xl p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-6">Option Greeks</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {Object.entries(results.greeks).map(([greek, value]) => (
                            <div key={greek} className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl">
                              <div className="text-sm font-semibold text-gray-600 uppercase mb-1">
                                {greek}
                              </div>
                              <div className="text-2xl font-bold text-gray-800">
                                {value.toFixed(6)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {results.std_error && (
                      <div className="bg-white rounded-2xl shadow-xl p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Simulation Statistics</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                            <div className="text-sm font-semibold text-purple-600 mb-1">Standard Error</div>
                            <div className="text-xl font-bold text-purple-900">{results.std_error.toFixed(6)}</div>
                          </div>
                          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                            <div className="text-sm font-semibold text-green-600 mb-1">Simulations</div>
                            <div className="text-xl font-bold text-green-900">{results.n_simulations?.toLocaleString() || '10,000'}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'comparison' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Compare All Models</h3>
                  <button
                    onClick={compareModels}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-4 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {loading ? 'Comparing Models...' : 'Run Comparison'}
                  </button>
                </div>

                {comparison && (
                  <div className="bg-white rounded-2xl shadow-xl p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">Price Comparison</h3>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={comparison}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="model" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="price" fill="#6366f1" />
                      </BarChart>
                    </ResponsiveContainer>
                    
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {comparison.map((item) => (
                        <div key={item.model} className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl">
                          <div className="text-sm font-semibold text-indigo-600 mb-1">{item.model}</div>
                          <div className="text-2xl font-bold text-indigo-900">${item.price.toFixed(4)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'simulation' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Simulate Interest Rate Paths</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => simulateRates('vasicek')}
                      disabled={loading}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                      Vasicek Model
                    </button>
                    <button
                      onClick={() => simulateRates('hull-white')}
                      disabled={loading}
                      className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-4 rounded-xl font-semibold hover:from-orange-600 hover:to-red-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                      Hull-White Model
                    </button>
                    <button
                      onClick={() => simulateRates('black-derman-toy')}
                      disabled={loading}
                      className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-4 rounded-xl font-semibold hover:from-purple-600 hover:to-indigo-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                      Black-Derman-Toy
                    </button>
                  </div>
                </div>

                {simulationData && (
                  <div className="bg-white rounded-2xl shadow-xl p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">Interest Rate Simulation Paths</h3>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={simulationData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" label={{ value: 'Time (Years)', position: 'insideBottom', offset: -5 }} />
                        <YAxis label={{ value: 'Interest Rate', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="Path 1" stroke="#3b82f6" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="Path 2" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="Path 3" stroke="#ec4899" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="Path 4" stroke="#10b981" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="Path 5" stroke="#f59e0b" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        This chart shows 5 simulated paths of interest rates over time using the selected stochastic model.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">About the Models</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <h4 className="font-semibold text-blue-600 mb-2">Black-Scholes</h4>
              <p className="text-gray-600">
                Analytical solution assuming constant volatility and interest rates. Fast and accurate for European options.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-indigo-600 mb-2">Monte Carlo</h4>
              <p className="text-gray-600">
                Simulates thousands of price paths to estimate option value. Flexible for complex payoffs.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-purple-600 mb-2">Interest Rate Models</h4>
              <p className="text-gray-600">
                Vasicek, Hull-White, and Black-Derman-Toy models incorporate stochastic interest rates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptionsPricingPlatform;