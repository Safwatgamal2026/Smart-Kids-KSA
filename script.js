// ====== Helpers ======
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const state = {
  soundOn: true,
  stars: 0,
  streak: 0,
  goalTarget: 5,
  letterIndex: 0,
  currentOp: "+",
  math: { n1: 2, n2: 3, ans: 5 },
  quiz: { kind: "letter", value: "B" }
};

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const numbers = Array.from({ length: 21 }, (_, i) => i); // 0..20

function toast(msg){
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(()=> el.classList.remove("show"), 1600);
}

function updateStats(){
  $("#starsCount").textContent = state.stars;
  $("#streakCount").textContent = state.streak;

  const now = Math.min(state.stars, state.goalTarget);
  $("#goalNow").textContent = now;
  $("#goalFill").style.width = `${(now/state.goalTarget)*100}%`;
}

// ====== Speech (no external audio files) ======
function speak(text, lang = "en-US"){
  if(!state.soundOn) return;

  // Web Speech API: works in most modern browsers.
  if(!("speechSynthesis" in window)){
    toast("المتصفح لا يدعم الصوت هنا.");
    return;
  }
  window.speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 0.95;
  u.pitch = 1.1;
  window.speechSynthesis.speak(u);
}

// ====== Nav (mobile) ======
(function initNav(){
  const toggle = $("#navToggle");
  const menu = $("#navMenu");
  toggle.addEventListener("click", () => {
    const open = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  // close menu on link click (mobile)
  $$("#navMenu a").forEach(a => a.addEventListener("click", ()=>{
    menu.classList.remove("open");
    toggle.setAttribute("aria-expanded","false");
  }));

  // sound toggle
  $("#soundBtn").addEventListener("click", ()=>{
    state.soundOn = !state.soundOn;
    $("#soundState").textContent = state.soundOn ? "مفعل" : "متوقف";
    toast(state.soundOn ? "تم تفعيل الصوت 🔊" : "تم إيقاف الصوت 🔇");
  });

  $("#year").textContent = new Date().getFullYear();
})();

// ====== Letters ======
function renderLettersGrid(){
  const grid = $("#lettersGrid");
  grid.innerHTML = "";

  letters.forEach((L, idx)=>{
    const b = document.createElement("button");
    b.className = "tile";
    b.type = "button";
    b.innerHTML = `<div class="t">${L}</div><div class="s">اضغط للنطق</div>`;
    b.addEventListener("click", ()=>{
      state.letterIndex = idx;
      setCurrentLetter();
      speak(L, "en-US");
    });
    grid.appendChild(b);
  });
}

function setCurrentLetter(){
  const L = letters[state.letterIndex];
  $("#currentLetter").textContent = L;
  $("#letterHint").textContent = `الحرف الحالي: ${L} — اضغط للاستماع ثم اختبر نفسك ⭐`;
}

function nextLetter(dir=1){
  state.letterIndex = (state.letterIndex + dir + letters.length) % letters.length;
  setCurrentLetter();
}

(function initLetters(){
  renderLettersGrid();
  setCurrentLetter();

  $("#lettersNext").addEventListener("click", ()=> nextLetter(-1));
  $("#lettersPrev").addEventListener("click", ()=> nextLetter(+1));

  $("#speakLetter").addEventListener("click", ()=>{
    const L = letters[state.letterIndex];
    speak(L, "en-US");
  });

  $("#letterMiniQuiz").addEventListener("click", ()=>{
    const L = letters[state.letterIndex];
    // simple prompt: choose the letter among 3
    const choices = new Set([L]);
    while(choices.size < 3){
      choices.add(letters[Math.floor(Math.random()*letters.length)]);
    }
    const arr = Array.from(choices).sort(()=> Math.random()-0.5);
    const pick = prompt(`اختر الحرف الصحيح: ${arr.join(" , ")}\n(اكتب حرف واحد فقط)`);
    if(!pick) return;

    if(pick.trim().toUpperCase() === L){
      reward("رائع! إجابة صحيحة ⭐");
    }else{
      fail(`قريب! الصحيح هو: ${L}`);
      speak(L, "en-US");
    }
  });
})();

// ====== Numbers ======
function renderNumbersGrid(){
  const grid = $("#numbersGrid");
  grid.innerHTML = "";
  numbers.forEach((n)=>{
    const b = document.createElement("button");
    b.className = "tile";
    b.type = "button";
    b.innerHTML = `<div class="t">${n}</div><div class="s">اضغط للنطق</div>`;
    b.addEventListener("click", ()=>{
      $("#countValue").textContent = n;
      speak(String(n), "en-US");
    });
    grid.appendChild(b);
  });
}

(function initNumbers(){
  renderNumbersGrid();

  $("#countPlus").addEventListener("click", ()=>{
    let v = Number($("#countValue").textContent);
    v = Math.min(99, v + 1);
    $("#countValue").textContent = v;
    toast("أحسنت! +1");
  });
  $("#countMinus").addEventListener("click", ()=>{
    let v = Number($("#countValue").textContent);
    v = Math.max(0, v - 1);
    $("#countValue").textContent = v;
    toast("ممتاز! -1");
  });
  $("#speakCount").addEventListener("click", ()=>{
    speak($("#countValue").textContent, "en-US");
  });
})();

// ====== Math ======
function newMathQuestion(){
  const max = 9;
  let a = 1 + Math.floor(Math.random()*max);
  let b = 1 + Math.floor(Math.random()*max);

  if(state.currentOp === "-"){
    // ensure non-negative
    if(b > a) [a,b] = [b,a];
  }

  state.math.n1 = a;
  state.math.n2 = b;
  state.math.ans = state.currentOp === "+" ? (a+b) : (a-b);

  $("#n1").textContent = a;
  $("#n2").textContent = b;
  $("#opSym").textContent = state.currentOp;
  $("#answer").value = "";
  $("#mathResult").textContent = "اكتب الإجابة ثم اضغط تحقق ✅";
}

function reward(msg){
  state.stars += 1;
  state.streak += 1;
  updateStats();
  toast(msg);
}

function fail(msg){
  state.streak = 0;
  updateStats();
  toast(msg);
}

(function initMath(){
  // segmented buttons
  $$(".segmented .seg").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      $$(".segmented .seg").forEach(b => b.classList.remove("on"));
      btn.classList.add("on");
      state.currentOp = btn.dataset.op;
      newMathQuestion();
    });
  });

  $("#newQuestion").addEventListener("click", newMathQuestion);

  $("#checkAnswer").addEventListener("click", ()=>{
    const v = $("#answer").value.trim();
    if(v === ""){
      $("#mathResult").textContent = "اكتب الإجابة أولاً ✍️";
      return;
    }
    const num = Number(v);
    if(Number.isNaN(num)){
      $("#mathResult").textContent = "اكتب رقم صحيح فقط.";
      return;
    }

    if(num === state.math.ans){
      $("#mathResult").textContent = `ممتاز! الإجابة صحيحة ✅ (${state.math.ans})`;
      reward("نجمة جديدة ⭐");
      speak("Correct", "en-US");
      newMathQuestion();
    }else{
      $("#mathResult").textContent = `محاولة جميلة! الإجابة الصحيحة هي: ${state.math.ans}`;
      fail("لا بأس.. جرّب مرة أخرى 💪");
      speak(String(state.math.ans), "en-US");
    }
  });

  $("#speakQuestion").addEventListener("click", ()=>{
    const q = `${state.math.n1} ${state.currentOp === "+" ? "plus" : "minus"} ${state.math.n2}`;
    speak(q, "en-US");
  });

  newMathQuestion();
  updateStats();
})();

// ====== Quiz ======
function buildQuiz(){
  const isLetter = Math.random() > 0.45;
  const questionEl = $("#quizQuestion");
  const choicesEl = $("#quizChoices");
  const resultEl = $("#quizResult");
  resultEl.textContent = "";

  choicesEl.innerHTML = "";

  if(isLetter){
    const L = letters[Math.floor(Math.random()*letters.length)];
    state.quiz = { kind:"letter", value: L };

    questionEl.innerHTML = `ما هو نطق هذا الحرف؟ <span class="quiz-big">${L}</span>`;
    // Provide choices as letters (visual) – child clicks correct letter name (same letter)
    const opts = new Set([L]);
    while(opts.size < 4) opts.add(letters[Math.floor(Math.random()*letters.length)]);
    const arr = Array.from(opts).sort(()=>Math.random()-0.5);

    arr.forEach(opt=>{
      const c = document.createElement("button");
      c.className = "choice";
      c.type = "button";
      c.textContent = opt;
      c.addEventListener("click", ()=>{
        if(opt === L){
          resultEl.textContent = "صحيح! ⭐";
          reward("أبطال! ⭐");
          speak(L, "en-US");
        }else{
          resultEl.textContent = `غير صحيح. الصحيح هو: ${L}`;
          fail("جرّب مرة ثانية 😉");
          speak(L, "en-US");
        }
      });
      choicesEl.appendChild(c);
    });

  }else{
    const a = 1 + Math.floor(Math.random()*9);
    const b = 1 + Math.floor(Math.random()*9);
    const op = Math.random() > 0.5 ? "+" : "-";
    const n1 = op === "-" && b > a ? b : a;
    const n2 = op === "-" && b > a ? a : b;
    const ans = op === "+" ? (n1+n2) : (n1-n2);

    state.quiz = { kind:"math", value: {n1,n2,op,ans} };
    questionEl.innerHTML = `ما ناتج العملية؟ <span class="quiz-big">${n1} ${op} ${n2}</span>`;

    const opts = new Set([ans]);
    while(opts.size < 4){
      const r = ans + Math.floor(Math.random()*7) - 3;
      if(r >= 0) opts.add(r);
    }
    const arr = Array.from(opts).sort(()=>Math.random()-0.5);

    arr.forEach(opt=>{
      const c = document.createElement("button");
      c.className = "choice";
      c.type = "button";
      c.textContent = opt;
      c.addEventListener("click", ()=>{
        if(opt === ans){
          $("#quizResult").textContent = "صحيح! ⭐";
          reward("نجمة ⭐");
          speak("Correct", "en-US");
        }else{
          $("#quizResult").textContent = `غير صحيح. الصحيح هو: ${ans}`;
          fail("حاول مجددًا 💪");
          speak(String(ans), "en-US");
        }
      });
      choicesEl.appendChild(c);
    });
  }
}

(function initQuiz(){
  buildQuiz();

  $("#quizNext").addEventListener("click", buildQuiz);
  $("#quizSpeak").addEventListener("click", ()=>{
    if(state.quiz.kind === "letter"){
      speak(state.quiz.value, "en-US");
    }else{
      const {n1,n2,op} = state.quiz.value;
      const q = `${n1} ${op === "+" ? "plus" : "minus"} ${n2}`;
      speak(q, "en-US");
    }
  });
})();
