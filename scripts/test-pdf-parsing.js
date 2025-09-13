#!/usr/bin/env node

/**
 * Simple test for PDF parsing without Firebase Functions
 */

const axios = require('axios');
const pdf = require('pdf-parse');

async function testPDFParsing() {
  try {
    console.log('📄 Testing PDF parsing for CCR 2024...');
    
    // Test with one PDF first
    const testURL = 'https://www.rhkyc.org.hk/storage/app/media/Sailing/result/CHINA-COAST-REGATTA/2024/CCR2024IRC3.pdf';
    
    console.log('📡 Downloading PDF:', testURL);
    
    const response = await axios.get(testURL, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CCR2024-Test/1.0)'
      }
    });
    
    console.log('✅ PDF downloaded, size:', response.data.length, 'bytes');
    
    // Parse PDF
    const pdfData = await pdf(response.data);
    console.log('📋 PDF parsed, text length:', pdfData.text.length, 'characters');
    
    // Show first 1000 characters
    console.log('\n📝 PDF Content Preview:');
    console.log('=' .repeat(50));
    console.log(pdfData.text.substring(0, 1000));
    console.log('=' .repeat(50));
    
    // Look for boat names and results
    const lines = pdfData.text.split('\n').filter(line => line.trim());
    console.log('\n🔍 Looking for sailing results...');
    
    let foundBoats = [];
    for (let i = 0; i < Math.min(lines.length, 50); i++) {
      const line = lines[i].trim();
      
      // Look for lines that might contain boat names and points
      if (line.match(/\d+\.?\d*\s*pts?/i) || line.match(/juice|witchcraft|whiskey|jack/i)) {
        console.log(`Line ${i}: ${line}`);
        if (line.toLowerCase().includes('juice')) {
          foundBoats.push({ line: i, content: line, boat: 'Juice' });
        }
      }
    }
    
    if (foundBoats.length > 0) {
      console.log('\n🏆 Found potential boat results:');
      foundBoats.forEach(boat => {
        console.log(`  ${boat.boat}: ${boat.content}`);
      });
    } else {
      console.log('\n❌ No recognizable boat results found in preview');
    }
    
    // Try to parse table structure
    console.log('\n📊 Analyzing table structure...');
    const tabularLines = lines.filter(line => {
      const words = line.trim().split(/\s+/);
      return words.length >= 3 && words.some(word => /^\d+(\.\d+)?$/.test(word));
    });
    
    console.log(`Found ${tabularLines.length} lines that look like table data:`);
    tabularLines.slice(0, 10).forEach((line, index) => {
      console.log(`  ${index + 1}: ${line}`);
    });
    
  } catch (error) {
    console.error('❌ PDF parsing test failed:', error.message);
    if (error.response) {
      console.error('📡 HTTP Status:', error.response.status);
      console.error('📡 HTTP Headers:', error.response.headers);
    }
  }
}

// Run the test
testPDFParsing()
  .then(() => {
    console.log('\n✅ PDF parsing test completed');
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
  });