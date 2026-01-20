/**
 * WebSocket Connection Hook
 *
 * Manages the WebSocket connection for real-time game communication.
 * Handles connecting to the game server, sending messages, and receiving
 * state updates that are broadcast to all players in a room.
 *
 * Connection Flow:
 * 1. Hook is called with room/player info and mode (create/join)
 * 2. WebSocket connection is established to the server
 * 3. On open, sends 'create' or 'join' message based on mode
 * 4. Server responds with 'state' messages containing room state
 * 5. State updates are reflected in roomState and passed to onStateUpdate callback
 *
 * Message Types Sent:
 * - create: Create/join a room as host
 * - join: Join an existing room as a player
 * - set_config: Update map configuration (host only)
 * - set_race: Set player's selected race
 * - set_ready: Toggle player's ready status
 * - start: Start the game (host only)
 *
 * Message Types Received:
 * - state: Updated room state (players, host, map, started)
 * - error: Error response with code and message
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { WS_URL } from '../config';
import type { RoomState, MapConfig, WSMessage, WSResponse } from '../types';

/**
 * Configuration options for the useGameSocket hook
 */
type UseGameSocketOptions = {
  /** The room ID to connect to */
  roomId: string;
  /** The player's display name */
  playerName: string;
  /** The player's unique UUID */
  playerId: string;
  /** Whether to create a new room or join existing */
  mode: 'create' | 'join';
  /** Callback fired when room state is updated */
  onStateUpdate?: (state: RoomState) => void;
  /** Callback fired when an error is received */
  onError?: (error: { code: string; message: string }) => void;
};

/**
 * Custom React hook for managing WebSocket game communication
 *
 * Establishes and maintains a WebSocket connection to the game server,
 * automatically sending the initial create/join message and handling
 * incoming state updates and errors.
 *
 * @param options - Configuration object with room/player info and callbacks
 * @returns Object containing connection state, room state, and action methods
 *
 * @example
 * ```tsx
 * const {
 *   connected,
 *   roomState,
 *   setConfig,
 *   setRace,
 *   setReady,
 *   startGame,
 * } = useGameSocket({
 *   roomId: 'ABCD',
 *   playerName: 'Alice',
 *   playerId: 'uuid-123',
 *   mode: 'create',
 *   onStateUpdate: (state) => console.log('State updated:', state),
 *   onError: (err) => console.error('Error:', err.message),
 * });
 * ```
 */
export function useGameSocket({
  roomId,
  playerName,
  playerId,
  mode,
  onStateUpdate,
  onError,
}: UseGameSocketOptions) {
  /** Reference to the WebSocket instance for sending messages */
  const wsRef = useRef<WebSocket | null>(null);

  /** Whether the WebSocket connection is currently open */
  const [connected, setConnected] = useState(false);

  /** Current state of the room (players, host, map config, game status) */
  const [roomState, setRoomState] = useState<RoomState>({
    players: [],
    host: undefined,
    map: undefined,
    started: false,
  });

  /**
   * Effect: Establish WebSocket connection
   *
   * Creates a new WebSocket connection when the component mounts or when
   * any of the connection parameters change. Automatically sends the
   * initial create/join message when the connection opens.
   *
   * Cleanup: Closes the WebSocket connection when the component unmounts
   * or when dependencies change (triggering a reconnection).
   */
  useEffect(() => {
    // Don't connect if required parameters are missing
    if (!roomId || !playerName || !playerId) return;

    // Create new WebSocket connection
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    /**
     * Handle WebSocket connection open
     * Sends the initial create or join message to the server
     */
    ws.onopen = () => {
      setConnected(true);
      // Send create or join message based on mode
      const msg: WSMessage = {
        type: mode,
        roomId,
        playerName,
        playerId,
      };
      ws.send(JSON.stringify(msg));
    };

    /**
     * Handle incoming WebSocket messages
     * Parses JSON and routes to appropriate handler based on message type
     */
    ws.onmessage = (event) => {
      try {
        const data: WSResponse = JSON.parse(event.data);

        if (data.type === 'state') {
          // Update room state from server broadcast
          const newState: RoomState = {
            players: data.players || [],
            host: data.host,
            map: data.map,
            started: data.started,
          };
          setRoomState(newState);
          onStateUpdate?.(newState);
        } else if (data.type === 'error') {
          // Pass error to callback for handling
          onError?.({ code: data.code, message: data.message });
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    /**
     * Handle WebSocket connection close
     * Updates connected state to trigger UI updates
     */
    ws.onclose = () => {
      setConnected(false);
    };

    /**
     * Handle WebSocket errors
     * Logs error and updates connected state
     */
    ws.onerror = (e) => {
      console.error('WebSocket error:', e);
      setConnected(false);
    };

    // Cleanup: close connection when unmounting or reconnecting
    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [roomId, playerName, playerId, mode, onStateUpdate, onError]);

  /**
   * Send a message through the WebSocket connection
   * Only sends if the connection is open
   *
   * @param message - The message object to send (will be JSON stringified)
   */
  const send = useCallback((message: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  /**
   * Update the map configuration for the room
   * Only the host can change map settings
   *
   * @param map - New map configuration (radius, density, smooth, size, seed)
   */
  const setConfig = useCallback(
    (map: MapConfig) => {
      send({ type: 'set_config', roomId, playerName, map });
    },
    [send, roomId, playerName]
  );

  /**
   * Set the player's selected race
   * Any player can change their own race selection
   *
   * @param race - The race to select (e.g., 'Humans', 'Elves', 'Orcs')
   */
  const setRace = useCallback(
    (race: string) => {
      send({ type: 'set_race', roomId, playerName, race });
    },
    [send, roomId, playerName]
  );

  /**
   * Toggle the player's ready status
   * Players must be ready before the host can start the game
   *
   * @param ready - Whether the player is ready to start
   */
  const setReady = useCallback(
    (ready: boolean) => {
      send({ type: 'set_ready', roomId, playerName, playerId, ready });
    },
    [send, roomId, playerName, playerId]
  );

  /**
   * Start the game
   * Only the host can start the game, typically after all players are ready
   */
  const startGame = useCallback(() => {
    send({ type: 'start', roomId, playerName });
  }, [send, roomId, playerName]);

  return {
    /** Whether the WebSocket is currently connected */
    connected,
    /** Current room state (players, host, map, started) */
    roomState,
    /** Function to update map configuration (host only) */
    setConfig,
    /** Function to set player's race selection */
    setRace,
    /** Function to toggle player's ready status */
    setReady,
    /** Function to start the game (host only) */
    startGame,
  };
}
