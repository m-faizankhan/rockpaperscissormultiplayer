import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getDatabase, ref, set, update, get, onValue }
from "https://www.gstatic.com/firebasejs/12.9.0/firebase-database.js";

/* ===== YOUR FIREBASE CONFIG ===== */
const firebaseConfig = {
  apiKey: "AIzaSyBzAHvT6Qt4ly-ivNk1ZLSSpLVddUF8Tco",
  authDomain: "rockpaperscissormultipla-e7a9e.firebaseapp.com",
  databaseURL: "https://rockpaperscissormultipla-e7a9e-default-rtdb.firebaseio.com",
  projectId: "rockpaperscissormultipla-e7a9e",
  storageBucket: "rockpaperscissormultipla-e7a9e.firebasestorage.app",
  messagingSenderId: "1091766543560",
  appId: "1:1091766543560:web:0da9901446bae075e571fd",
  measurementId: "G-LNR7EJ24Q1"
};
/* ================================= */

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let playerName;
let roomCode;
let playerNumber;
let gameActive = false;

window.joinRoom = async function () {
  playerName = document.getElementById("nameInput").value;
  roomCode = document.getElementById("roomInput").value;

  if (!playerName || !roomCode) return alert("Enter name & room");

  const roomRef = ref(db, "rooms/" + roomCode);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) {
    await set(roomRef, {
      players: { player1: playerName },
      scores: { player1: 0, player2: 0 },
      round: 0,
      moves: {}
    });
    playerNumber = "player1";
  } else {
    await update(roomRef, { "players/player2": playerName });
    playerNumber = "player2";
  }

  document.getElementById("joinScreen").classList.add("hidden");
  document.getElementById("gameScreen").classList.remove("hidden");

  listenGame();
};

function listenGame() {
  const roomRef = ref(db, "rooms/" + roomCode);

  onValue(roomRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    const players = data.players;

    if (players.player1 && players.player2) {
      gameActive = true;
      document.getElementById("status").innerText =
        `${players.player1} vs ${players.player2}`;
    }

    document.getElementById("roundDisplay").innerText =
      `Round: ${data.round}/10`;

    document.getElementById("scoreDisplay").innerText =
      `${players.player1}: ${data.scores.player1} | ${players.player2}: ${data.scores.player2}`;

    if (data.round === 10) {
      gameActive = false;

      if (data.scores.player1 > data.scores.player2)
        document.getElementById("status").innerText =
          `${players.player1} Wins The Game!`;
      else if (data.scores.player2 > data.scores.player1)
        document.getElementById("status").innerText =
          `${players.player2} Wins The Game!`;
      else
        document.getElementById("status").innerText = "Game Draw!";
    }

    if (data.moves.player1 && data.moves.player2) {
      resolveRound(data);
    }
  });
}

window.makeMove = async function (move) {
  if (!gameActive) return;

  const moveRef = ref(db, `rooms/${roomCode}/moves`);
  await update(moveRef, { [playerNumber]: move });

  document.getElementById("status").innerText = "Waiting for opponent...";
};

async function resolveRound(data) {
  const m1 = data.moves.player1;
  const m2 = data.moves.player2;
  let scores = data.scores;

  if (m1 !== m2) {
    if (
      (m1 === "rock" && m2 === "scissor") ||
      (m1 === "paper" && m2 === "rock") ||
      (m1 === "scissor" && m2 === "paper")
    ) {
      scores.player1++;
    } else {
      scores.player2++;
    }
  }

  await update(ref(db, "rooms/" + roomCode), {
    scores,
    moves: {},
    round: data.round + 1
  });
}
