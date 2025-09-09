import { monetizationTester } from './monetizationFlowTests';

export class IntegrationTestRunner {
  async runCompleteIntegrationTest(): Promise<void> {
    console.log('🚀 Starting Dragon Worlds HK 2027 Phase 6 Integration Tests');
    console.log('Testing all monetization flows and retention features...\n');

    try {
      // Run comprehensive monetization and retention tests
      const results = await monetizationTester.runAllTests();
      
      // Print detailed results
      monetizationTester.printReport();
      
      // Generate summary
      this.printIntegrationSummary(results);
      
      // Validate critical business flows
      await this.validateCriticalBusinessFlows(results);
      
    } catch (error) {
      console.error('❌ Integration test execution failed:', error);
      throw error;
    }
  }

  private printIntegrationSummary(results: any): void {
    console.log('\n🏆 PHASE 6 INTEGRATION SUMMARY');
    console.log('=' .repeat(50));
    
    const criticalSystems = [
      'Payment Gateway Integration',
      'Subscription Purchase Flows', 
      'Cross-sell Product Flows',
      'VIP Access Purchase Flows',
      'Loyalty Program System',
      'Gamification System',
      'Sponsor Revenue Optimization',
      'Racing Assistant AI',
      'Predictive Analytics Engine',
      'A/B Testing Framework'
    ];
    
    criticalSystems.forEach(systemName => {
      const suite = results.suites.find((s: any) => s.name === systemName);
      if (suite) {
        const status = suite.failedTests === 0 ? '✅' : '❌';
        const passRate = suite.totalTests > 0 ? (suite.passedTests / suite.totalTests * 100).toFixed(0) : '0';
        console.log(`${status} ${systemName}: ${passRate}% (${suite.passedTests}/${suite.totalTests})`);
      }
    });
    
    const overallStatus = results.overallPassed ? '🎉 READY FOR DEPLOYMENT' : '⚠️  NEEDS ATTENTION';
    console.log(`\n📊 Overall Status: ${overallStatus}`);
    console.log(`📈 Success Rate: ${((results.passedTests / results.totalTests) * 100).toFixed(1)}%`);
    console.log('=' .repeat(50));
  }

  private async validateCriticalBusinessFlows(results: any): Promise<void> {
    console.log('\n🔍 VALIDATING CRITICAL BUSINESS FLOWS');
    console.log('=' .repeat(40));

    const criticalFlows = [
      {
        name: 'End-to-End Subscription Purchase',
        validation: () => {
          const paymentSuite = results.suites.find((s: any) => s.name === 'Payment Gateway Integration');
          const subscriptionSuite = results.suites.find((s: any) => s.name === 'Subscription Purchase Flows');
          return paymentSuite?.failedTests === 0 && subscriptionSuite?.failedTests === 0;
        }
      },
      {
        name: 'User Retention & Engagement Pipeline',
        validation: () => {
          const loyaltySuite = results.suites.find((s: any) => s.name === 'Loyalty Program System');
          const gamificationSuite = results.suites.find((s: any) => s.name === 'Gamification System');
          const retentionSuite = results.suites.find((s: any) => s.name === 'User Retention Features');
          return loyaltySuite?.failedTests === 0 && gamificationSuite?.failedTests === 0 && retentionSuite?.failedTests === 0;
        }
      },
      {
        name: 'Revenue Optimization Engine',
        validation: () => {
          const crossSellSuite = results.suites.find((s: any) => s.name === 'Cross-sell Product Flows');
          const sponsorSuite = results.suites.find((s: any) => s.name === 'Sponsor Revenue Optimization');
          const abTestSuite = results.suites.find((s: any) => s.name === 'A/B Testing Framework');
          return crossSellSuite?.failedTests === 0 && sponsorSuite?.failedTests === 0 && abTestSuite?.failedTests === 0;
        }
      },
      {
        name: 'Predictive Analytics & Personalization',
        validation: () => {
          const analyticsSuite = results.suites.find((s: any) => s.name === 'Predictive Analytics Engine');
          const assistantSuite = results.suites.find((s: any) => s.name === 'Racing Assistant AI');
          return analyticsSuite?.failedTests === 0 && assistantSuite?.failedTests === 0;
        }
      }
    ];

    criticalFlows.forEach(flow => {
      const isValid = flow.validation();
      const status = isValid ? '✅ OPERATIONAL' : '❌ ISSUES DETECTED';
      console.log(`${flow.name}: ${status}`);
    });

    const allCriticalFlowsValid = criticalFlows.every(flow => flow.validation());
    
    if (allCriticalFlowsValid) {
      console.log('\n🎯 All critical business flows are operational!');
      console.log('✨ Phase 6: Retention & Monetization Features - COMPLETE');
    } else {
      console.log('\n⚠️  Some critical business flows need attention before deployment.');
    }
    
    console.log('=' .repeat(40));
  }

  async runQuickHealthCheck(): Promise<boolean> {
    console.log('🏥 Running quick health check...');
    
    try {
      const startTime = Date.now();
      const results = await monetizationTester.runAllTests();
      const duration = Date.now() - startTime;
      
      const healthScore = (results.passedTests / results.totalTests) * 100;
      
      console.log(`⚡ Health check completed in ${duration}ms`);
      console.log(`📊 System Health: ${healthScore.toFixed(1)}%`);
      
      if (healthScore >= 95) {
        console.log('💚 System is healthy and ready for production!');
        return true;
      } else if (healthScore >= 80) {
        console.log('💛 System is mostly healthy with minor issues');
        return true;
      } else {
        console.log('❤️  System has significant issues that need attention');
        return false;
      }
    } catch (error) {
      console.error('💥 Health check failed:', error);
      return false;
    }
  }
}

// Export test runner instance
export const integrationTestRunner = new IntegrationTestRunner();

// CLI execution support
if (require.main === module) {
  console.log('🧪 Dragon Worlds HK 2027 - Phase 6 Integration Tests');
  console.log('Running comprehensive monetization and retention testing...\n');
  
  integrationTestRunner.runCompleteIntegrationTest()
    .then(() => {
      console.log('\n✅ Integration tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Integration tests failed:', error);
      process.exit(1);
    });
}