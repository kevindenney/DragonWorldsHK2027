const axios = require('axios');
const pdf = require('pdf-parse');

async function testPDF() {
  try {
    console.log('📄 Testing CCR 2024 IRC 3 PDF...');
    
    const url = 'https://www.rhkyc.org.hk/storage/app/media/Sailing/result/CHINA-COAST-REGATTA/2024/CCR2024IRC3.pdf';
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    
    console.log('✅ Downloaded PDF, size:', response.data.length);
    
    const pdfData = await pdf(response.data);
    console.log('📄 Text length:', pdfData.text.length);
    console.log('\n📋 First 500 characters:');
    console.log(pdfData.text.substring(0, 500));
    
    // Look for Juice specifically
    const lines = pdfData.text.split('\n');
    const juiceLines = lines.filter(line => line.toLowerCase().includes('juice'));
    
    if (juiceLines.length > 0) {
      console.log('\n🏆 Found Juice references:');
      juiceLines.forEach(line => console.log('  -', line.trim()));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPDF();