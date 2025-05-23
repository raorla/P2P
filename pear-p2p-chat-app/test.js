const test = require('tape');
const Hypercore = require('hypercore');
const ram = require('random-access-memory'); // Ensure ram is required

// Test 1: Hypercore to Hypercore Replication
test('Hypercore replication test', async (t) => {
  // Create two in-memory Hypercores using a function that returns a new ram store for each internal file
  const coreA = new Hypercore(() => ram(), { valueEncoding: 'utf-8' });
  const coreB = new Hypercore(() => ram(), { valueEncoding: 'utf-8' });

  await coreA.ready();
  await coreB.ready();

  const testMessage = "hello world";

  // Append a test message to coreA
  await coreA.append(testMessage);

  // Set up replication between coreA and coreB
  const streamA = coreA.replicate(true); // initiator
  const streamB = coreB.replicate(false); // receiver
  streamA.pipe(streamB).pipe(streamA);

  // Wait for coreB to receive the message.
  await new Promise(resolve => {
    const interval = setInterval(async () => {
      if (coreB.length > 0) {
        clearInterval(interval);
        resolve();
      }
    }, 100);
    setTimeout(() => {
        clearInterval(interval);
        resolve(); 
    }, 5000); // Timeout to prevent test hanging
  });
  
  t.equal(coreB.length, 1, 'coreB should have one block after replication');

  // Assert that the message received by coreB is the same as the one sent by coreA
  const receivedMessage = await coreB.get(0);
  t.equal(receivedMessage, testMessage, 'coreB should receive the correct message from coreA');

  // Clean up
  await coreA.close();
  await coreB.close();

  t.end();
});

// Test 2: Handshake Message Formatting
test('Handshake message formatting test', (t) => {
  const localUsername = 'TestUser';
  const localCoreKey = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2'; // 64 char hex

  // Construct the handshake message object
  const handshakeMessageObj = { type: 'hypercore-key', key: localCoreKey, username: localUsername };

  // Simulate sending:
  const jsonMessage = JSON.stringify(handshakeMessageObj);

  // Simulate receiving:
  const parsedMessage = JSON.parse(jsonMessage);

  // Assertions
  t.equal(parsedMessage.type, 'hypercore-key', 'Parsed message type should be "hypercore-key"');
  t.equal(parsedMessage.key, localCoreKey, 'Parsed message key should match localCoreKey');
  t.equal(parsedMessage.username, localUsername, 'Parsed message username should match localUsername');

  t.end();
});
