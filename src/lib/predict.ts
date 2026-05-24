export interface PredictResult {
  predicted: number;
  lower: number;
  upper: number;
  trend: number;
}

// Holt's Double Exponential Smoothing — handles level + trend for daily price series.
// alpha smooths the level, beta smooths the trend.
export function holtsPredict(
  prices: number[],
  alpha = 0.3,
  beta = 0.1,
): PredictResult {
  if (prices.length < 2) throw new Error("Minimum 2 data points required");

  let level = prices[0];
  let trend = prices[1] - prices[0];
  const residuals: number[] = [];

  for (let i = 1; i < prices.length; i++) {
    const forecast = level + trend;
    residuals.push(prices[i] - forecast);
    const prevLevel = level;
    level = alpha * prices[i] + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
  }

  const predicted = Math.round(level + trend);
  const rmse = Math.sqrt(
    residuals.reduce((s, r) => s + r * r, 0) / residuals.length,
  );
  const margin = Math.round(1.96 * rmse);

  return {
    predicted,
    lower: predicted - margin,
    upper: predicted + margin,
    trend: Math.round(trend),
  };
}
