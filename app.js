// quiz-site/app.js v2

/* =====================================================
   状態管理
   ===================================================== */
const state = {
  mode: null,           // 'list' | 'sequential'
  answers: {},          // { questionId: choiceId }
  seqOrder: 'asc',      // 'asc' | 'random'
  seqQuestions: [],     // 通しモードの出題順配列
  currentIndex: 0,      // 通しモードの現在インデックス
  selectedQId: null,    // 一覧モードで選択中の問題ID
};

const app = document.getElementById('app');

/* =====================================================
   ユーティリティ
   ===================================================== */
function isCorrect(qId) {
  const q = questions.find(q => q.id === qId);
  return q && state.answers[qId] === q.answer;
}

function getStats() {
  const answered = Object.keys(state.answers).length;
  const correct  = Object.keys(state.answers)
    .filter(id => isCorrect(parseInt(id, 10))).length;
  return { answered, correct, total: questions.length };
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* =====================================================
   進捗バー HTML
   ===================================================== */
function progressHtml(label) {
  const { answered, correct, total } = getStats();
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
  return `
    <div class="progress-section">
      <div class="container">
        <div class="progress-info">
          <span>${label}</span>
          <span class="progress-score">正解：${correct} 問</span>
        </div>
        <div class="progress-bar-outer">
          <div class="progress-bar-inner" style="width:${pct}%"></div>
        </div>
      </div>
    </div>`;
}

/* =====================================================
   問題カード HTML（一覧詳細・通し共通）
   ===================================================== */
function questionCardHtml(q) {
  const answered = state.answers[q.id] !== undefined;
  const userAns  = state.answers[q.id];
  const correct  = answered && isCorrect(q.id);

  let statusBadge = '';
  if (answered) {
    statusBadge = correct
      ? '<span class="question-status-badge correct">✓ 正解</span>'
      : '<span class="question-status-badge incorrect">✗ 不正解</span>';
  }

  const choicesHtml = q.choices.map(c => {
    let cls = 'choice-btn';
    if (answered) {
      if (c.id === q.answer)     cls += ' correct-choice';
      else if (c.id === userAns) cls += ' incorrect-choice';
    }
    return `
      <li>
        <button class="${cls}"
          data-qid="${q.id}"
          data-cid="${c.id}"
          ${answered ? 'disabled' : ''}
          aria-label="選択肢${c.id}: ${escapeHtml(c.text)}">
          <span class="choice-label">${c.id}.</span>
          <span>${escapeHtml(c.text)}</span>
        </button>
      </li>`;
  }).join('');

  let feedbackHtml = '';
  if (answered) {
    const correctText = q.choices.find(c => c.id === q.answer).text;
    feedbackHtml = correct
      ? '<div class="feedback correct">✓ 正解です。</div>'
      : `<div class="feedback incorrect">✗ 不正解。正解：「${escapeHtml(correctText)}」</div>`;
  }

  return `
    <div class="question-card" id="q-${q.id}">
      <div class="question-header">
        <span class="question-num-badge">問題 ${q.id}</span>
        ${statusBadge}
      </div>
      <div class="question-body">
        <p class="question-text">${escapeHtml(q.text)}</p>
        <ul class="choices-list">
          ${choicesHtml}
        </ul>
        ${feedbackHtml}
      </div>
    </div>`;
}

/* =====================================================
   選択肢クリックハンドラ
   ===================================================== */
function handleChoiceClick(e) {
  const btn = e.currentTarget;
  const qId = parseInt(btn.dataset.qid, 10);
  const cId = btn.dataset.cid;
  if (state.answers[qId] !== undefined) return;
  state.answers[qId] = cId;

  if (state.mode === 'list') {
    renderListDetail(qId);
  } else {
    renderSequentialMode();
  }
}

function attachChoiceHandlers() {
  document.querySelectorAll('.choice-btn:not(:disabled)').forEach(btn => {
    btn.addEventListener('click', handleChoiceClick);
  });
}

/* =====================================================
   ホーム画面
   ===================================================== */
function renderHome() {
  state.mode        = null;
  state.answers     = {};
  state.currentIndex = 0;
  state.selectedQId = null;
  state.seqQuestions = [...questions];

  app.innerHTML = `
    <header class="site-header">
      <div class="header-inner">
        <div class="header-left">
          <span class="site-title">情報科学中間テスト用クイズ</span>
          <span class="header-subtitle">Practice Quiz</span>
        </div>
      </div>
    </header>
    <main>
      <div class="home-view">
        <div class="home-hero">
          <h1>過去問題</h1>
          <p>下記よりモードを選択して学習を開始してください</p>
          <span class="total-badge">全 ${questions.length} 問</span>
        </div>
        <div class="mode-grid">
          <div class="mode-card" id="btn-mode-list" role="button" tabindex="0"
               aria-label="一覧モードを開始">
            <span class="mode-icon">☰</span>
            <h2>一覧モード</h2>
            <p>問題一覧から好きな問題を<br>自由に選んで解くことができます。</p>
            <span class="mode-label">自由順序</span>
          </div>
          <div class="mode-card" id="btn-mode-seq" role="button" tabindex="0"
               aria-label="通しモードを開始">
            <span class="mode-icon">▶</span>
            <h2>通しモード</h2>
            <p>問題を1問ずつ順番に解きます。<br>全問終了後に結果を確認できます。</p>
            <span class="mode-label">昇順 / ランダム選択可</span>
          </div>
        </div>
      </div>
    </main>`;

  document.getElementById('btn-mode-list').addEventListener('click', () => {
    state.mode = 'list';
    renderListIndex();
  });
  document.getElementById('btn-mode-seq').addEventListener('click', () => {
    state.mode = 'sequential';
    renderSeqSettings();
  });
  ['btn-mode-list', 'btn-mode-seq'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click();
    });
  });
}

/* =====================================================
   通しモード — 設定画面
   ===================================================== */
function renderSeqSettings() {
  let isRandom = state.seqOrder === 'random';

  function buildSettings() {
    app.innerHTML = `
      <header class="site-header">
        <div class="header-inner">
          <div class="header-left">
            <span class="site-title">テスト勉強クイズ — 通しモード</span>
            <span class="header-subtitle">出題設定</span>
          </div>
          <button class="btn-back" id="btn-home">← トップへ</button>
        </div>
      </header>
      <main>
        <div class="settings-view">
          <div class="settings-card">
            <h2>出題設定</h2>

            <div class="setting-row">
              <span class="setting-label">出題順序</span>
              <div class="order-toggle-group">
                <span class="order-option ${!isRandom ? 'order-active' : ''}" id="lbl-asc">昇順</span>
                <button class="toggle-switch ${isRandom ? 'active' : ''}"
                        id="order-toggle"
                        role="switch"
                        aria-checked="${isRandom}"
                        aria-label="ランダム順切替">
                  <span class="toggle-knob"></span>
                </button>
                <span class="order-option ${isRandom ? 'order-active' : ''}" id="lbl-rnd">ランダム</span>
              </div>
            </div>

            <p class="setting-note" id="order-note">
              ${isRandom
                ? '問題をランダムな順序で出題します。'
                : '問題を番号の昇順で出題します（1, 2, 3…25）。'}
            </p>

            <button class="btn btn-gold setting-start-btn" id="btn-start">
              開始する
            </button>
          </div>
        </div>
      </main>`;

    document.getElementById('btn-home').addEventListener('click', renderHome);

    document.getElementById('order-toggle').addEventListener('click', () => {
      isRandom = !isRandom;
      buildSettings(); // 再描画でトグル状態を反映
    });

    document.getElementById('btn-start').addEventListener('click', () => {
      state.seqOrder     = isRandom ? 'random' : 'asc';
      state.seqQuestions = isRandom ? shuffle([...questions]) : [...questions];
      state.currentIndex = 0;
      state.answers      = {};
      renderSequentialMode();
    });
  }

  buildSettings();
}

/* =====================================================
   一覧モード — 問題インデックス
   ===================================================== */
function renderListIndex() {
  const { answered, correct, total } = getStats();

  const rows = questions.map(q => {
    const ans        = state.answers[q.id];
    const isAnswered = ans !== undefined;
    const isOk       = isAnswered && isCorrect(q.id);

    let rowExtra  = '';
    let statusHtml = '<span class="q-status unanswered">未回答</span>';
    if (isAnswered) {
      if (isOk) {
        rowExtra   = ' row-correct';
        statusHtml = '<span class="q-status correct">✓ 正解</span>';
      } else {
        rowExtra   = ' row-incorrect';
        statusHtml = '<span class="q-status incorrect">✗ 不正解</span>';
      }
    }

    const preview = q.text.replace(/\n/g, ' ');
    const trunc   = preview.length > 50 ? preview.substring(0, 50) + '…' : preview;

    return `
      <div class="q-index-row${rowExtra}" role="button" tabindex="0"
           data-qid="${q.id}" aria-label="問題${q.id}を開く">
        <span class="q-num">問&nbsp;${q.id}</span>
        <span class="q-preview">${escapeHtml(trunc)}</span>
        ${statusHtml}
        <span class="q-arrow" aria-hidden="true">›</span>
      </div>`;
  }).join('');

  app.innerHTML = `
    <header class="site-header">
      <div class="header-inner">
        <div class="header-left">
          <span class="site-title">テスト勉強クイズ — 一覧モード</span>
          <span class="header-subtitle">問題を選んでください</span>
        </div>
        <button class="btn-back" id="btn-home">← トップへ</button>
      </div>
    </header>

    ${progressHtml(`回答済み：${answered} / ${total}`)}

    <main>
      <div class="list-index-view">
        <div class="container">
          <div class="q-index-list">
            ${rows}
          </div>
        </div>
      </div>
    </main>`;

  document.getElementById('btn-home').addEventListener('click', renderHome);

  document.querySelectorAll('.q-index-row').forEach(row => {
    const open = () => {
      const qId = parseInt(row.dataset.qid, 10);
      state.selectedQId = qId;
      renderListDetail(qId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    row.addEventListener('click', open);
    row.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') open();
    });
  });
}

/* =====================================================
   一覧モード — 問題詳細
   ===================================================== */
function renderListDetail(qId) {
  const q   = questions.find(q => q.id === qId);
  const idx = questions.findIndex(q => q.id === qId);
  const prevQ = idx > 0               ? questions[idx - 1] : null;
  const nextQ = idx < questions.length - 1 ? questions[idx + 1] : null;
  const { answered, total } = getStats();

  app.innerHTML = `
    <header class="site-header">
      <div class="header-inner">
        <div class="header-left">
          <span class="site-title">テスト勉強クイズ — 一覧モード</span>
          <span class="header-subtitle">問題 ${qId}</span>
        </div>
        <button class="btn-back" id="btn-to-index">← 一覧へ</button>
      </div>
    </header>

    ${progressHtml(`回答済み：${answered} / ${total}`)}

    <main>
      <div class="list-detail-view">
        <div class="container">
          ${questionCardHtml(q)}
          <div class="detail-nav">
            <button class="btn btn-outline detail-nav-side" id="btn-prev-q"
              ${prevQ ? '' : 'disabled'}>
              ← 問題 ${prevQ ? prevQ.id : ''}
            </button>
            <button class="btn btn-navy detail-nav-center" id="btn-to-index2">
              一覧に戻る
            </button>
            <button class="btn btn-outline detail-nav-side" id="btn-next-q"
              ${nextQ ? '' : 'disabled'}>
              問題 ${nextQ ? nextQ.id : ''} →
            </button>
          </div>
        </div>
      </div>
    </main>`;

  const goIndex = () => { renderListIndex(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  document.getElementById('btn-to-index').addEventListener('click', goIndex);
  document.getElementById('btn-to-index2').addEventListener('click', goIndex);

  if (prevQ) {
    document.getElementById('btn-prev-q').addEventListener('click', () => {
      renderListDetail(prevQ.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  if (nextQ) {
    document.getElementById('btn-next-q').addEventListener('click', () => {
      renderListDetail(nextQ.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  attachChoiceHandlers();
}

/* =====================================================
   通しモード — 問題画面
   ===================================================== */
function renderSequentialMode() {
  const q          = state.seqQuestions[state.currentIndex];
  const total      = state.seqQuestions.length;
  const { correct } = getStats();
  const isAnswered = state.answers[q.id] !== undefined;
  const isFirst    = state.currentIndex === 0;
  const isLast     = state.currentIndex === total - 1;
  const progress   = Math.round(((state.currentIndex + (isAnswered ? 1 : 0)) / total) * 100);
  const orderBadge = state.seqOrder === 'random'
    ? '<span class="seq-order-badge">ランダム</span>'
    : '<span class="seq-order-badge">昇順</span>';

  app.innerHTML = `
    <header class="site-header">
      <div class="header-inner">
        <div class="header-left">
          <span class="site-title">テスト勉強クイズ — 通しモード</span>
          <span class="header-subtitle">${state.currentIndex + 1} / ${total} 問目 ${orderBadge}</span>
        </div>
        <button class="btn-back" id="btn-home">← トップへ</button>
      </div>
    </header>

    <div class="progress-section">
      <div class="container">
        <div class="progress-info">
          <span>問題 ${state.currentIndex + 1} / ${total}</span>
          <span class="progress-score">正解：${correct} 問</span>
        </div>
        <div class="progress-bar-outer">
          <div class="progress-bar-inner" style="width:${progress}%"></div>
        </div>
      </div>
    </div>

    <main>
      <div class="sequential-view">
        <div class="sequential-wrapper">
          ${questionCardHtml(q)}
          <div class="sequential-nav">
            <button class="btn btn-navy seq-nav-side" id="btn-prev"
              ${isFirst ? 'disabled' : ''}>← 前の問題</button>
            <span class="nav-hint">
              ${isAnswered ? '' : '選択肢を選択してください'}
            </span>
            <button class="btn btn-${isLast && isAnswered ? 'gold' : 'navy'} seq-nav-side"
              id="btn-next" ${isAnswered ? '' : 'disabled'}>
              ${isLast ? '結果を見る →' : '次の問題 →'}
            </button>
          </div>
        </div>
      </div>
    </main>`;

  document.getElementById('btn-home').addEventListener('click', renderHome);
  attachChoiceHandlers();

  document.getElementById('btn-prev').addEventListener('click', () => {
    if (state.currentIndex > 0) {
      state.currentIndex--;
      renderSequentialMode();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
  document.getElementById('btn-next').addEventListener('click', () => {
    if (!isAnswered) return;
    if (isLast) {
      renderResults();
    } else {
      state.currentIndex++;
      renderSequentialMode();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
}

/* =====================================================
   結果画面
   ===================================================== */
function renderResults() {
  const { answered, correct, total } = getStats();
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  let gradeLabel, gradeClass;
  if (pct >= 90)      { gradeLabel = '優秀';   gradeClass = 'excellent'; }
  else if (pct >= 70) { gradeLabel = '合格';   gradeClass = 'good'; }
  else if (pct >= 50) { gradeLabel = '要復習'; gradeClass = 'review'; }
  else                { gradeLabel = '再挑戦'; gradeClass = 'retry'; }

  const qList = state.mode === 'sequential' ? state.seqQuestions : questions;

  const rows = qList.map(q => {
    const ans     = state.answers[q.id];
    const isDone  = ans !== undefined;
    const isOk    = isDone && isCorrect(q.id);
    const mark    = !isDone ? '—' : isOk ? '✓ 正解' : '✗ 不正解';
    const markCls = !isDone ? 'unanswered' : isOk ? 'correct' : 'incorrect';
    const preview = q.text.replace(/\n/g, ' ');
    const trunc   = preview.length > 38 ? preview.substring(0, 38) + '…' : preview;
    return `
      <tr>
        <td style="white-space:nowrap">問題&nbsp;${q.id}</td>
        <td>${escapeHtml(trunc)}</td>
        <td><span class="result-mark ${markCls}">${mark}</span></td>
      </tr>`;
  }).join('');

  app.innerHTML = `
    <header class="site-header">
      <div class="header-inner">
        <div class="header-left">
          <span class="site-title">テスト勉強クイズ — 結果</span>
          <span class="header-subtitle">全 ${total} 問</span>
        </div>
      </div>
    </header>
    <main>
      <div class="results-view">
        <div class="results-card">
          <h2>テスト結果</h2>
          <div class="score-block">
            <div>
              <span class="score-fraction">${correct}</span>
              <span class="score-denom"> / ${total}</span>
            </div>
            <span class="score-pct">${pct}%</span>
            <span class="score-grade ${gradeClass}">${gradeLabel}</span>
          </div>
          <table class="breakdown-table" aria-label="問題別結果">
            <thead>
              <tr><th>番号</th><th>問題（抜粋）</th><th>結果</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="btn-group">
            <button class="btn btn-navy" id="btn-retry">もう一度挑戦</button>
            <button class="btn btn-outline" id="btn-home-result">トップへ戻る</button>
          </div>
        </div>
      </div>
    </main>`;

  document.getElementById('btn-retry').addEventListener('click', () => {
    state.answers      = {};
    state.currentIndex = 0;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (state.mode === 'sequential') {
      renderSeqSettings();
    } else {
      renderListIndex();
    }
  });
  document.getElementById('btn-home-result').addEventListener('click', renderHome);
}

/* =====================================================
   初期化
   ===================================================== */
renderHome();
