// Import necessary modules
const Hyperswarm = require('hyperswarm');
const Hypercore = require('hypercore');
const crypto = require('crypto');
const readline = require('readline');
const ram = require('random-access-memory'); // Added random-access-memory

// --- Hyperswarm Setup ---
const topicString = 'pear-friend-connect-chat-app-v3'; // New topic for profile version
const topic = crypto.createHash('sha256').update(topicString).digest();
console.log(`Chat Topic: ${topic.toString('hex')}`);

const swarm = new Hyperswarm();

// --- Local Hypercore Setup ---
// Updated to use ram for storage
const localCore = new Hypercore(ram, { valueEncoding: 'utf-8', persist: false });

// --- Readline Interface for User Input ---
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
  // Prompt will be set after getting username
});

// Store local username and connected peers
let localUsername = 'Anonymous'; // Default username
const connectedPeers = new Map(); // Key: peerId (Hyperswarm peer public key hex), Value: { socket, remoteCore, username }

// --- Utility function to ask questions ---
function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// --- Main Application Logic ---
async function main() {
  // 1. Get Username
  const inputUsername = await askQuestion('Please enter your username: ');
  if (inputUsername.trim()) {
    localUsername = inputUsername.trim();
  }
  rl.setPrompt(`${localUsername}: `); // Set prompt after getting username

  await localCore.ready();
  console.log(`\n[System] Your local Hypercore is ready.`);
  console.log(`[System] Your Hypercore Key (share with peers): ${localCore.key.toString('hex')}`);
  console.log(`[System] Welcome, ${localUsername}! Waiting for connections to exchange chat messages...`);
  rl.prompt();

  // Join the swarm
  swarm.join(topic, {
    server: true, // Announce yourself
    client: true  // Look for other peers
  });

  swarm.on('connection', (socket, peerInfo) => {
    const peerId = peerInfo.publicKey.toString('hex');
    let peerName = peerId.substring(0, 6) + '...'; // Default name until username is received
    console.log(`\n[System] New connection from potential peer: ${peerName}`);
    socket.setKeepAlive(true);

    // 2. Send local Hypercore key and username to the new peer
    socket.write(JSON.stringify({ 
      type: 'hypercore-key', 
      key: localCore.key.toString('hex'),
      username: localUsername 
    }));

    let remoteHypercoreKey = null;
    let remoteCore = null;

    socket.on('data', async (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === 'hypercore-key' && message.key && message.username) {
          if (remoteHypercoreKey) return; // Already received key from this peer

          remoteHypercoreKey = message.key;
          const remoteUsername = message.username;
          peerName = remoteUsername; // Update peerName with the received username

          console.log(`\n[System] Received Hypercore key and username from ${peerName} (Key: ${remoteHypercoreKey.substring(0, 6)}...)`);

          // Initialize Remote Hypercore for reading
          // Updated to use ram for storage
          remoteCore = new Hypercore(ram, remoteHypercoreKey, { 
            valueEncoding: 'utf-8', 
            persist: false,
            sparse: true
          });
          await remoteCore.ready();
          
          // Store peer information
          connectedPeers.set(peerId, { socket, remoteCore, username: remoteUsername });
          console.log(`\n[System] Ready to chat with ${remoteUsername}. Type your message.`);
          rl.prompt();

          // Replicate Hypercores
          localCore.replicate(socket);
          remoteCore.replicate(socket);
          
          // Handle Incoming Messages from this specific peer
          remoteCore.createReadStream({ live: true, tail: true }).on('data', (chatMessage) => {
            const senderUsername = connectedPeers.get(peerId)?.username || peerName; // Fallback to peerName if username somehow missing
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0);
            console.log(`${senderUsername}: ${chatMessage}`);
            rl.prompt(true);
          });
        }
      } catch (e) {
        // console.error(`\n[System] Error processing data from ${peerName}: ${e.message}. Data: ${data.toString()}`);
      }
    });

    socket.on('error', (err) => {
      const currentPeerInfo = connectedPeers.get(peerId);
      const currentPeerName = currentPeerInfo?.username || peerName;
      console.error(`\n[System] Connection error with ${currentPeerName}: ${err.message}`);
      if (remoteCore) remoteCore.close().catch(e => console.error(`\n[System] Error closing remote core for ${currentPeerName}: ${e.message}`));
      connectedPeers.delete(peerId);
      rl.prompt();
    });

    socket.on('close', () => {
      const currentPeerInfo = connectedPeers.get(peerId);
      const currentPeerName = currentPeerInfo?.username || peerName;
      console.log(`\n[System] Connection closed with ${currentPeerName}`);
      if (remoteCore) remoteCore.close().catch(e => console.error(`\n[System] Error closing remote core for ${currentPeerName}: ${e.message}`));
      connectedPeers.delete(peerId);
      rl.prompt();
    });
  });

  // --- Implement Message Sending ---
  rl.on('line', async (input) => {
    const trimmedInput = input.trim();
    if (trimmedInput) {
      await localCore.append(trimmedInput);
    }
    rl.prompt();
  });
}

// --- Graceful Shutdown ---
async function gracefulShutdown() {
  console.log('\n[System] Shutting down...');
  rl.close();

  await swarm.leave(topic).catch(e => console.error(`[System] Error leaving swarm: ${e.message}`));
  await swarm.destroy().catch(e => console.error(`[System] Error destroying swarm: ${e.message}`));
  
  if (localCore) {
    await localCore.close().catch(e => console.error(`[System] Error closing local Hypercore: ${e.message}`));
  }

  for (const peer of connectedPeers.values()) {
    if (peer.remoteCore) {
      await peer.remoteCore.close().catch(e => console.error(`[System] Error closing remote core for ${peer.username}: ${e.message}`));
    }
  }
  
  console.log('[System] Exited.');
  process.exit(0);
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

main().catch(err => {
  console.error('[System] Critical error in main function:', err);
  gracefulShutdown();
});

console.log('[System] Starting P2P Chat App with User Profiles...');
