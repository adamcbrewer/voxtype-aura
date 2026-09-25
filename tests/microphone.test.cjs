const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const base = path.join(__dirname, '..');
const microphone = {};
vm.createContext(microphone);
vm.runInContext(fs.readFileSync(path.join(base, 'Microphone.js'), 'utf8'), microphone);

const mic = {isStream: false, isSink: false, ready: true, audio: {muted: false}};
const unused = {...mic, audio: {muted: true}};
const stream = {name: 'alsa_capture.voxtype-vulkan', isStream: true, isSink: false,
  ready: true, audio: {muted: false}};
const link = {source: mic, target: stream};
assert.equal(microphone.inspect([mic, unused, stream], [link]), 'ready');
mic.audio.muted = true;
assert.equal(microphone.inspect([mic, stream], [link]), 'muted');
mic.audio.muted = false;
stream.audio.muted = true;
assert.equal(microphone.inspect([mic, stream], [link]), 'muted');
stream.audio.muted = false;
assert.equal(microphone.inspect([mic, stream], []), 'pending');
mic.ready = false;
assert.equal(microphone.inspect([mic, stream], [link]), 'pending');
mic.ready = true;
assert.equal(microphone.inspect([mic], []), 'pending');
assert.equal(microphone.isVoxtype({...stream, name: 'alsa_capture.voxtype-audio-bridge'}), false);
assert.equal(microphone.isVoxtype({...stream, name: 'chromium'}), false);

// Exercise the actual QML state handlers against a deterministic capture graph.
const context = {
  Microphone: microphone, Pipewire: {linkGroups: {values: [link]}},
  captureNodes: [mic, stream], state: 'idle', daemonState: 'idle',
  recordingBlocked: false, recordingVerified: false,
  checkStarted: 0, audioSamples: [], animationFrame: 0,
  cancelProcess: {running: false}, warningTimer: {stop() {}, restart() {}}
};
vm.createContext(context);
const qml = fs.readFileSync(path.join(base, 'Service.qml'), 'utf8');
const handlers = qml.match(/  function (?:update|blockRecording|checkMicrophone)\([^]*?\n  }/g);
assert.equal(handlers.length, 3);
vm.runInContext(handlers.join('\n'), context);
const update = alt => context.update(JSON.stringify({alt}));
mic.audio.muted = true;
update('recording');
assert.equal(context.state, 'muted');
assert.equal(context.cancelProcess.running, true);
update('idle');
update('transcribing'); // A release already queued when cancellation occurred.
update('idle');
assert.equal(context.state, 'muted');
context.cancelProcess.running = false;
mic.audio.muted = false;
update('recording');
assert.equal(context.state, 'recording');
assert.equal(context.recordingBlocked, false);
mic.audio.muted = true;
context.checkMicrophone();
assert.equal(context.state, 'muted');
assert.equal(context.cancelProcess.running, true);
update('idle');
mic.audio.muted = false;
update('recording');
update('transcribing');
assert.equal(context.state, 'transcribing');
update('idle');
assert.equal(context.state, 'success');
update('recording');
context.Pipewire.linkGroups.values = [];
context.checkMicrophone(); // Stream teardown may arrive before stop status.
assert.equal(context.state, 'checking');
update('transcribing');
assert.equal(context.state, 'transcribing');
update('idle');
assert.equal(context.state, 'success');
context.Pipewire.linkGroups.values = [];
update('recording');
assert.equal(context.state, 'checking');
context.checkStarted = Date.now() - 2000;
context.checkMicrophone();
assert.equal(context.state, 'unavailable');
update('idle');
update('recording');
update('transcribing');
assert.equal(context.state, 'unavailable');
console.log('PASS: microphone routing, mute, cancellation, recovery, success, and missing-route handling');
