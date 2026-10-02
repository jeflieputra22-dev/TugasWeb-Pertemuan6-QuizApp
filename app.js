'use strict';

// ===== Data soal (8 soal, minimal 5) =====
const quizData = [
  { question: 'Apa kepanjangan dari DOM?',
    options: ['Document Object Model', 'Data Object Mapping', 'Digital Order Method', 'Display Output Module'], correct: 0 },
  { question: 'Method modern untuk memilih elemen dengan CSS selector adalah…',
    options: ['getElementById', 'querySelector', 'getElementsByTagName', 'findElement'], correct: 1 },
  { question: 'Method untuk membuat elemen HTML baru lewat JavaScript?',
    options: ['document.create()', 'document.newElement()', 'document.createElement()', 'element.make()'], correct: 2 },
  { question: 'Properti yang aman dari XSS untuk mengubah teks elemen adalah…',
    options: ['innerHTML', 'outerHTML', 'textContent', 'insertAdjacentHTML'], correct: 2 },
  { question: 'Teknik memasang satu listener di parent untuk menangani event anak disebut…',
    options: ['Event bubbling saja', 'Event delegation', 'Event capturing', 'Event binding'], correct: 1 },
  { question: 'Method untuk menyimpan data di LocalStorage?',
    options: ['localStorage.setItem()', 'localStorage.add()', 'localStorage.push()', 'localStorage.write()'], correct: 0 },
  { question: 'querySelectorAll mengembalikan…',
    options: ['Array', 'HTMLCollection', 'NodeList', 'Satu elemen'], correct: 2 },
  { question: 'Method untuk memasang event handler yang direkomendasikan?',
    options: ['onclick=""', 'addEventListener()', 'attachClick()', 'listen()'], correct: 1 }
];

const TIME_PER_QUESTION = 15;   // detik
const STORAGE_KEY = 'quizHighScore';

// ===== State =====
let questions = [];
let currentQuestion = 0;
let score = 0;
let answered = false;
let timerId = null;
let timeLeft = TIME_PER_QUESTION;

// ===== DOM elements =====
const quizContentEl = document.querySelector('#quizContent');
const questionEl = document.querySelector('#question');
const optionsEl = document.querySelector('#options');
const nextBtn = document.querySelector('#nextBtn');
const progressEl = document.querySelector('#progress');
const progressBarEl = document.querySelector('#progressBar');
const timerEl = document.querySelector('#timer');
const feedbackEl = document.querySelector('#feedback');
const resultEl = document.querySelector('#result');
const themeBtn = document.querySelector('#themeBtn');

// Acak urutan soal (Fisher-Yates)
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ===== Timer =====
function stopTimer() {
  clearInterval(timerId);
}

function startTimer() {
  stopTimer();
  timeLeft = TIME_PER_QUESTION;
  timerEl.textContent = `⏱ ${timeLeft}`;
  timerId = setInterval(() => {
    timeLeft--;
    timerEl.textContent = `⏱ ${timeLeft}`;
    if (timeLeft <= 0) handleTimeout();
  }, 1000);
}

function handleTimeout() {
  stopTimer();
  if (answered) return;
  answered = true;
  revealCorrect();
  setFeedback('Waktu habis!');
  showNext();
}

// ===== Render =====
function renderQuestion() {
  const q = questions[currentQuestion];
  answered = false;

  progressEl.textContent = `Soal ${currentQuestion + 1}/${questions.length}`;
  progressBarEl.style.width = `${(currentQuestion / questions.length) * 100}%`;
  questionEl.textContent = q.question;
  setFeedback('');

  // Bersihkan lalu render pilihan (tanpa innerHTML)
  optionsEl.replaceChildren();
  q.options.forEach((option, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = option;
    btn.classList.add('option-btn');
    btn.dataset.index = index;
    optionsEl.append(btn);
  });

  nextBtn.classList.add('hidden');
  startTimer();
}

function setFeedback(text) {
  feedbackEl.textContent = text;
}

function revealCorrect() {
  const correctIndex = questions[currentQuestion].correct;
  optionsEl.querySelectorAll('.option-btn').forEach((btn) => {
    btn.disabled = true;
    if (Number(btn.dataset.index) === correctIndex) btn.classList.add('correct');
  });
}

function showNext() {
  const isLast = currentQuestion === questions.length - 1;
  nextBtn.textContent = isLast ? 'Lihat hasil' : 'Lanjut';
  nextBtn.classList.remove('hidden');
}

// ===== Event delegation: satu listener untuk semua pilihan jawaban =====
optionsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.option-btn');
  if (!btn || answered) return;

  answered = true;
  stopTimer();

  const selectedIndex = Number(btn.dataset.index);
  const correctIndex = questions[currentQuestion].correct;

  if (selectedIndex === correctIndex) {
    score++;
    setFeedback('Benar! ✅');
  } else {
    btn.classList.add('wrong');
    setFeedback('Kurang tepat ❌');
  }
  revealCorrect();
  showNext();
});

nextBtn.addEventListener('click', () => {
  currentQuestion++;
  if (currentQuestion < questions.length) {
    renderQuestion();
  } else {
    showResult();
  }
});

// ===== Hasil & High Score (LocalStorage) =====
function getHighScore() {
  try {
    return parseInt(localStorage.getItem(STORAGE_KEY), 10) || 0;
  } catch {
    return 0;
  }
}

function saveHighScore(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Storage tidak tersedia: abaikan, kuis tetap berjalan
  }
}

function showResult() {
  stopTimer();
  progressBarEl.style.width = '100%';

  const total = questions.length;
  const percentage = Math.round((score / total) * 100);
  document.querySelector('#score').textContent = `${score}/${total} (${percentage}%)`;

  const highScoreEl = document.querySelector('#highScore');
  const saved = getHighScore();
  if (percentage > saved) {
    saveHighScore(percentage);
    highScoreEl.textContent = `${percentage}% 🎉 Rekor baru!`;
  } else {
    highScoreEl.textContent = `${saved}%`;
  }

  quizContentEl.classList.add('hidden');
  resultEl.classList.remove('hidden');
}

// ===== Restart =====
function startQuiz() {
  questions = shuffle(quizData);
  currentQuestion = 0;
  score = 0;
  resultEl.classList.add('hidden');
  quizContentEl.classList.remove('hidden');
  renderQuestion();
}

document.querySelector('#restartBtn').addEventListener('click', startQuiz);

// ===== Dark mode (bonus) =====
themeBtn.addEventListener('click', () => {
  const dark = document.body.classList.toggle('dark');
  themeBtn.textContent = dark ? '☀️ Mode terang' : '🌙 Mode gelap';
});

// Inisialisasi
startQuiz();
