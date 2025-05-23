# P2P Chat Application

## Description

This is a simple command-line P2P (peer-to-peer) chat application built using Node.js and Pear's core modules (Hyperswarm for peer discovery and Hypercore for messaging). It allows users to connect directly with other peers on the network and exchange text messages without a central server.

## Features

- Peer discovery using Hyperswarm.
- Direct P2P text chat using Hypercore.
- User-selectable usernames displayed in chat.
- Command-line interface.

## Prerequisites

- Node.js (which includes npm). You can download it from [https://nodejs.org/](https://nodejs.org/).

## Setup & Running Locally

1.  **Navigate to the Application Directory:**
    Open your terminal and change to the `pear-p2p-chat-app` directory where `chat.js` and `package.json` are located.
    ```bash
    cd path/to/pear-p2p-chat-app
    ```

2.  **Install Dependencies:**
    If you haven't already, or if you were to use this code in a fresh directory, you would install the necessary Node.js modules by running:
    ```bash
    npm install
    ```
    This will install `hyperswarm`, `hypercore`, and other dependencies listed in `package.json`.

3.  **Run the Application (Two Terminals Needed):**
    To test the P2P chat, you need to simulate two different peers. You'll do this by running the application in two separate terminal windows.

    *   **Terminal 1 (Peer A):**
        Open a new terminal window, navigate to the `pear-p2p-chat-app` directory, and run:
        ```bash
        node chat.js
        ```
        The application will start and prompt you: `Please enter your username:`. Enter a username (e.g., "Alice") and press Enter. You will then see messages indicating it's ready and waiting for connections.

    *   **Terminal 2 (Peer B):**
        Open a second terminal window, navigate to the same `pear-p2p-chat-app` directory, and run:
        ```bash
        node chat.js
        ```
        Again, you'll be prompted for a username. Enter a different username (e.g., "Bob") and press Enter.

4.  **Connect and Chat:**
    After a few moments, the two instances of the application (Peer A and Peer B) should discover each other on the network. You'll see system messages indicating a connection has been made and that you're ready to chat with the other user.

    Now, type a message in either terminal and press Enter. The message will appear in the other user's terminal, prefixed with their username. For example, if Alice types "Hello Bob!" in her terminal, Bob will see "Alice: Hello Bob!" in his.

## Important Note

This is a **command-line application**. It does not have a graphical user interface (GUI). All interactions (entering usernames, sending/receiving messages) happen directly within the terminal.
