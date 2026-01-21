import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const YearProgress: React.FC = () => {
  const { t } = useTranslation();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 100); 
    return () => clearInterval(timer);
  }, []);

  const currentYear = now.getFullYear();
  const isLeapYear = (currentYear % 4 === 0 && currentYear % 100 !== 0) || (currentYear % 400 === 0);
  const daysInYear = isLeapYear ? 366 : 365;

  // ... (Calculation logic omitted for brevity as it is untouched) ...
  // Re-declare for context if needed, but I will target specific blocks or replace the whole component structure if easy.
  // Actually, replace_file_content is better with specific blocks if file is large.
  // But here I need `t` in scope. So I added it at top.
  // I will replace the imports and component start first.

  // --- 1. Year Progress (Day Based) ---
  const startOfYear = new Date(currentYear, 0, 1, 0, 0, 0);
  const oneDayMs = 1000 * 60 * 60 * 24;
  const passedMs = now.getTime() - startOfYear.getTime();
  const passedDays = Math.floor(passedMs / oneDayMs); 
  const remainingDays = daysInYear - passedDays;
  const remainingYearPercent = (remainingDays / daysInYear) * 100;

  // --- 2. Month Progress (Time Based) ---
  const currentMonthIdx = now.getMonth(); 
  const startOfMonth = new Date(currentYear, currentMonthIdx, 1, 0, 0, 0);
  const endOfMonth = new Date(currentYear, currentMonthIdx + 1, 0, 23, 59, 59, 999);
  const totalMonthMs = endOfMonth.getTime() - startOfMonth.getTime();
  const remainingMonthMs = endOfMonth.getTime() - now.getTime();
  const remainingMonthPercent = (remainingMonthMs / totalMonthMs) * 100;

  // --- 3. Week Progress (Time Based) ---
  const currentDayOfWeek = now.getDay(); 
  const normDay = currentDayOfWeek === 0 ? 7 : currentDayOfWeek;
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (normDay - 1), 0, 0, 0);
  const endOfWeek = new Date(startOfWeek.getTime() + 7 * oneDayMs - 1); 
  const totalWeekMs = 7 * oneDayMs;
  const remainingWeekMs = endOfWeek.getTime() - now.getTime();
  const safeRemWeekMs = Math.max(0, remainingWeekMs);
  const remainingWeekPercent = (safeRemWeekMs / totalWeekMs) * 100;

  // --- 4. Day Progress (Time Based) ---
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  const totalDayMs = oneDayMs;
  const remainingDayMs = endOfDay.getTime() - now.getTime();
  const remainingDayPercent = (remainingDayMs / totalDayMs) * 100;

  // --- 5. Hour Progress (Time Based: Minutes remaining) ---
  const endOfHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0);
  const totalHourMs = 60 * 60 * 1000;
  const remainingHourMs = endOfHour.getTime() - now.getTime();
  const remainingHourPercent = (remainingHourMs / totalHourMs) * 100;

  // --- 6. Minute Progress (Time Based: Seconds remaining) ---
  const endOfMinute = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() + 1, 0);
  const totalMinuteMs = 60 * 1000;
  const remainingMinuteMs = endOfMinute.getTime() - now.getTime();
  const remainingMinutePercent = (remainingMinuteMs / totalMinuteMs) * 100;

  // Grid/UI Vars (Circles)
  const daysInCurrentMonth = new Date(currentYear, currentMonthIdx + 1, 0).getDate();
  const leftMonths = 12 - (currentMonthIdx + 1); 
  const leftDays = daysInCurrentMonth - now.getDate();
  const leftHours = 23 - now.getHours();
  const leftMinutes = 59 - now.getMinutes();
  const leftSeconds = 59 - now.getSeconds();

  // --- Holiday Logic ---
  const HOLIDAYS = [
      { name: '元旦', date: '2026-01-01', days: 3 }, // Jan 1 - Jan 3
      { name: '春节', date: '2026-02-15', days: 9 }, // Feb 15 - Feb 23 (9 days)
      { name: '清明节', date: '2026-04-04', days: 3 }, // Apr 4 - Apr 6
      { name: '劳动节', date: '2026-05-01', days: 5 }, // May 1 - May 5
      { name: '端午节', date: '2026-06-19', days: 3 }, // Jun 19 - Jun 21
      { name: '中秋节', date: '2026-09-25', days: 3 }, // Sep 25 - Sep 27
      { name: '国庆节', date: '2026-10-01', days: 7 }, // Oct 1 - Oct 7
      { name: '元旦(2027)', date: '2027-01-01', days: 3 }
  ];

  let targetData = null;
  let isHolidayActive = false;
  
  const activeHoliday = HOLIDAYS.find(h => {
      const start = new Date(h.date);
      const end = new Date(start.getTime() + h.days * 24 * 60 * 60 * 1000);
      return now >= start && now < end;
  });

  if (activeHoliday) {
      isHolidayActive = true;
      targetData = activeHoliday;
  } else {
      const nextOne = HOLIDAYS.find(h => {
          const start = new Date(h.date);
          return start > now;
      });
      targetData = nextOne;
  }

  let holidayName = '';
  let holidayDateDisplay = '';
  
  // Numeric values for TimeCircle
  let holidayDiff = 0;
  let holidayDist = 0;
  let hHours = 0;
  let hMinutes = 0;
  let hSeconds = 0;
  let hMonths = 0;

  if (targetData) {
      holidayName = targetData.name;
      let targetTime = 0;
      if (isHolidayActive) {
          const start = new Date(targetData.date);
          const end = new Date(start.getTime() + targetData.days * 24 * 60 * 60 * 1000);
          targetTime = end.getTime();
          holidayDateDisplay = `${t('yp_holiday_end')} ${end.getFullYear()}-${end.getMonth()+1}-${end.getDate()}`;
      } else {
          targetTime = new Date(targetData.date).getTime();
          holidayDateDisplay = targetData.date;
      }
      const diff = targetTime - now.getTime();
      
      holidayDiff = Math.ceil(diff / (1000 * 60 * 60 * 24)); 
      holidayDist = holidayDiff; 
      
      hHours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      hMinutes = Math.floor((diff / 1000 / 60) % 60);
      hSeconds = Math.floor((diff / 1000) % 60);
      
      // Month logic: < 30 days = 0, else days/30 (2 decimals)
      if (holidayDiff < 30) {
          hMonths = 0;
      } else {
          hMonths = Number((holidayDiff / 30).toFixed(2));
      }
  } else {
      hHours = 0;
      hMinutes = 0;
      hSeconds = 0;
      hMonths = 0;
  }

  // --- Grid Data (Month/Year Rows) ---
  const monthsData = Array.from({ length: 12 }, (_, monthIndex) => {
    const date = new Date(currentYear, monthIndex, 1);
    const monthName = date.toLocaleString('zh-CN', { month: 'short' }); 
    const daysInMonth = new Date(currentYear, monthIndex + 1, 0).getDate();
    
    const days: { dayNum: number; status: 'passed' | 'today' | 'future' }[] = [];
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (let d = 1; d <= daysInMonth; d++) {
        const thisDate = new Date(currentYear, monthIndex, d);
        let status: 'passed' | 'today' | 'future' = 'future'; 
        
        if (thisDate.getTime() < todayStart.getTime()) {
            status = 'passed';
        } else if (thisDate.getTime() === todayStart.getTime()) {
            status = 'today';
        }
        days.push({ dayNum: d, status });
    }

    const monthStart = new Date(currentYear, monthIndex, 1, 0,0,0);
    const monthEnd = new Date(currentYear, monthIndex + 1, 0, 23, 59, 59, 999); 
    const monthTotalMs = monthEnd.getTime() - monthStart.getTime();

    let monthRemPercent = 0;
    let yearRemAtMonthPercent = 0;

    if (now.getTime() > monthEnd.getTime()) {
        monthRemPercent = 0;
        const passedDaysAtMonthEnd = Math.floor((monthEnd.getTime() - startOfYear.getTime()) / oneDayMs);
        yearRemAtMonthPercent = ((daysInYear - passedDaysAtMonthEnd) / daysInYear) * 100;
    } else if (now.getTime() < monthStart.getTime()) {
        monthRemPercent = 100;
        const passedDaysAtMonthEnd = Math.floor((monthEnd.getTime() - startOfYear.getTime()) / oneDayMs);
        yearRemAtMonthPercent = ((daysInYear - passedDaysAtMonthEnd) / daysInYear) * 100;
    } else {
        const monthRemMs = monthEnd.getTime() - now.getTime();
        monthRemPercent = (monthRemMs / monthTotalMs) * 100;
        yearRemAtMonthPercent = remainingYearPercent;
    }

    return { 
        name: monthName, 
        days,
        monthRemPercent,
        yearRemAtMonthPercent,
        isCurrent: monthIndex === currentMonthIdx
    };
  });

  // Dynamic Color Helper
  const getProgressColor = (percent: number) => {
      // Strict Colors based on User Request:
      // > 75%: Green (#00FF00) - Abundant
      // 50% - 75%: Blue (#0000FF) - Balanced
      // 25% - 50%: Yellow (#FFFF00) - Caution
      // <= 25%: Red (#FF0000) - Critical
      if (percent > 75) return '#00FF00'; 
      if (percent > 50) return '#0000FF'; 
      if (percent > 25) return '#FFFF00'; 
      return '#FF0000'; 
  };

  // Dynamic Theme Color based on Seconds (User Request)
  const secondsPercent = (leftSeconds / 60) * 100;
  const themeColor = getProgressColor(secondsPercent);

  return (
    <div className="glass-panel" style={{ 
        maxWidth: '1200px', 
        minWidth: '960px',
        width: '100%', 
        margin: '2rem auto', 
        padding: '2rem',
        textAlign: 'center',
        color: 'var(--text-main)',
        // Dynamic Theme Styles
        borderColor: themeColor,
        background: `linear-gradient(135deg, rgba(5,20,40,0.8), ${themeColor}10)`, // Slight tint
        boxShadow: `0 0 30px ${themeColor}20, inset 0 0 20px ${themeColor}10`,
        transition: 'all 1s ease' // Smooth transition per second
    }}>
      <h2 style={{ marginBottom: '1rem', fontSize: '2rem' }}>{t('yp_title', { year: currentYear })}</h2>
      
      <div style={{ fontSize: '1.5rem', fontFamily: 'monospace', marginBottom: '2rem', opacity: 0.8 }}>
        {t('yp_current_time')} {now.toLocaleString('zh-CN', { hour12: false })}
      </div>

      {/* 1. Counter Circles */}
      <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', 
          gap: '1rem',
          marginBottom: '3rem'
      }}>
          <TimeCircle value={leftMonths} max={12} label={t('yp_unit_month')} colorFn={getProgressColor} />
          <TimeCircle value={leftDays} max={daysInCurrentMonth} label={t('yp_unit_day')} colorFn={getProgressColor} />
          <TimeCircle value={leftHours} max={24} label={t('yp_unit_hour')} colorFn={getProgressColor} />
          <TimeCircle value={leftMinutes} max={60} label={t('yp_unit_minute')} colorFn={getProgressColor} />
          <TimeCircle value={leftSeconds} max={60} label={t('yp_unit_second')} colorFn={getProgressColor} />
      </div>

       {/* 2. Holiday Alert */}
      {targetData && (
        <div style={{ 
            marginBottom: '3rem', 
            background: 'rgba(255,255,255,0.02)', 
            padding: '1.5rem', 
            borderRadius: '16px',
            border: isHolidayActive ? '1px solid rgba(0,255,0,0.2)' : '1px solid rgba(255,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem'
        }}>
            <div style={{ 
                fontSize: '1rem', 
                color: isHolidayActive ? '#00FF00' : '#FF0000', 
                marginBottom: '0.5rem',
                letterSpacing: '2px'
            }}>
                {holidayName} {isHolidayActive ? t('yp_holiday_active') : t('yp_holiday_countdown')}
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <TimeCircle 
                    value={hMonths} 
                    max={12} 
                    label={t('yp_unit_month')}
                    colorFn={getProgressColor}
                />
                <TimeCircle 
                    value={isHolidayActive ? holidayDiff : holidayDist} 
                    max={isHolidayActive ? targetData?.days || 7 : 60} 
                    label={isHolidayActive ? t('yp_holiday_days_rem') : t('yp_holiday_start_in')}
                    colorFn={getProgressColor}
                />
                <TimeCircle 
                    value={hHours} 
                    max={24} 
                    label={t('yp_unit_hour')}
                    colorFn={getProgressColor}
                />
                <TimeCircle 
                    value={hMinutes} 
                    max={60} 
                    label={t('yp_unit_minute')}
                    colorFn={getProgressColor}
                />
                 <TimeCircle 
                    value={hSeconds} 
                    max={60} 
                    label={t('yp_unit_second')}
                    colorFn={getProgressColor}
                />
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)', marginTop: '-0.5rem' }}>
                {holidayDateDisplay}
            </div>
        </div>

      )}

      {/* 3. Progress Bars Grid */}
       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          
          <ProgressCard title={`${t('yp_rem_year')} (${t('yp_unit_day')})`} percent={remainingYearPercent} color={getProgressColor(remainingYearPercent)} />
          
          <ProgressCard title={t('yp_rem_month')} percent={remainingMonthPercent} color={getProgressColor(remainingMonthPercent)} />

          <ProgressCard title={t('yp_rem_week')} percent={remainingWeekPercent} color={getProgressColor(remainingWeekPercent)} />

          <ProgressCard title={t('yp_rem_today')} percent={remainingDayPercent} color={getProgressColor(remainingDayPercent)} />
          
          <ProgressCard title={t('yp_rem_hour')} percent={remainingHourPercent} color={getProgressColor(remainingHourPercent)} />
          
          <ProgressCard title={t('yp_rem_minute')} percent={remainingMinutePercent} color={getProgressColor(remainingMinutePercent)} />

      </div>

      {/* 4. Month Rows */}
       <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '40px 1fr 140px 140px', 
          gap: '1rem', 
          padding: '0 2rem 0.5rem 2rem',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          marginBottom: '1rem',
          fontSize: '0.9rem',
          color: 'var(--text-sub)',
          fontWeight: 'bold'
      }}>
          <div style={{ textAlign: 'right' }}>{t('yp_col_month')}</div>
          <div style={{ textAlign: 'left' }}>{t('yp_col_overview')}</div>
          <div style={{ textAlign: 'center' }}>{t('yp_col_month_rem')}</div>
          <div style={{ textAlign: 'center' }}>{t('yp_col_year_rem')}</div> 
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {monthsData.map((month, mIndex) => (
            <div key={mIndex} style={{ 
                display: 'grid', 
                gridTemplateColumns: '40px 1fr 140px 140px',
                alignItems: 'center', 
                gap: '1rem', 
                padding: '0.5rem 2rem',
                background: month.isCurrent ? 'rgba(255,255,255,0.02)' : 'transparent',
                borderRadius: '8px'
            }}>
                <div style={{ 
                    textAlign: 'right', 
                    color: month.isCurrent ? '#fff' : 'var(--text-sub)', 
                    fontWeight: month.isCurrent ? 'bold' : 'normal',
                    fontSize: '0.9rem',
                }}>
                    {month.name}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {month.days.map((day) => (
                        <div 
                            key={day.dayNum}
                            title={`${month.name}${day.dayNum}日 ${day.status === 'today' ? `(${t('yp_legend_today')})` : ''}`}
                            style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '2px',
                                background: day.status === 'today'
                                    ? '#00FF00' 
                                    : day.status === 'passed'
                                        ? 'rgba(255,255,255,0.05)' 
                                        : '#96D8BB',
                                boxShadow: day.status === 'today' ? '0 0 10px #00FF00' : 'none',
                                opacity: day.status === 'passed' ? 0.3 : 1, 
                                cursor: 'default'
                            }}
                        />
                    ))}
                </div>

                 <div style={{ 
                     textAlign: 'center', 
                     fontFamily: 'monospace', 
                     color: month.isCurrent ? getProgressColor(month.monthRemPercent) : 'var(--text-sub)',
                     opacity: month.monthRemPercent === 0 ? 0.3 : 1
                 }}>
                    {month.monthRemPercent.toFixed(2)}%
                </div>

                <div style={{ 
                     textAlign: 'center', 
                     fontFamily: 'monospace', 
                     color: month.isCurrent ? getProgressColor(month.yearRemAtMonthPercent) : 'var(--text-sub)',
                     opacity: month.yearRemAtMonthPercent === 0 ? 0.3 : 1,
                     fontWeight: month.isCurrent ? 'bold' : 'normal'
                 }}>
                    {month.yearRemAtMonthPercent.toFixed(2)}%
                </div>

            </div>
        ))}
      </div>
      
       <div style={{ marginTop: '2rem', display: 'flex', gap: '2rem', justifyContent: 'center', fontSize: '0.9rem', color: 'var(--text-sub)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}></div>
              <span>{t('yp_legend_passed')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', background: '#00FF00', borderRadius: '2px', boxShadow: '0 0 5px #00FF00' }}></div>
              <span>{t('yp_legend_today')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', background: '#96D8BB', borderRadius: '2px' }}></div>
              <span>{t('yp_legend_future')}</span>
          </div>
      </div>
    </div>
  );
};

// --- Subcomponents ---

const TimeCircle: React.FC<{ value: number; max: number; label: string; colorFn?: (p: number) => string }> = ({ value, max, label, colorFn }) => {
    // Tech Scale Config
    const radius = 30;
    const circumference = 2 * Math.PI * radius; // ~188.5
    
    // Dynamic Ticks based on Unit Max
    const totalTicks = max; 
    
    // Proportional Width Calculation
    // We want a constant "Ink-to-Space" ratio, but with a minimum gap for visibility.
    const segmentLength = circumference / totalTicks;
    const gapRatio = 0.2; // 20% gap, 80% tick
    const minGap = 1.2; // Minimum gap in pixels to prevent merging
    
    const calculatedGap = segmentLength * gapRatio;
    const gapWidth = Math.max(minGap, calculatedGap);
    const tickWidth = Math.max(0, segmentLength - gapWidth); // Ensure no negative
    
    // Calculate Active Ticks
    const percentRaw = (value / max) * 100;
    const percent = Math.min(100, Math.max(0, percentRaw));
    
    // For months/hours with different max, we still map to 60 ticks visual for consistency
    // Or should we map to max ticks? 60 looks best for "Tech".
    const activeTicks = Math.floor((value / max) * totalTicks);

    // Color Logic
    let color = 'var(--primary)';
    if (colorFn) {
        color = colorFn(percent);
    } else {
         const isSeconds = label === '秒' || label === '分钟';
         color = isSeconds ? '#ff3333' : 'var(--primary)';
    }

    // Dynamic DashArray for Progress
    // We want 'activeTicks' segments of (tick gap).
    // Then the rest empty.
    // Construct string: "tick gap tick gap ... 0 circumference"
    // Optimization: React might re-render this string often.
    const activeDashArray = Array.from({ length: activeTicks }).map(() => `${tickWidth} ${gapWidth}`).join(' ');
    const fullDashArray = activeTicks > 0 
        ? `${activeDashArray} 0 ${circumference}`
        : `0 ${circumference}`; // Empty

    // Static Track DashArray (Full circle of ticks)
    const trackDashArray = `${tickWidth} ${gapWidth}`;

    return (
        <div style={{ 
            background: 'rgba(255,255,255,0.05)', 
            padding: '0.5rem', 
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(5px)',
            border: '1px solid rgba(255,255,255,0.1)',
            position: 'relative',
            minHeight: '100px'
        }}>
            <div style={{ position: 'relative', width: '70px', height: '70px' }}>
                <svg width="70" height="70" viewBox="0 0 70 70" style={{ transform: 'rotate(-90deg)' }}>
                    {/* Track: Dimmed Ticks */}
                    <circle 
                        cx="35" cy="35" r={radius} 
                        fill="none" 
                        stroke="rgba(255,255,255,0.1)" 
                        strokeWidth="5" 
                        strokeDasharray={trackDashArray}
                    />
                    {/* Progress: Colored Ticks */}
                    <circle 
                        cx="35" cy="35" r={radius} 
                        fill="none" 
                        stroke={color} 
                        strokeWidth="5"
                        strokeDasharray={fullDashArray}
                        strokeLinecap="butt"
                        style={{ transition: 'stroke 0.5s ease' }}
                    />
                </svg>
                <div style={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    fontFamily: 'monospace',
                    color: color
                }}>
                    {value}
                </div>
            </div>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-sub)', marginTop: '0.5rem' }}>{label}</span>
        </div>
    );
};

const ProgressCard: React.FC<{ title: string; percent: number; color: string }> = ({ title, percent, color }) => (
    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '15px' }}>
        <div style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--text-sub)' }}>
        {title}
        </div>
        <div style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            fontFamily: 'monospace', 
            color: color,
            marginBottom: '1rem'
        }}>
        {percent.toFixed(2)}%
        </div>
        <ProgressBar percent={percent} color={color} />
    </div>
);

const ProgressBar: React.FC<{ percent: number; color: string }> = ({ percent, color }) => (
    <div style={{ 
        width: '100%', 
        height: '8px', 
        background: 'rgba(255,255,255,0.1)', 
        borderRadius: '4px', 
        overflow: 'hidden',
        position: 'relative'
     }}>
      <div style={{ 
          width: `${percent}%`, 
          height: '100%', 
          background: color,
          transition: 'width 0.1s linear, background 0.5s ease',
          borderRadius: '4px' 
      }}></div>
    </div>
);

export default YearProgress;
