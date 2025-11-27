/**
 * Production Build Test Script
 * Tests the production build locally before deployment
 */

import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PREVIEW_URL = 'http://localhost:4173';
const API_ENDPOINT = 'https://mvw4x2xbud.execute-api.ap-northeast-2.amazonaws.com/Prod';

console.log('🧪 Testing Production Build...\n');

// Test 1: Check if preview server is running
async function testPreviewServer() {
  console.log('1️⃣ Testing preview server...');
  return new Promise((resolve, reject) => {
    http.get(PREVIEW_URL, (res) => {
      if (res.statusCode === 200) {
        console.log('   ✅ Preview server is running (HTTP 200)');
        resolve(true);
      } else {
        console.log(`   ❌ Preview server returned status ${res.statusCode}`);
        resolve(false);
      }
    }).on('error', (err) => {
      console.log(`   ❌ Preview server error: ${err.message}`);
      resolve(false);
    });
  });
}

// Test 2: Check API connectivity
async function testAPIConnectivity() {
  console.log('\n2️⃣ Testing Lambda API connectivity...');
  
  // Test poetry endpoint
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      audioFeatures: {
        tempo: 120,
        energy: 0.8,
        intensity: 0.7,
        mood: 'energetic',
        valence: 0.8
      },
      persona: 'hamlet',
      language: 'ko',
      style: { length: 'medium', creativity: 0.7 }
    });

    const options = {
      hostname: 'mvw4x2xbud.execute-api.ap-northeast-2.amazonaws.com',
      port: 443,
      path: '/Prod/api/poetry/generate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('   ✅ Poetry API is accessible (HTTP 200)');
          try {
            const response = JSON.parse(data);
            if (response.poetry) {
              console.log('   ✅ Poetry generation working');
              console.log(`   📝 Sample: ${response.poetry.substring(0, 50)}...`);
            }
          } catch (e) {
            console.log('   ⚠️  Response parsing issue');
          }
          resolve(true);
        } else {
          console.log(`   ❌ Poetry API returned status ${res.statusCode}`);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.log(`   ❌ API error: ${err.message}`);
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

// Test 3: Check YouTube endpoint
async function testYouTubeEndpoint() {
  console.log('\n3️⃣ Testing YouTube endpoint...');
  
  return new Promise((resolve) => {
    const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const encodedUrl = encodeURIComponent(testUrl);
    
    const options = {
      hostname: 'mvw4x2xbud.execute-api.ap-northeast-2.amazonaws.com',
      port: 443,
      path: `/Prod/api/youtube/info?url=${encodedUrl}`,
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('   ✅ YouTube API is accessible (HTTP 200)');
          try {
            const response = JSON.parse(data);
            if (response.title) {
              console.log('   ✅ YouTube extraction working');
              console.log(`   🎵 Title: ${response.title.substring(0, 50)}...`);
            }
          } catch (e) {
            console.log('   ⚠️  Response parsing issue');
          }
          resolve(true);
        } else {
          console.log(`   ❌ YouTube API returned status ${res.statusCode}`);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.log(`   ❌ API error: ${err.message}`);
      resolve(false);
    });

    req.end();
  });
}

// Test 4: Check dist files
async function testDistFiles() {
  console.log('\n4️⃣ Checking dist/ directory...');
  
  const distPath = path.join(__dirname, 'dist');
  
  if (!fs.existsSync(distPath)) {
    console.log('   ❌ dist/ directory not found');
    return false;
  }
  
  console.log('   ✅ dist/ directory exists');
  
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    console.log('   ✅ index.html exists');
  } else {
    console.log('   ❌ index.html not found');
    return false;
  }
  
  const assetsPath = path.join(distPath, 'assets');
  if (fs.existsSync(assetsPath)) {
    const files = fs.readdirSync(assetsPath);
    const jsFiles = files.filter(f => f.endsWith('.js'));
    const cssFiles = files.filter(f => f.endsWith('.css'));
    
    console.log(`   ✅ assets/ directory exists (${jsFiles.length} JS, ${cssFiles.length} CSS)`);
    
    if (jsFiles.length === 0) {
      console.log('   ❌ No JS files found');
      return false;
    }
    if (cssFiles.length === 0) {
      console.log('   ❌ No CSS files found');
      return false;
    }
  } else {
    console.log('   ❌ assets/ directory not found');
    return false;
  }
  
  return true;
}

// Run all tests
async function runTests() {
  const results = {
    distFiles: await testDistFiles(),
    previewServer: await testPreviewServer(),
    poetryAPI: await testAPIConnectivity(),
    youtubeAPI: await testYouTubeEndpoint()
  };
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results Summary:');
  console.log('='.repeat(50));
  console.log(`Dist Files:      ${results.distFiles ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Preview Server:  ${results.previewServer ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Poetry API:      ${results.poetryAPI ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`YouTube API:     ${results.youtubeAPI ? '✅ PASS' : '❌ FAIL'}`);
  console.log('='.repeat(50));
  
  const allPassed = Object.values(results).every(r => r);
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! Production build is ready for deployment.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the issues above.');
  }
  
  console.log('\n📝 Manual Testing Checklist:');
  console.log('   1. Open http://localhost:4173 in your browser');
  console.log('   2. Test poetry generation with audio file');
  console.log('   3. Test YouTube URL input and extraction');
  console.log('   4. Test visualization modes (gradient, equalizer, spotlight)');
  console.log('   5. Check browser console for errors (F12)');
  console.log('   6. Test on different browsers (Chrome, Firefox, Edge)');
  console.log('   7. Test responsive design (mobile, tablet, desktop)');
  
  process.exit(allPassed ? 0 : 1);
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
