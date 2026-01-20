import React, { createContext, useContext, useState } from 'react';

export type Language = 'en' | 'zh' | 'tw';

interface Translations {
  title: string;
  fear: string;
  greed: string;
  neutral: string;
  now: string;
  yesterday: string;
  lastWeek: string;
  lastMonth: string;
  nextUpdate: string;
  // Chart periods
  day: string;
  week: string;
  month: string;
  year: string;
  threeDays: string;
  // Sub-indicators
  marketMomentum: string;
  stockPriceStrength: string;
  stockPriceBreadth: string;
  putCallOptions: string;
  marketVolatility: string;
  safeHavenDemand: string;
  junkBondDemand: string;
  // Descriptions
  marketMomentumDesc: string;
  stockPriceStrengthDesc: string;
  stockPriceBreadthDesc: string;
  putCallOptionsDesc: string;
  marketVolatilityDesc: string;
  safeHavenDemandDesc: string;
  junkBondDemandDesc: string;
}

const translations: Record<Language, Translations> = {
  en: {
    title: "CNN Fear & Greed Index",
    fear: "Fear",
    greed: "Greed",
    neutral: "Neutral",
    now: "Now",
    yesterday: "Yesterday",
    lastWeek: "Last Week",
    lastMonth: "Last Month",
    nextUpdate: "Next Update",
    day: "1D",
    threeDays: "3D",
    week: "1W",
    month: "1M",
    year: "1Y",
    // Sub-indicators
    marketMomentum: "Market Momentum",
    stockPriceStrength: "Stock Price Strength",
    stockPriceBreadth: "Stock Price Breadth",
    putCallOptions: "Put and Call Options",
    marketVolatility: "Market Volatility",
    safeHavenDemand: "Safe Haven Demand",
    junkBondDemand: "Junk Bond Demand",
    // Descriptions (Simplified)
    marketMomentumDesc: "S&P 500 vs 125-day Moving Average",
    stockPriceStrengthDesc: "Net New Highs vs Lows",
    stockPriceBreadthDesc: "McClellan Volume Summation Index",
    putCallOptionsDesc: "CBOE 5-Day Put/Call Ratio",
    marketVolatilityDesc: "VIX and 50-day Moving Average",
    safeHavenDemandDesc: "Difference in Stock vs Bond Returns",
    junkBondDemandDesc: "Yield Spread: Junk vs Investment Grade",
  },
  zh: {
    title: "CNN 恐慌与贪婪指数",
    fear: "恐慌",
    greed: "贪婪",
    neutral: "中性",
    now: "当前",
    yesterday: "昨日",
    lastWeek: "上周",
    lastMonth: "上月",
    nextUpdate: "下次更新",
    day: "1日",
    threeDays: "3日",
    week: "1周",
    month: "1月",
    year: "1年",
    // Sub-indicators
    marketMomentum: "市场动量",
    stockPriceStrength: "股价强度",
    stockPriceBreadth: "股价广度",
    putCallOptions: "看涨看跌期权",
    marketVolatility: "市场波动率",
    safeHavenDemand: "避险需求",
    junkBondDemand: "垃圾债需求",
    // Descriptions
    marketMomentumDesc: "标普500 vs 125日均线",
    stockPriceStrengthDesc: "52周新高 vs 新低",
    stockPriceBreadthDesc: "麦克莱伦成交量汇总指数",
    putCallOptionsDesc: "CBOE 5日看跌/看涨比率",
    marketVolatilityDesc: "VIX 与 50日移动平均线",
    safeHavenDemandDesc: "股票与债券回报率之差",
    junkBondDemandDesc: "垃圾债与投资级债券收益率差",
  },
  tw: {
    title: "CNN 恐慌與貪婪指數",
    fear: "恐慌",
    greed: "貪婪",
    neutral: "中性",
    now: "當前",
    yesterday: "昨日",
    lastWeek: "上週",
    lastMonth: "上月",
    nextUpdate: "下次更新",
    day: "1日",
    threeDays: "3日",
    week: "1週",
    month: "1月",
    year: "1年",
    // Sub-indicators
    marketMomentum: "市場動能",
    stockPriceStrength: "股價強度",
    stockPriceBreadth: "股價廣度",
    putCallOptions: "看漲看跌期權",
    marketVolatility: "市場波動率",
    safeHavenDemand: "避險需求",
    junkBondDemand: "垃圾債需求",
    // Descriptions
    marketMomentumDesc: "標普500 vs 125日均線",
    stockPriceStrengthDesc: "52週新高 vs 新低",
    stockPriceBreadthDesc: "麥克萊倫成交量匯總指數",
    putCallOptionsDesc: "CBOE 5日看跌/看漲比率",
    marketVolatilityDesc: "VIX 與 50日移動平均線",
    safeHavenDemandDesc: "股票與債券回報率之差",
    junkBondDemandDesc: "垃圾債與投資級債券收益率差",
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('zh'); // 默认中文，更符合用户习惯

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};
