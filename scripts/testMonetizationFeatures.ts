#!/usr/bin/env ts-node

import { integrationTestRunner } from '../src/tests/integrationTestRunner';

async function main() {
  console.log('🐉 Dragon Worlds HK 2027 - Monetization Features Test Suite');
  console.log('=' .repeat(60));
  console.log('Phase 6: Testing Retention & Monetization Implementation');
  console.log('=' .repeat(60));
  console.log('');

  const args = process.argv.slice(2);
  const quickMode = args.includes('--quick') || args.includes('-q');

  try {
    if (quickMode) {
      console.log('⚡ Running quick health check...\n');
      const isHealthy = await integrationTestRunner.runQuickHealthCheck();
      
      if (isHealthy) {
        console.log('\n🎉 Quick health check PASSED!');
        console.log('🚀 System is ready for deployment.');
      } else {
        console.log('\n⚠️  Quick health check revealed issues.');
        console.log('🔧 Run full test suite for detailed analysis.');
      }
    } else {
      console.log('🔬 Running comprehensive integration tests...\n');
      await integrationTestRunner.runCompleteIntegrationTest();
      
      console.log('\n🎊 Comprehensive testing completed!');
      console.log('📋 Review the detailed report above for any issues.');
    }

    console.log('\n📚 Test Suite Coverage:');
    console.log('  ✅ Payment Gateway Integration (Stripe, Apple Pay, Google Pay)');
    console.log('  ✅ Subscription Purchase Flows with Regional Pricing');
    console.log('  ✅ Cross-sell Product Integration & Tracking');
    console.log('  ✅ VIP Access Pass Purchase System');
    console.log('  ✅ Loyalty Program with Sailing-specific Rewards');
    console.log('  ✅ Gamification System with Achievements & Leaderboards');
    console.log('  ✅ Sponsor Revenue Optimization & Analytics');
    console.log('  ✅ AI-powered Racing Assistant');
    console.log('  ✅ Predictive Analytics & Churn Prevention');
    console.log('  ✅ A/B Testing Framework for Conversion Optimization');
    console.log('  ✅ User Retention Features & Engagement Scoring');
    console.log('  ✅ Promotional Offers & Regional Pricing Validation');

    console.log('\n💡 Usage:');
    console.log('  npm run test:monetization           # Full comprehensive tests');
    console.log('  npm run test:monetization --quick   # Quick health check only');
    console.log('');

  } catch (error) {
    console.error('💥 Test execution failed:');
    console.error(error);
    process.exit(1);
  }
}

// Self-executing when run directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error during test execution:', error);
    process.exit(1);
  });
}

export { main as runMonetizationTests };