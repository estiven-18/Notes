import { WebSocketServer } from "ws";
import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";

const messageSync = 0;
const messageAwareness = 1;
const pingTimeout = 30000;

const rooms = new Map();

function send(conn, message) {
  if (conn.readyState !== 0 && conn.readyState !== 1) return;
  try {
    conn.send(message, (err) => { if (err) try { conn.close(); } catch {} });
  } catch {
    try { conn.close(); } catch {}
  }
}

function closeRoom(room, conn) {
  const controlledIds = room.conns.get(conn);
  if (controlledIds) {
    room.conns.delete(conn);
    awarenessProtocol.removeAwarenessStates(room.awareness, Array.from(controlledIds), null);
  }
  if (room.conns.size === 0) {
    rooms.delete(room.docName);
    room.doc.destroy();
  }
  try { conn.close(); } catch {}
}

function getOrCreateRoom(name) {
  let room = rooms.get(name);
  if (room) return room;

  const doc = new Y.Doc({ gc: true });
  const awareness = new awarenessProtocol.Awareness(doc);
  awareness.setLocalState(null);

  doc.on("update", (update, origin) => {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.writeUpdate(encoder, update);
    const message = encoding.toUint8Array(encoder);
    room.conns.forEach((_, conn) => {
      if (conn !== origin) send(conn, message);
    });
  });

  awareness.on("update", ({ added, updated, removed }, origin) => {
    const changed = [...added, ...updated, ...removed];
    if (changed.length === 0) return;
    if (origin && room.conns.has(origin)) {
      const controlled = room.conns.get(origin);
      added.forEach((id) => controlled.add(id));
      removed.forEach((id) => controlled.delete(id));
    }
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageAwareness);
    encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(awareness, changed));
    const message = encoding.toUint8Array(encoder);
    room.conns.forEach((_, conn) => send(conn, message));
  });

  room = { docName: name, doc, awareness, conns: new Map() };
  rooms.set(name, room);
  return room;
}

function messageListener(conn, room, data) {
  try {
    const decoder = decoding.createDecoder(data);
    const type = decoding.readVarUint(decoder);
    const encoder = encoding.createEncoder();

    if (type === messageSync) {
      encoding.writeVarUint(encoder, messageSync);
      syncProtocol.readSyncMessage(decoder, encoder, room.doc, conn);
      if (encoding.length(encoder) > 1) {
        send(conn, encoding.toUint8Array(encoder));
      }
    } else if (type === messageAwareness) {
      awarenessProtocol.applyAwarenessUpdate(room.awareness, decoding.readVarUint8Array(decoder), conn);
    }
  } catch (err) {
    console.error("Yjs protocol error:", err);
  }
}

export function setupSignalingServer(server) {
  const wss = new WebSocketServer({ noServer: true });

  wss.on("connection", (conn, req) => {
    const docName = (req.url || "").slice(1).split("?")[0];
    if (!docName) { conn.close(); return; }

    conn.binaryType = "arraybuffer";
    const room = getOrCreateRoom(docName);
    room.conns.set(conn, new Set());

    conn.on("message", (data) => {
      const buffer = data instanceof Buffer ? new Uint8Array(data) : new Uint8Array(data);
      messageListener(conn, room, buffer);
    });

    let pongReceived = true;
    const pingInterval = setInterval(() => {
      if (!pongReceived) {
        closeRoom(room, conn);
        clearInterval(pingInterval);
      } else if (room.conns.has(conn)) {
        pongReceived = false;
        try { conn.ping(); } catch { closeRoom(room, conn); clearInterval(pingInterval); }
      }
    }, pingTimeout);

    conn.on("pong", () => { pongReceived = true; });
    conn.on("close", () => { closeRoom(room, conn); clearInterval(pingInterval); });

    // Send sync step 1
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.writeSyncStep1(encoder, room.doc);
    send(conn, encoding.toUint8Array(encoder));

    // Send all current awareness states
    const states = room.awareness.getStates();
    if (states.size > 0) {
      const aEncoder = encoding.createEncoder();
      encoding.writeVarUint(aEncoder, messageAwareness);
      encoding.writeVarUint8Array(aEncoder, awarenessProtocol.encodeAwarenessUpdate(room.awareness, Array.from(states.keys())));
      send(conn, encoding.toUint8Array(aEncoder));
    }
  });

  server.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });
}
