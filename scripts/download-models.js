/**
 * scripts/download-models.js
 * Automates downloading of all offline AI models and web vision assets:
 * 1. MediaPipe Hands offline WASM, binarypb, and JS bundle into vendor/mediapipe/
 * 2. Qwen2.5-0.5B-Instruct (Q4_K_M GGUF) on-device SLM into llm-testbed/models/
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const MEDIAPIPE_DIR = path.resolve(__dirname, '../vendor/mediapipe');
const MODELS_DIR = path.resolve(__dirname, '../llm-testbed/models');

const MEDIAPIPE_FILES = [
  { url: 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js', name: 'camera_utils.js' },
  { url: 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js', name: 'drawing_utils.js' },
  { url: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js', name: 'hands.js' },
  { url: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands_solution_packed_assets_loader.js', name: 'hands_solution_packed_assets_loader.js' },
  { url: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands_solution_simd_wasm_bin.js', name: 'hands_solution_simd_wasm_bin.js' },
  { url: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands_solution_simd_wasm_bin.wasm', name: 'hands_solution_simd_wasm_bin.wasm' },
  { url: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.binarypb', name: 'hands.binarypb' }
];

const LLM_MODEL = {
  name: 'qwen2.5-0.5b-instruct-q4_k_m.gguf',
  url: 'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf',
  sizeDesc: '~398 MB'
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 1000) {
      console.log(`  ✓ Already downloaded: ${path.basename(destPath)}`);
      return resolve();
    }

    const client = url.startsWith('https') ? https : http;
    const request = client.get(url, (response) => {
      // Handle redirects (e.g. Hugging Face CDN 302 / 307)
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: HTTP ${response.statusCode}`));
      }

      const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
      let downloadedBytes = 0;
      let lastReport = 0;
      const fileStream = fs.createWriteStream(destPath);

      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        fileStream.write(chunk);

        const now = Date.now();
        if (now - lastReport > 1000) {
          lastReport = now;
          if (totalBytes > 0) {
            const pct = ((downloadedBytes / totalBytes) * 100).toFixed(1);
            const mb = (downloadedBytes / (1024 * 1024)).toFixed(1);
            const totalMb = (totalBytes / (1024 * 1024)).toFixed(1);
            process.stdout.write(`    Progress: ${pct}% (${mb}/${totalMb} MB)\r`);
          } else {
            const mb = (downloadedBytes / (1024 * 1024)).toFixed(1);
            process.stdout.write(`    Downloaded: ${mb} MB\r`);
          }
        }
      });

      response.on('end', () => {
        fileStream.end();
        console.log(`\n  ✓ Completed: ${path.basename(destPath)}`);
        resolve();
      });

      response.on('error', (err) => {
        fileStream.close();
        fs.unlink(destPath, () => {});
        reject(err);
      });
    });

    request.on('error', reject);
  });
}

async function main() {
  console.log('===============================================================');
  console.log('     OmniSign Automated AI Model & Offline Asset Downloader    ');
  console.log('===============================================================\n');

  ensureDir(MEDIAPIPE_DIR);
  ensureDir(MODELS_DIR);

  console.log('1. Downloading MediaPipe Hands Offline Vision Assets...');
  for (const item of MEDIAPIPE_FILES) {
    const dest = path.join(MEDIAPIPE_DIR, item.name);
    console.log(`  Downloading: ${item.name}...`);
    try {
      await downloadFile(item.url, dest);
    } catch (err) {
      console.warn(`    ⚠️ Warning: Could not download ${item.name} (${err.message}). Will use online fallback.`);
    }
  }

  console.log('\n2. Downloading On-Device SLM (Qwen2.5-0.5B Q4_K_M GGUF)...');
  const llmDest = path.join(MODELS_DIR, LLM_MODEL.name);
  try {
    await downloadFile(LLM_MODEL.url, llmDest);
  } catch (err) {
    console.warn(`  ⚠️ Warning: Could not download GGUF model: ${err.message}`);
    console.log('  You can manually download it with:');
    console.log(`  curl -L -o "llm-testbed/models/${LLM_MODEL.name}" "${LLM_MODEL.url}"`);
  }

  console.log('\n===============================================================');
  console.log('✅ AI Models & Offline Assets setup check complete!');
  console.log('===============================================================\n');
}

main().catch(err => {
  console.error('Fatal error in downloader:', err);
  process.exit(1);
});
