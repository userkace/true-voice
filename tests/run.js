const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const HOOKS_JS_PATH = path.join(PROJECT_ROOT, 'hooks.js');

function log(msg) {
process.stdout.write(msg + '\n');
}

let passed = 0;
let failed = 0;

function expectEqual(actual, expected, msg) {
if (actual !== expected) {
    throw new Error(`${msg} | Expected: ${expected}, Got: ${actual}`);
}
}

function expectApproximately(actual, expected, tolerance, msg) {
if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${msg} | Expected: ~${expected}, Got: ${actual}`);
}
}

async function expectRejects(promise, contains, msg) {
let threw = false;
try {
    await promise;
} catch (e) {
    threw = true;
    if (contains && !String(e.message || e).includes(contains)) {
    throw new Error(`${msg} | Expected error to include '${contains}', got '${e.message || e}'`);
    }
}
if (!threw) throw new Error(`${msg} | Expected promise to reject`);
}

function defineTestContext() {
// Shared mutable config to control mocked XHR behavior per test
const control = {
    response: {
    status: 200,
    responseText: '{"label":"real","confidence":0.9}',
    error: false,
    },
    progressEvents: [ // default progress simulation
    { loaded: 50, total: 100 },
    { loaded: 100, total: 100 },
    ],
    openCalls: [],
};

class MockFormData {
    constructor() { this._entries = []; }
    append(key, value) { this._entries.push([key, value]); }
}

class MockXMLHttpRequest {
    constructor() {
    this.upload = {};
    this.status = 0;
    this.responseText = '';
    this._opened = false;
    this._method = null;
    this._url = null;
    this._async = true;
    this.onerror = null;
    this.onload = null;
    }
    open(method, url, async) {
    this._opened = true;
    this._method = method;
    this._url = url;
    this._async = async;
    control.openCalls.push({ method, url, async });
    }
    send(formData) {
    setTimeout(() => {
        if (typeof this.upload.onprogress === 'function') {
            for (const evt of control.progressEvents) {
                this.upload.onprogress({ lengthComputable: true, loaded: evt.loaded, total: evt.total });
            }
        }
        if (control.response.error) {
            if (typeof this.onerror === 'function') this.onerror(new Error('network-error'));
            return;
        }
        this.status = control.response.status;
        this.responseText = control.response.responseText;
        if (typeof this.onload === 'function') this.onload();
    }, 0);
    }
}

// Create a VM context that simulates the browser environment expected by hooks.js
const context = {
    FormData: MockFormData,
    XMLHttpRequest: MockXMLHttpRequest,
    window: {},
    console,
    setTimeout,
    clearTimeout,
};

vm.createContext(context);

// Load hooks.js code into the context
const code = fs.readFileSync(HOOKS_JS_PATH, 'utf8');
vm.runInContext(code, context, { filename: 'hooks.js' });

if (typeof context.predictAudio !== 'function') {
    throw new Error('predictAudio was not defined in hooks.js');
}

return { context, control };
}

async function test(name, fn) {
try {
    await fn();
    passed++;
    log(`✔ ${name}`);
} catch (e) {
    failed++;
    log(`✘ ${name}`);
    log(`  → ${e.message || e}`);
}
}

(async () => {
// Test 1: Rejects on empty/invalid file
await test('predictAudio rejects when given empty file', async () => {
    const { context } = defineTestContext();
    await expectRejects(context.predictAudio(null), 'File is empty or invalid', 'empty file reject');
    await expectRejects(context.predictAudio({ size: 0 }), 'File is empty or invalid', 'zero size reject');
});

// Test 2: Success path with progress callback
await test('predictAudio resolves with parsed JSON and reports progress', async () => {
    const { context, control } = defineTestContext();
    control.response = { status: 200, responseText: '{"label":"real","confidence":0.87}', error: false };
    control.progressEvents = [ { loaded: 10, total: 100 }, { loaded: 100, total: 100 } ];

    const progresses = [];
    const result = await context.predictAudio({ size: 123, name: 'f.wav' }, (p) => progresses.push(p));

    expectEqual(result.label, 'real', 'label parsed');
    expectApproximately(result.confidence, 0.87, 1e-9, 'confidence parsed');
    expectEqual(progresses[0], 10, 'first progress percent');
    expectEqual(progresses[1], 100, 'second progress percent');
});

// Test 3: JSON parse error on success status
await test('predictAudio rejects on JSON parse failure', async () => {
    const { context, control } = defineTestContext();
    control.response = { status: 200, responseText: 'not-json', error: false };

    await expectRejects(
    context.predictAudio({ size: 1 }),
    'Failed to parse response',
    'json parse error'
    );
});

// Test 4: Non-2xx with JSON error detail
await test('predictAudio rejects with server-provided error detail', async () => {
    const { context, control } = defineTestContext();
    control.response = { status: 400, responseText: '{"detail":"Bad request"}', error: false };

    await expectRejects(
    context.predictAudio({ size: 1 }),
    'Bad request',
    'server detail error'
    );
});

// Test 5: Non-2xx without JSON body
await test('predictAudio rejects with status code when body is not JSON', async () => {
    const { context, control } = defineTestContext();
    control.response = { status: 500, responseText: '<html>oops</html>', error: false };

    await expectRejects(
    context.predictAudio({ size: 1 }),
    'Request failed with status 500',
    'non-json error body'
    );
});

// Test 6: Network error path
await test('predictAudio rejects on network error', async () => {
    const { context, control } = defineTestContext();
    control.response = { status: 0, responseText: '', error: true };

    await expectRejects(
    context.predictAudio({ size: 1 }),
    'Network error occurred',
    'network error'
    );
});

// Test 7: It uses POST to the expected API_URL
await test('predictAudio opens POST to API_URL', async () => {
    const { context, control } = defineTestContext();
    control.response = { status: 200, responseText: '{"label":"real","confidence":1}', error: false };

    await context.predictAudio({ size: 1 });
    if (control.openCalls.length === 0) throw new Error('XMLHttpRequest.open was not called');
    const { method, url } = control.openCalls[0];
    expectEqual(method, 'POST', 'method should be POST');
    // This is the current API_URL in hooks.js; update here if it changes in source
    const EXPECTED_URL = 'https://truevoiceimg-935145982545.asia-southeast1.run.app/predict';
    expectEqual(url, EXPECTED_URL, 'URL should match API_URL');
});

log('\n— Test Summary —');
log(`Passed: ${passed}`);
log(`Failed: ${failed}`);
if (failed > 0) {
    process.exitCode = 1;

    }
})();