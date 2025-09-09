#!/usr/bin/env node

/**
 * Bundle Analysis Script for Dragon Worlds HK 2027
 * Analyzes bundle size, dependencies, and performance metrics
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  header: (msg) => console.log(`${colors.bright}${colors.cyan}${msg}${colors.reset}`),
};

class BundleAnalyzer {
  constructor() {
    this.projectRoot = process.cwd();
    this.packageJsonPath = path.join(this.projectRoot, 'package.json');
    this.nodeModulesPath = path.join(this.projectRoot, 'node_modules');
    this.report = {
      timestamp: new Date().toISOString(),
      dependencies: {},
      bundleSize: {},
      recommendations: []
    };
  }

  async analyze() {
    log.header('🔍 Dragon Worlds HK 2027 - Bundle Analysis');
    console.log('');

    try {
      await this.analyzeDependencies();
      await this.analyzeBundle();
      await this.checkDuplicateDependencies();
      await this.generateRecommendations();
      await this.generateReport();
      
      log.success('Bundle analysis completed successfully!');
    } catch (error) {
      log.error(`Analysis failed: ${error.message}`);
      process.exit(1);
    }
  }

  async analyzeDependencies() {
    log.info('Analyzing dependencies...');
    
    const packageJson = JSON.parse(fs.readFileSync(this.packageJsonPath, 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    // Analyze each dependency
    for (const [name, version] of Object.entries(dependencies)) {
      try {
        const packagePath = path.join(this.nodeModulesPath, name, 'package.json');
        if (fs.existsSync(packagePath)) {
          const depPackage = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
          const size = await this.getPackageSize(name);
          
          this.report.dependencies[name] = {
            version: version,
            installedVersion: depPackage.version,
            size: size,
            description: depPackage.description || 'No description',
            license: depPackage.license || 'Unknown',
            dependencies: Object.keys(depPackage.dependencies || {}).length,
            isDevDependency: !!packageJson.devDependencies?.[name]
          };
        }
      } catch (error) {
        log.warning(`Could not analyze dependency ${name}: ${error.message}`);
      }
    }

    // Sort by size
    const sortedDeps = Object.entries(this.report.dependencies)
      .sort(([,a], [,b]) => b.size - a.size)
      .slice(0, 10);

    log.info('Top 10 largest dependencies:');
    sortedDeps.forEach(([name, info]) => {
      const sizeInMB = (info.size / 1024 / 1024).toFixed(2);
      console.log(`  📦 ${name}: ${sizeInMB}MB`);
    });
  }

  async analyzeBundle() {
    log.info('Analyzing bundle composition...');
    
    try {
      // Create a temporary bundle analysis
      const output = execSync('npx expo export --source-maps', { 
        encoding: 'utf8', 
        cwd: this.projectRoot,
        timeout: 120000 
      });
      
      const distPath = path.join(this.projectRoot, 'dist');
      if (fs.existsSync(distPath)) {
        const bundleStats = await this.analyzeBundleFiles(distPath);
        this.report.bundleSize = bundleStats;
        
        log.info('Bundle size breakdown:');
        Object.entries(bundleStats).forEach(([type, size]) => {
          const sizeInMB = (size / 1024 / 1024).toFixed(2);
          console.log(`  📄 ${type}: ${sizeInMB}MB`);
        });
      }
    } catch (error) {
      log.warning(`Could not analyze bundle: ${error.message}`);
    }
  }

  async analyzeBundleFiles(distPath) {
    const stats = {
      javascript: 0,
      assets: 0,
      fonts: 0,
      images: 0,
      total: 0
    };

    const walkDir = (dir) => {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          walkDir(filePath);
        } else {
          const ext = path.extname(file).toLowerCase();
          const size = stat.size;
          
          if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
            stats.javascript += size;
          } else if (['.png', '.jpg', '.jpeg', '.gif', '.svg'].includes(ext)) {
            stats.images += size;
          } else if (['.ttf', '.otf', '.woff', '.woff2'].includes(ext)) {
            stats.fonts += size;
          } else {
            stats.assets += size;
          }
          
          stats.total += size;
        }
      });
    };

    walkDir(distPath);
    return stats;
  }

  async getPackageSize(packageName) {
    try {
      const packagePath = path.join(this.nodeModulesPath, packageName);
      if (!fs.existsSync(packagePath)) return 0;
      
      return await this.getDirectorySize(packagePath);
    } catch (error) {
      return 0;
    }
  }

  async getDirectorySize(dirPath) {
    let totalSize = 0;
    
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isFile()) {
        totalSize += stats.size;
      } else if (stats.isDirectory()) {
        totalSize += await this.getDirectorySize(itemPath);
      }
    }
    
    return totalSize;
  }

  async checkDuplicateDependencies() {
    log.info('Checking for duplicate dependencies...');
    
    try {
      const output = execSync('npm ls --depth=0 --json', { 
        encoding: 'utf8',
        cwd: this.projectRoot 
      });
      const dependencies = JSON.parse(output).dependencies || {};
      
      // Check for potential duplicates by name similarity
      const packageNames = Object.keys(dependencies);
      const potentialDuplicates = [];
      
      packageNames.forEach((name, i) => {
        packageNames.slice(i + 1).forEach(otherName => {
          if (this.arePackagesSimilar(name, otherName)) {
            potentialDuplicates.push([name, otherName]);
          }
        });
      });
      
      if (potentialDuplicates.length > 0) {
        log.warning('Potential duplicate packages found:');
        potentialDuplicates.forEach(([pkg1, pkg2]) => {
          console.log(`  ⚠️  ${pkg1} / ${pkg2}`);
          this.report.recommendations.push({
            type: 'duplicate',
            message: `Consider if both ${pkg1} and ${pkg2} are needed`,
            packages: [pkg1, pkg2]
          });
        });
      }
    } catch (error) {
      log.warning(`Could not check for duplicates: ${error.message}`);
    }
  }

  arePackagesSimilar(name1, name2) {
    // Check for common duplicate patterns
    const patterns = [
      [/^@types\/(.+)/, /^(.+)$/], // @types/package vs package
      [/^(.+)-native$/, /^(.+)$/], // package-native vs package
      [/^react-native-(.+)/, /^(.+)$/], // react-native-package vs package
    ];
    
    return patterns.some(([pattern1, pattern2]) => {
      const match1 = name1.match(pattern1);
      const match2 = name2.match(pattern2);
      return match1 && match2 && match1[1] === match2[1];
    });
  }

  async generateRecommendations() {
    log.info('Generating optimization recommendations...');
    
    // Check for large packages that could be optimized
    const largeDeps = Object.entries(this.report.dependencies)
      .filter(([, info]) => info.size > 5 * 1024 * 1024) // > 5MB
      .sort(([,a], [,b]) => b.size - a.size);
    
    largeDeps.forEach(([name, info]) => {
      this.report.recommendations.push({
        type: 'large_dependency',
        message: `${name} is ${(info.size / 1024 / 1024).toFixed(2)}MB - consider alternatives or tree shaking`,
        package: name,
        size: info.size
      });
    });

    // Check for outdated packages
    const outdatedPackages = Object.entries(this.report.dependencies)
      .filter(([, info]) => info.version !== info.installedVersion);
    
    if (outdatedPackages.length > 0) {
      this.report.recommendations.push({
        type: 'outdated',
        message: `${outdatedPackages.length} packages have version mismatches`,
        count: outdatedPackages.length
      });
    }

    // React Native specific recommendations
    this.generateReactNativeRecommendations();
    
    // Expo specific recommendations
    this.generateExpoRecommendations();
  }

  generateReactNativeRecommendations() {
    const deps = this.report.dependencies;
    
    // Check for Metro bundler optimizations
    if (!fs.existsSync(path.join(this.projectRoot, 'metro.config.js'))) {
      this.report.recommendations.push({
        type: 'metro_config',
        message: 'Consider adding metro.config.js for bundle optimization'
      });
    }

    // Check for Hermes engine
    const appJson = JSON.parse(fs.readFileSync(path.join(this.projectRoot, 'app.json'), 'utf8'));
    if (!appJson.expo?.android?.jsEngine || appJson.expo.android.jsEngine !== 'hermes') {
      this.report.recommendations.push({
        type: 'hermes',
        message: 'Enable Hermes engine for better performance on Android'
      });
    }

    // Check for image optimization
    const hasImageOptimization = deps['expo-image'] || deps['react-native-fast-image'];
    if (!hasImageOptimization) {
      this.report.recommendations.push({
        type: 'image_optimization',
        message: 'Consider using expo-image for better image performance'
      });
    }
  }

  generateExpoRecommendations() {
    const deps = this.report.dependencies;
    
    // Check for EAS Build optimization
    if (!fs.existsSync(path.join(this.projectRoot, 'eas.json'))) {
      this.report.recommendations.push({
        type: 'eas_config',
        message: 'Configure EAS Build for optimized production builds'
      });
    }

    // Check for over-the-air updates
    if (!deps['expo-updates']) {
      this.report.recommendations.push({
        type: 'ota_updates',
        message: 'Consider expo-updates for faster deployment cycles'
      });
    }
  }

  async generateReport() {
    log.info('Generating analysis report...');
    
    const reportPath = path.join(this.projectRoot, 'bundle-analysis-report.json');
    const htmlReportPath = path.join(this.projectRoot, 'bundle-analysis-report.html');
    
    // Generate JSON report
    fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2));
    
    // Generate HTML report
    const htmlReport = this.generateHTMLReport();
    fs.writeFileSync(htmlReportPath, htmlReport);
    
    log.success(`Reports generated:`);
    console.log(`  📊 JSON: ${reportPath}`);
    console.log(`  📄 HTML: ${htmlReportPath}`);
    
    // Print summary
    this.printSummary();
  }

  generateHTMLReport() {
    const totalDeps = Object.keys(this.report.dependencies).length;
    const totalSize = Object.values(this.report.dependencies)
      .reduce((sum, dep) => sum + dep.size, 0);
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bundle Analysis Report - Dragon Worlds HK 2027</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 20px; }
        .header { background: #0066CC; color: white; padding: 20px; border-radius: 8px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
        .recommendation { background: #fff3cd; padding: 10px; margin: 5px 0; border-radius: 4px; }
        .warning { background: #f8d7da; }
        .success { background: #d4edda; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📦 Bundle Analysis Report</h1>
        <p>Dragon Worlds HK 2027 - Generated on ${new Date(this.report.timestamp).toLocaleString()}</p>
    </div>

    <div class="section">
        <h2>📊 Summary</h2>
        <p><strong>Total Dependencies:</strong> ${totalDeps}</p>
        <p><strong>Total Size:</strong> ${(totalSize / 1024 / 1024).toFixed(2)} MB</p>
        <p><strong>Recommendations:</strong> ${this.report.recommendations.length}</p>
    </div>

    <div class="section">
        <h2>🔧 Recommendations</h2>
        ${this.report.recommendations.map(rec => 
          `<div class="recommendation ${rec.type === 'large_dependency' ? 'warning' : ''}">${rec.message}</div>`
        ).join('')}
    </div>

    <div class="section">
        <h2>📦 Dependencies</h2>
        <table>
            <thead>
                <tr>
                    <th>Package</th>
                    <th>Version</th>
                    <th>Size (MB)</th>
                    <th>Type</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(this.report.dependencies)
                  .sort(([,a], [,b]) => b.size - a.size)
                  .map(([name, info]) => `
                    <tr>
                        <td>${name}</td>
                        <td>${info.version}</td>
                        <td>${(info.size / 1024 / 1024).toFixed(2)}</td>
                        <td>${info.isDevDependency ? 'Dev' : 'Prod'}</td>
                    </tr>
                  `).join('')}
            </tbody>
        </table>
    </div>
</body>
</html>`;
  }

  printSummary() {
    log.header('\n📊 Bundle Analysis Summary');
    
    const totalDeps = Object.keys(this.report.dependencies).length;
    const totalSize = Object.values(this.report.dependencies)
      .reduce((sum, dep) => sum + dep.size, 0);
    const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
    
    console.log(`Total Dependencies: ${totalDeps}`);
    console.log(`Total Size: ${totalSizeMB} MB`);
    console.log(`Recommendations: ${this.report.recommendations.length}`);
    
    if (this.report.recommendations.length > 0) {
      log.header('\n🔧 Top Recommendations:');
      this.report.recommendations.slice(0, 5).forEach((rec, i) => {
        console.log(`${i + 1}. ${rec.message}`);
      });
    }
    
    // Performance scoring
    const performanceScore = this.calculatePerformanceScore();
    log.header(`\n⚡ Performance Score: ${performanceScore}/100`);
    
    if (performanceScore >= 80) {
      log.success('Excellent! Your bundle is well optimized.');
    } else if (performanceScore >= 60) {
      log.warning('Good, but there\'s room for improvement.');
    } else {
      log.error('Bundle optimization needed for better performance.');
    }
  }

  calculatePerformanceScore() {
    let score = 100;
    
    // Deduct points for large bundle
    const totalSize = Object.values(this.report.dependencies)
      .reduce((sum, dep) => sum + dep.size, 0);
    const sizeMB = totalSize / 1024 / 1024;
    
    if (sizeMB > 200) score -= 30;
    else if (sizeMB > 100) score -= 20;
    else if (sizeMB > 50) score -= 10;
    
    // Deduct points for recommendations
    score -= Math.min(this.report.recommendations.length * 5, 40);
    
    return Math.max(0, Math.min(100, score));
  }
}

// Run the analyzer
if (require.main === module) {
  const analyzer = new BundleAnalyzer();
  analyzer.analyze().catch(error => {
    console.error('Analysis failed:', error);
    process.exit(1);
  });
}

module.exports = BundleAnalyzer;