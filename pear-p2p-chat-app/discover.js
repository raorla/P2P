// Import necessary modules
const Hyperswarm = require('hyperswarm');
const crypto = require('crypto');

// Define a topic for the application.
// This should be a 32-byte buffer. We'll derive it from a string.
const topicString = 'pear-friend-connect-app';
const topic = crypto.createHash('sha256').update(topicString).digest();
console.log(`Topic: ${topic.toString('hex')}`);

// Initialize Hyperswarm
const swarm = new Hyperswarm();

// Set up event listeners
// When a new peer connects
swarm.on('connection', (socket, peerInfo) => {
  console.log('New connection from peer:', peerInfo.publicKey.toString('hex'));

  // You can interact with the peer through the socket
  // For example, socket.write('Hello from peer!');
  // socket.on('data', data => console.log('Received data:', data.toString()));

  // Keep the connection alive
  socket.on('error', err => console.error('Connection error:', err));
  socket.on('close', () => console.log('Connection closed with peer:', peerInfo.publicKey.toString('hex')));
});

// Join the swarm using the defined topic
// This will announce the peer and look for other peers on the same topic
swarm.join(topic, {
  server: true, // Announce yourself as a server
  client: true  // Look for other peers (clients)
});

console.log('Joining swarm on topic. Waiting for connections...');

// Keep the script running
// Hyperswarm keeps the process running as long as it's active.
// For explicit control or in environments where it might exit prematurely:
setInterval(() => {
  // This interval will keep the Node.js event loop active.
  // You can also add status logging here if needed.
  const { connected, connecting, localConnections, remoteConnections } = swarm.networkStatus()
  console.log(`Swarm status: connected=${connected}, connecting=${connecting}, local=${localConnections}, remote=${remoteConnections}`)
}, 30000); // Log status every 30 seconds

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nLeaving swarm and exiting...');
  await swarm.leave(topic);
  await swarm.destroy();
  process.exit(0);
});
