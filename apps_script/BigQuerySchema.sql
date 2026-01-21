-- 在 BigQuery Console 中运行此 SQL 以创建表
-- 请先创建一个数据集，例如 'market_data'

CREATE TABLE IF NOT EXISTS `just-zoo-484721-q6.market_data.market_data`
(
    timestamp TIMESTAMP NOT NULL OPTIONS(description="数据点的时间戳 (UTC)"),
    score FLOAT64 NOT NULL OPTIONS(description="恐慌贪婪指数分数 (0-100)"),
    rating STRING OPTIONS(description="评级文本 (e.g. Extreme Fear, Greed)"),
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP() OPTIONS(description="抓取写入时间")
)
PARTITION BY DATE(timestamp)
CLUSTER BY timestamp;
