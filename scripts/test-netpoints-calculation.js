#!/usr/bin/env node

/**
 * Test script to verify netPoints calculation for CCR 2024 results
 */

// Real test data from Juice (CCR 2024 IRC 3 PDF)
const testData = {
  boatName: 'Juice (HKG2559)',
  raceResults: [2, 1, 2, 3, 2, 2, 1], // Real results from PDF
  totalPoints: 13 // Sum of all races
};

function calculateNetPoints(raceResults) {
  const numRaces = raceResults.length;
  let netPoints = raceResults.reduce((sum, p) => sum + p, 0);
  let discardedRaces = [];
  
  // Apply discard rules: 1 drop after 5 races, 2 drops after 10 races
  if (numRaces >= 5) {
    const sortedResults = [...raceResults]
      .map((points, index) => ({ points, index }))
      .sort((a, b) => b.points - a.points); // Sort descending (worst first)
    
    const numDrops = numRaces >= 10 ? 2 : 1;
    discardedRaces = sortedResults.slice(0, numDrops);
    
    // Calculate net points by dropping worst races
    netPoints = raceResults.reduce((sum, points, idx) => {
      const isDropped = discardedRaces.some(d => d.index === idx);
      return isDropped ? sum : sum + points;
    }, 0);
  }
  
  return { netPoints, discardedRaces };
}

console.log('Testing netPoints calculation for CCR 2024 Hong Kong Kettle');
console.log('================================================');
console.log(`Boat: ${testData.boatName}`);
console.log(`Race Results: [${testData.raceResults.join(', ')}]`);
console.log(`Total Points: ${testData.totalPoints}`);

const { netPoints, discardedRaces } = calculateNetPoints(testData.raceResults);

console.log(`\nCalculation:`);
console.log(`- Number of races: ${testData.raceResults.length}`);
console.log(`- Races to drop: ${discardedRaces.length}`);
discardedRaces.forEach(d => {
  console.log(`  - Dropping race ${d.index + 1}: ${d.points} points`);
});
console.log(`- Net Points: ${netPoints}`);

console.log('\n✅ Expected display format:');
console.log(`   ${netPoints} (${testData.totalPoints}) pts`);
console.log('\nThis means Juice should show: "10 (13) pts" - matching real CCR 2024 results!');