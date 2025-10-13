/**
 * Test utility to validate monthly totals calculations
 */

import { calculateTrendPercentage } from './formatters';

// Mock expense data for testing
const mockExpenses = [
  { id: '1', amount: 100, date: '2024-10-01T00:00:00', category: 'Food', description: 'Test 1' },
  { id: '2', amount: 50, date: '2024-10-15T00:00:00', category: 'Food', description: 'Test 2' },
  { id: '3', amount: 200, date: '2024-09-10T00:00:00', category: 'Transport', description: 'Test 3' },
  { id: '4', amount: 75, date: '2024-09-20T00:00:00', category: 'Food', description: 'Test 4' },
  { id: '5', amount: 300, date: '2024-08-05T00:00:00', category: 'Shopping', description: 'Test 5' },
];

// Utility function to get previous month
function getPreviousMonth(currentDate: Date = new Date()) {
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  const currentYear = currentDate.getFullYear();
  
  let previousMonth = currentMonth - 1;
  let previousYear = currentYear;
  if (previousMonth === 0) {
    previousMonth = 12;
    previousYear = currentYear - 1;
  }
  
  return {
    month: previousMonth,
    year: previousYear,
    monthName: new Date(previousYear, previousMonth - 1).toLocaleDateString('en-US', { month: 'short' })
  };
}

// Test the monthly totals calculation
function testMonthlyTotals() {
  const monthlyTotalsMap = new Map<string, { year: number; month: number; monthName: string; total: number }>();
  
  mockExpenses.forEach(expense => {
    const date = new Date(expense.date);
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1-12
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    
    if (monthlyTotalsMap.has(monthKey)) {
      const existing = monthlyTotalsMap.get(monthKey)!;
      existing.total += expense.amount;
    } else {
      monthlyTotalsMap.set(monthKey, {
        year,
        month,
        monthName,
        total: expense.amount
      });
    }
  });

  const monthlyTotals = Array.from(monthlyTotalsMap.values())
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    })
    .map((item, index, array) => {
      let trend: number | undefined;
      if (index < array.length - 1) {
        const prevItem = array[index + 1];
        if (prevItem.total > 0) {
          trend = ((item.total - prevItem.total) / prevItem.total) * 100;
        }
      }
      
      return {
        month: item.monthName,
        year: item.year,
        total: item.total,
        trend
      };
    });

  console.log('Test Results:');
  console.log('Expected: Oct 2024 = $150 (100+50), Sep 2024 = $275 (200+75), Aug 2024 = $300');
  console.log('Actual:', monthlyTotals);
  
  // Validate results
  const oct2024 = monthlyTotals.find(item => item.month === 'Oct' && item.year === 2024);
  const sep2024 = monthlyTotals.find(item => item.month === 'Sep' && item.year === 2024);
  const aug2024 = monthlyTotals.find(item => item.month === 'Aug' && item.year === 2024);
  
  console.log('Validation:');
  console.log('Oct 2024:', oct2024?.total === 150 ? '✅' : '❌', oct2024?.total);
  console.log('Sep 2024:', sep2024?.total === 275 ? '✅' : '❌', sep2024?.total);
  console.log('Aug 2024:', aug2024?.total === 300 ? '✅' : '❌', aug2024?.total);
  
  return monthlyTotals;
}

// Test trend calculation for current month vs previous month
function testTrendCalculation() {
  console.log('Testing Trend Calculation:');
  
  // Simulate current month (October 2024) with $150 total
  const currentMonthTotal = 150;
  const monthlyTotals = [
    { month: 'Oct', year: 2024, total: 150, trend: undefined },
    { month: 'Sep', year: 2024, total: 275, trend: undefined },
    { month: 'Aug', year: 2024, total: 300, trend: undefined }
  ];
  
  // Test current month vs previous month
  const currentDate = new Date(2024, 9); // October 2024 (month is 0-indexed)
  const previousMonthInfo = getPreviousMonth(currentDate);
  
  console.log('Current month:', currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
  console.log('Previous month:', previousMonthInfo.monthName, previousMonthInfo.year);
  
  const previousMonthData = monthlyTotals.find(item => 
    item.year === previousMonthInfo.year && 
    item.month === previousMonthInfo.monthName
  );
  
  const previousMonthTotal = previousMonthData?.total || 0;
  const trendPercentage = previousMonthTotal > 0 
    ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100 
    : 0;
  
  console.log('Current month total:', currentMonthTotal);
  console.log('Previous month total:', previousMonthTotal);
  console.log('Trend percentage:', trendPercentage.toFixed(2) + '%');
  
  // Expected: (150 - 275) / 275 * 100 = -45.45%
  const expectedTrend = ((150 - 275) / 275) * 100;
  console.log('Expected trend:', expectedTrend.toFixed(2) + '%');
  console.log('Trend calculation correct:', Math.abs(trendPercentage - expectedTrend) < 0.01 ? '✅' : '❌');
  
  return {
    currentMonthTotal,
    previousMonthTotal,
    trendPercentage,
    expectedTrend
  };
}

// Test different trend scenarios
function testTrendScenarios() {
  console.log('Testing Different Trend Scenarios:');
  
  const scenarios = [
    { current: 150, previous: 275, expected: -45.45, description: 'Decrease from Sep to Oct' },
    { current: 300, previous: 150, expected: 100.00, description: 'Increase from Oct to Nov' },
    { current: 200, previous: 200, expected: 0.00, description: 'No change' },
    { current: 100, previous: 0, expected: 0, description: 'Previous month was 0' },
    { current: 0, previous: 100, expected: -100.00, description: 'Current month is 0' }
  ];
  
  scenarios.forEach((scenario, index) => {
    const trend = calculateTrendPercentage(scenario.current, scenario.previous);
    const isCorrect = Math.abs(trend - scenario.expected) < 0.01;
    
    console.log(`Scenario ${index + 1}: ${scenario.description}`);
    console.log(`  Current: $${scenario.current}, Previous: $${scenario.previous}`);
    console.log(`  Expected: ${scenario.expected.toFixed(2)}%, Actual: ${trend.toFixed(2)}%`);
    console.log(`  Result: ${isCorrect ? '✅' : '❌'}`);
    console.log('');
  });
}

// Test trend display visibility
function testTrendDisplay() {
  console.log('Testing Trend Display Visibility:');
  
  const testCases = [
    { current: 150, previous: 275, expected: { value: -45.45, isPositive: false } },
    { current: 300, previous: 150, expected: { value: 100, isPositive: true } },
    { current: 200, previous: 200, expected: { value: 0, isPositive: true } },
    { current: 100, previous: 0, expected: undefined },
  ];
  
  testCases.forEach((testCase, index) => {
    const trendPercentage = calculateTrendPercentage(testCase.current, testCase.previous);
    const trendData = testCase.previous > 0 ? {
      value: trendPercentage,
      isPositive: trendPercentage > 0
    } : undefined;
    
    console.log(`Test Case ${index + 1}:`);
    console.log(`  Current: $${testCase.current}, Previous: $${testCase.previous}`);
    console.log(`  Trend Percentage: ${trendPercentage.toFixed(2)}%`);
    console.log(`  Trend Data:`, trendData);
    console.log(`  Arrow: ${trendData ? (trendData.isPositive ? '↗' : '↘') : 'none'}`);
    console.log(`  Display: ${trendData ? `${trendData.isPositive ? '↗' : '↘'} ${Math.abs(trendData.value).toFixed(1)}%` : 'No trend shown'}`);
    console.log('');
  });
}

// Test trend display with missing previous month data
function testMissingPreviousMonth() {
  console.log('Testing Missing Previous Month Scenario:');
  
  // Simulate current month (October 2025) with $122 total
  const currentMonthTotal = 122;
  const monthlyTotals = [
    { month: 'Oct', year: 2025, total: 122, trend: undefined },
    { month: 'Aug', year: 2025, total: 300, trend: undefined },
    { month: 'Jul', year: 2025, total: 200, trend: undefined }
  ];
  
  // Test current month vs previous month (September 2025 - doesn't exist)
  const currentDate = new Date(2025, 9); // October 2025 (month is 0-indexed)
  const previousMonthInfo = getPreviousMonth(currentDate);
  
  console.log('Current month:', currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
  console.log('Previous month:', previousMonthInfo.monthName, previousMonthInfo.year);
  
  const previousMonthData = monthlyTotals.find(item => 
    item.year === previousMonthInfo.year && 
    item.month === previousMonthInfo.monthName
  );
  
  console.log('Previous month data found:', previousMonthData);
  
  // Test fallback logic
  let comparisonData = previousMonthData;
  let comparisonLabel = `${previousMonthInfo.monthName} ${previousMonthInfo.year}`;
  
  if (!previousMonthData && monthlyTotals.length > 0) {
    const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'short' });
    const currentYear = new Date().getFullYear();
    
    comparisonData = monthlyTotals.find(item => 
      !(item.month === currentMonthName && item.year === currentYear)
    );
    
    if (comparisonData) {
      comparisonLabel = `vs ${comparisonData.month} ${comparisonData.year}`;
    }
  }
  
  const previousMonthTotal = comparisonData?.total || 0;
  const trendPercentage = calculateTrendPercentage(currentMonthTotal, previousMonthTotal);
  
  console.log('Comparison data:', comparisonData);
  console.log('Comparison label:', comparisonLabel);
  console.log('Previous month total:', previousMonthTotal);
  console.log('Trend percentage:', trendPercentage.toFixed(2) + '%');
  
  // Test trend data for MetricCard
  const trendData = previousMonthTotal > 0 ? {
    value: trendPercentage,
    isPositive: trendPercentage > 0
  } : monthlyTotals.length === 0 ? {
    value: 0,
    isPositive: true,
    isFirstMonth: true
  } : undefined;
  
  console.log('Trend data for MetricCard:', trendData);
  console.log('Display:', trendData ? 
    (trendData.isFirstMonth ? '🆕 First Month' : `${trendData.isPositive ? '↗' : '↘'} ${Math.abs(trendData.value).toFixed(1)}%`) 
    : 'No trend shown'
  );
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testMonthlyTotals = testMonthlyTotals;
  (window as any).testTrendCalculation = testTrendCalculation;
  (window as any).testTrendScenarios = testTrendScenarios;
  (window as any).testTrendDisplay = testTrendDisplay;
  (window as any).testMissingPreviousMonth = testMissingPreviousMonth;
  (window as any).getPreviousMonth = getPreviousMonth;
}

export { testMonthlyTotals, testTrendCalculation, testTrendScenarios, testTrendDisplay, testMissingPreviousMonth, getPreviousMonth };
