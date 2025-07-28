fetch(typeof csvFile !== 'undefined' ? csvFile : 'data/01/quiz1.csv')
  .then(res => res.text())
  .then(csv => {
    const rows = csv.trim().split('\n');
    const headers = rows[0].split(',').map(h => h.replace(/^\uFEFF/, '').trim());
    const data = rows.slice(1).map(row => {
      // CSV에서 ,로만 split하면 빈칸이 있을 때 문제가 생길 수 있으니, 필드 수 맞추기
      const values = row.split(',');
      while (values.length < headers.length) values.push('');
      return Object.fromEntries(headers.map((h, i) => [h, (values[i] || '').trim()]));
    });
    renderQuiz(data);
  });

// 쿠키 저장/불러오기 함수 추가
function setCookie(name, value, days) {
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days*24*60*60*1000));
    expires = '; expires=' + date.toUTCString();
  }
  document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/';
}
function getCookie(name) {
  const v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
  return v ? decodeURIComponent(v[2]) : null;
}
function deleteCookie(name) {
  document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}

function saveAnswer(id, value) {
  let current = {};
  try {
    current = JSON.parse(getCookie('quiz-progress') || '{}');
  } catch(e) {}
  current[id] = value;
  setCookie('quiz-progress', JSON.stringify(current), 0.5); // 12시간 만료
}

function getSavedAnswer(id) {
  let current = {};
  try {
    current = JSON.parse(getCookie('quiz-progress') || '{}');
  } catch(e) {}
  return current[id];
}

function renderQuiz(data) {
  const container = document.getElementById('quiz-container');
  data.forEach((item, idx) => {
    const qBox = document.createElement('div');
    const qId = `q${item.id}`;
    qBox.className = 'quiz-box';
    qBox.innerHTML = `<p><strong>Q${idx + 1}.</strong></p>`;

    if (item.question_text) {
      qBox.innerHTML += `<p>${item.question_text}</p>`;
    }
    if (item.question_img) {
      qBox.innerHTML += `<img class="quiz-question-img" src="${item.question_img}" alt="문제 이미지">`;
    }

    // feedback-row 컨테이너 생성
    const feedbackRow = document.createElement('div');
    feedbackRow.className = 'feedback-row';
    const feedback = document.createElement('div');
    feedback.className = 'feedback';

    if (item.type === 'single' || item.type === 'singleimg') {
      for (let i = 1; i <= 5; i++) {
        const t = item[`choice${i}_text`];
        const img = item[`choice${i}_img`];
        if (!t && !img) continue;
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        let btnValue = '';
        if (img && t) {
          btn.innerHTML = `<img class="quiz-img" src="${img}" alt="" style="vertical-align:middle;max-width:80px;max-height:80px;"> <span>${t}</span>`;
          btnValue = img + '|' + t;
        } else if (img) {
          btn.innerHTML = `<img class="quiz-img" src="${img}" alt="" style="vertical-align:middle;max-width:80px;max-height:80px;">`;
          btnValue = img;
        } else {
          btn.textContent = t;
          btnValue = t;
        }
        btn.onclick = () => {
          saveAnswer(qId, btnValue);
          document.querySelectorAll(`[data-q='${qId}']`).forEach(el => el.classList.remove('selected'));
          btn.classList.add('selected');
          let isCorrect = false;
          if (item.answer && item.answer.includes('|')) {
            isCorrect = btnValue === item.answer;
          } else if (item.answer && item.answer.endsWith('.png')) {
            isCorrect = img === item.answer;
          } else {
            isCorrect = t === item.answer;
          }
          feedback.textContent = isCorrect ? "정답! ✅" : "오답입니다 ❌";
          feedback.classList.remove('right', 'wrong', 'partial');
          void feedback.offsetWidth;
          feedback.classList.add(isCorrect ? 'right' : 'wrong');
          feedback.style.color = '';
          // 해설버튼 생성 및 배치 (선택 후에만)
          feedbackRow.querySelectorAll('.explain-btn, .explanation').forEach(el => el.remove());
          const explainBtn = showExplanationBtn(item, feedbackRow, qBox);
          if (explainBtn) feedbackRow.appendChild(explainBtn);
        };
        btn.dataset.q = qId;
        if (getSavedAnswer(qId) === btnValue) btn.classList.add('selected');
        qBox.appendChild(btn);
      }
      // 최초 렌더링 시에는 feedback만 append (해설버튼 없음)
      feedbackRow.appendChild(feedback);
      qBox.appendChild(feedbackRow);
    } else if (item.type === 'multiple' || item.type === 'multipleimg') {
      for (let i = 1; i <= 5; i++) {
        const t = item[`choice${i}_text`];
        const img = item[`choice${i}_img`];
        if (!t && !img) continue;
        const checkbox = document.createElement('input');
        checkbox.type = "checkbox";
        checkbox.value = t || img;
        checkbox.name = qId;
        const label = document.createElement('label');
        if (img && t) {
          label.innerHTML = `<img class="quiz-img" src="${img}" alt="" style="vertical-align:middle;max-width:80px;max-height:80px;"> <span>${t}</span>`;
          label.prepend(checkbox);
        } else if (img) {
          label.innerHTML = `<img class="quiz-img" src="${img}" alt="" style="vertical-align:middle;max-width:80px;max-height:80px;">`;
          label.prepend(checkbox);
        } else {
          label.textContent = t;
          label.prepend(checkbox);
        }
        qBox.appendChild(label);
        const saved = getSavedAnswer(qId);
        if (saved && saved.split('|').includes(t || img)) checkbox.checked = true;
        checkbox.onchange = () => {
          const selected = [...document.querySelectorAll(`input[name='${qId}']:checked`)].map(el => el.value);
          saveAnswer(qId, selected.join('|'));
          const correct = item.answer.split('|').sort().join('|');
          const current = selected.sort().join('|');
          const isCorrect = (current === correct);
          // 부분 선택 안내 시작
          const answers = item.answer.split('|');
          // 한 개 이상, 하지만 아직 모두 고르지 않은 상태
          if (selected.length > 0 && selected.length < answers.length) {
            feedback.textContent = `모두 선택해주세요.`;
            feedback.classList.remove('right', 'wrong', 'partial');
            // CSS 애니메이션 리셋
            void feedback.offsetWidth;
            feedback.classList.add('partial');
            return; // 아래 정답/오답 판정은 건너뜀
          }
          feedback.textContent = isCorrect ? "정답! ✅" : "오답입니다 ❌";
          feedback.classList.remove('right', 'wrong', 'partial');
          void feedback.offsetWidth;
          feedback.classList.add(isCorrect ? 'right' : 'wrong');
          feedback.style.color = '';
          // 해설버튼 생성 및 배치 (선택 후에만)
          feedbackRow.querySelectorAll('.explain-btn, .explanation').forEach(el => el.remove());
          const explainBtn = showExplanationBtn(item, feedbackRow, qBox);
          if (explainBtn) feedbackRow.appendChild(explainBtn);
        }
      }
      feedbackRow.appendChild(feedback);
      qBox.appendChild(feedbackRow);
    } else if (item.type === 'matrix') {
      const table = document.createElement('table');
      const thead = document.createElement('thead');
      const colKeys = Object.keys(item).filter(k => k.startsWith('col') && item[k]);
      const rowKeys = Object.keys(item).filter(k => k.startsWith('row') && item[k]);
      thead.innerHTML = `<tr><th></th>${colKeys.map(k => `<th>${item[k]}</th>`).join('')}</tr>`;
      table.appendChild(thead);
      rowKeys.forEach((rk, rowIdx) => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${item[rk]}</td>`;
        colKeys.forEach((ck, colIdx) => {
          const input = document.createElement('input');
          input.type = "radio";
          input.name = `${qId}_${rk}`;
          input.value = item[ck];
          const td = document.createElement('td');
          td.appendChild(input);
          row.appendChild(td);
          const saved = getSavedAnswer(`${qId}_${rk}`);
          if (saved === item[ck]) input.checked = true;
          input.onchange = () => {
            saveAnswer(`${qId}_${rk}`, input.value);
            const allAnswered = rowKeys.every(rk2 => getSavedAnswer(`${qId}_${rk2}`));
            if (allAnswered) {
              const allCorrect = rowKeys.every(rk2 => getSavedAnswer(`${qId}_${rk2}`) === item[`answer_${rk2}`]);
              feedback.textContent = allCorrect ? "정답! ✅" : "오답입니다 ❌";
              feedback.classList.remove('right', 'wrong', 'partial');
              void feedback.offsetWidth;
              feedback.classList.add(allCorrect ? 'right' : 'wrong');
              feedback.style.color = '';
              // 해설버튼 생성 및 배치 (선택 후에만)
              feedbackRow.querySelectorAll('.explain-btn, .explanation').forEach(el => el.remove());
              const explainBtn = showExplanationBtn(item, feedbackRow, qBox);
              if (explainBtn) feedbackRow.appendChild(explainBtn);
            }
          };
        });
        table.appendChild(row);
      });
      qBox.appendChild(table);
      feedbackRow.appendChild(feedback);
      qBox.appendChild(feedbackRow);
    } else if (item.type === 'text') {
      const input = document.createElement('input');
      input.type = "text";
      input.value = getSavedAnswer(qId) || "";
      input.style.marginRight = '8px';
      const checkBtn = document.createElement('button');
      checkBtn.textContent = '정답확인';
      checkBtn.className = 'check-btn';
      checkBtn.onclick = () => {
        const trimmed = input.value.trim().replace(/\s+/g, '');
        saveAnswer(qId, input.value);
        if (trimmed) {
          const answers = item.answer.split('|').map(a => a.trim().replace(/\s+/g, ''));
          const isCorrect = answers.includes(trimmed);
          feedback.textContent = isCorrect ? "정답! ✅" : "오답입니다 ❌";
          feedback.classList.remove('right', 'wrong', 'partial');
          void feedback.offsetWidth;
          feedback.classList.add(isCorrect ? 'right' : 'wrong');
          feedback.style.color = '';
          // 해설버튼 생성 및 배치 (입력 후에만)
          feedbackRow.querySelectorAll('.explain-btn, .explanation').forEach(el => el.remove());
          const explainBtn = showExplanationBtn(item, feedbackRow, qBox);
          if (explainBtn) feedbackRow.appendChild(explainBtn);
        }
      };
      qBox.appendChild(input);
      qBox.appendChild(checkBtn);
      feedbackRow.appendChild(feedback);
      qBox.appendChild(feedbackRow);
    }
    container.appendChild(qBox);
  });
}

// 해설 버튼 생성 함수 (버튼만 반환)
function showExplanationBtn(item, feedbackRow, qBox) {
  if (item.explanation && item.explanation.trim()) {
    const btn = document.createElement('button');
    btn.textContent = '해설보기';
    btn.className = 'explain-btn';
    btn.onclick = () => {
      const existing = qBox.querySelector('.explanation');
      if (!existing) {
        // 해설 열기
        const exp = document.createElement('div');
        exp.className = 'explanation';
        exp.textContent = item.explanation;
        qBox.appendChild(exp);
        btn.textContent = '해설닫기';
        btn.classList.add('explain-btn--active');
      } else {
        // 해설 닫기
        existing.remove();
        btn.textContent = '해설보기';
        btn.classList.remove('explain-btn--active');
      }
    };
    return btn;
  }
  return null;
}
