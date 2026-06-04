/**
 * hooks.js — Zephyr Scale Cloud integration
 *
 * After each scenario, reads @SCRUM-T tags and posts the result
 * to Zephyr Scale Cloud via the Smartbear API.
 *
 * Requires in .env:
 *   ZEPHYR_TOKEN=your_zephyr_scale_api_token
 *   JIRA_PROJECT_KEY=SCRUM
 *
 * Get your token: Jira → Apps → Zephyr Scale → API Access Tokens
 */

require('dotenv').config();
const { After, AfterAll, BeforeAll } = require('@cucumber/cucumber');
const https = require('https');

// ─── Config ───────────────────────────────────────────────────────────────────
const ZEPHYR_TOKEN   = process.env.ZEPHYR_TOKEN    || '';
const PROJECT_KEY    = process.env.JIRA_PROJECT_KEY || 'SCRUM';
const ZEPHYR_BASE    = 'api.zephyrscale.smartbear.com';
const ZEPHYR_PATH    = '/v2';

// Zephyr Scale status names
const STATUS_MAP = {
  PASSED:    'Pass',
  FAILED:    'Fail',
  PENDING:   'Not Executed',
  SKIPPED:   'Not Executed',
  AMBIGUOUS: 'Fail',
  UNKNOWN:   'Not Executed',
};

// ─── HTTP helper ──────────────────────────────────────────────────────────────
function zephyrRequest(method, endpoint, body) {
  return new Promise((resolve, reject) => {
    const data    = body ? JSON.stringify(body) : null;
    const options = {
      hostname : ZEPHYR_BASE,
      port     : 443,
      path     : ZEPHYR_PATH + endpoint,
      method,
      headers  : {
        'Authorization' : `Bearer ${ZEPHYR_TOKEN}`,
        'Content-Type'  : 'application/json',
        'Accept'        : 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => {
        try   { resolve({ status: res.statusCode, body: raw ? JSON.parse(raw) : {} }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ─── Post a test execution to Zephyr Scale ───────────────────────────────────
async function postExecution(testCaseKey, statusName, comment) {
  // POST /v2/testexecutions
  const body = {
    projectKey   : PROJECT_KEY,
    testCaseKey,
    testCycleKey : process.env.ZEPHYR_CYCLE_KEY || '',
    statusName,
    comment      : comment || '',
  };

  const res = await zephyrRequest('POST', '/testexecutions', body);

  if (res.status >= 200 && res.status < 300) {
    return res.body;
  }

  // Log the actual error for debugging
  console.warn(`  [Zephyr] POST /testexecutions failed (HTTP ${res.status}):`, JSON.stringify(res.body).slice(0, 200));
  return null;
}

// ─── Runtime state ────────────────────────────────────────────────────────────
const results    = [];
let   zephyrReady = true;

BeforeAll(async function () {
  if (!ZEPHYR_TOKEN) {
    console.warn('\n[Zephyr] WARNING: ZEPHYR_TOKEN not set in .env');
    console.warn('[Zephyr] Results will NOT be synced. Get token from:');
    console.warn('[Zephyr] Jira → Apps → Zephyr Scale → API Access Tokens\n');
    zephyrReady = false;
    return;
  }

  // Quick connectivity check — list test cases for the project
  const check = await zephyrRequest('GET', `/testcases?projectKey=${PROJECT_KEY}&maxResults=1`);
  if (check.status === 200) {
    console.log(`\n[Zephyr] Connected to Zephyr Scale Cloud`);
    console.log(`[Zephyr] Project: ${PROJECT_KEY} — results will sync after each scenario.\n`);
  } else if (check.status === 401) {
    console.warn('\n[Zephyr] ERROR: Invalid ZEPHYR_TOKEN (401 Unauthorized)');
    console.warn('[Zephyr] Please regenerate your token from Zephyr Scale → API Access Tokens\n');
    zephyrReady = false;
  } else {
    console.warn(`\n[Zephyr] WARNING: Connectivity check returned HTTP ${check.status}`);
    console.warn('[Zephyr] Will attempt to sync anyway.\n');
  }
});

After(async function (scenario) {
  if (!zephyrReady) return;

  // Extract @SCRUM-T tags
  const tags        = scenario.pickle.tags.map(t => t.name);
  const zephyrTags  = tags.filter(t => /^@SCRUM-T\d+$/i.test(t));

  if (zephyrTags.length === 0) return;

  const cucumberStatus = scenario.result.status.toUpperCase();
  const statusName     = STATUS_MAP[cucumberStatus] ?? 'Not Executed';
  const comment        = cucumberStatus === 'FAILED'
    ? `FAILED: ${(scenario.result.message || 'No error message').slice(0, 500)}`
    : `Automated run: ${cucumberStatus}`;

  for (const tag of zephyrTags) {
    const testCaseKey = tag.replace('@', '');  // 'SCRUM-T1'
    results.push({ testCaseKey, statusName, cucumberStatus });

    try {
      const exec = await postExecution(testCaseKey, statusName, comment);
      if (exec) {
        console.log(`  [Zephyr] ${testCaseKey} → ${statusName}`);
      }
    } catch (err) {
      console.warn(`  [Zephyr] ${testCaseKey} → error: ${err.message}`);
    }
  }
});

AfterAll(async function () {
  if (!zephyrReady || results.length === 0) return;

  const passed = results.filter(r => r.cucumberStatus === 'PASSED').length;
  const failed = results.filter(r => r.cucumberStatus === 'FAILED').length;
  const total  = results.length;

  console.log('\n─────────────────────────────────────');
  console.log(`[Zephyr] Sync complete: ${total} result(s) posted`);
  console.log(`         ✓ Pass: ${passed}   ✗ Fail: ${failed}`);
  console.log('─────────────────────────────────────\n');
});
