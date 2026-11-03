import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { HikvisionDoorbellAPI } from '../src/doorbell-api';

test('call state log starts from idle when polling restarts for the next call', async () => {
    mock.timers.enable ({ apis: ['setInterval'] });
    const logs: string[] = [];
    const quiet = () => {};
    const console = { info: (m: string) => logs.push (m), debug: quiet, warn: quiet, error: quiet, log: quiet } as any;
    const api = new HikvisionDoorbellAPI ('192.0.2.1', '80', 'user', 'pass', 'push', console, undefined as any, true) as any;
    let status = 'onCall';
    api.getCallStatus = async () => status;
    const poll = async () => {
        mock.timers.tick (1000);
        await new Promise ((resolve) => setImmediate (resolve));
    };

    try {
        // the first call ends while the station still reads onCall (push alarm 18 stops the poll)
        api.startCallStatusPolling();
        await poll();
        api.stopCallStatusPolling();

        status = 'ring';
        api.startCallStatusPolling();
        await poll();
        api.stopCallStatusPolling();
    }
    finally {
        mock.timers.reset();
    }

    assert.deepEqual (logs.filter ((m) => m.startsWith ('Call state changed')), [
        'Call state changed: idle -> onCall',
        'Call state changed: idle -> ring',
    ]);
});
