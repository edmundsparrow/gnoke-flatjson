(function () {
  'use strict';

  // ─────────────────────────────
  // STATE
  // ─────────────────────────────
  let lastResult = null;
  let lastFilename = 'flatjson-output';

  // ─────────────────────────────
  // HELPERS
  // ─────────────────────────────
  function getResult() {
    try {
      return window.__FLATJSON_RESULT__ || null;
    } catch (e) {
      return null;
    }
  }

  function setResult(res) {
    window.__FLATJSON_RESULT__ = res;
    lastResult = res;
  }

  function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 100);
  }

  // ─────────────────────────────
  // CSV EXPORT
  // ─────────────────────────────
  function toCSV(result) {
    const rows = [
      result.headers.join(',')
    ];

    result.rows.forEach(r => {
      rows.push(r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    });

    return rows.join('\n');
  }

  // ─────────────────────────────
  // FILE INPUT (shared, hidden)
  // ─────────────────────────────
  function createFileInput() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json,application/json';
    fileInput.style.display = 'none';

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      lastFilename = file.name.replace(/\.[^.]+$/, '');

      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target.result);
          document.getElementById('input').value = ev.target.result;
          const result = window.flatJson(parsed);
          setResult(result);
          document.getElementById('output').value = JSON.stringify(result, null, 2);
          window.renderTable?.(result);
        } catch (err) {
          window.showError?.('File error: ' + err.message);
        }
      };
      reader.readAsText(file);
    });

    document.body.appendChild(fileInput);
    return fileInput;
  }

  // ─────────────────────────────
  // UI INJECTION — OPEN BUTTON
  // Placed in preset row, always visible before Run is clicked.
  // ─────────────────────────────
  function injectOpenButton(fileInput) {
    const presetRow = document.querySelector('.preset-row');
    if (!presetRow || document.getElementById('btn-open')) return;

    const openBtn = document.createElement('button');
    openBtn.id = 'btn-open';
    openBtn.textContent = '📁 Open file';
    openBtn.className = 'preset-btn';
    openBtn.style.background = '#fffbea';
    openBtn.style.borderColor = '#f0d060';
    openBtn.style.color = '#92600a';

    openBtn.onclick = () => fileInput.click();
    presetRow.appendChild(openBtn);
  }

  // ─────────────────────────────
  // UI INJECTION — EXPORT BUTTONS
  // Placed in result-meta, only visible after a result exists.
  // ─────────────────────────────
  function injectExportButtons() {
    const meta = document.querySelector('.result-meta');
    if (!meta || document.getElementById('btn-group')) return;

    const group = document.createElement('div');
    group.id = 'btn-group';
    group.style.display = 'flex';
    group.style.gap = '8px';
    group.style.marginLeft = 'auto';
    group.style.flexWrap = 'wrap';

    // ── CSV EXPORT
    const csvBtn = document.createElement('button');
    csvBtn.textContent = '↓ CSV';
    csvBtn.style.background = '#1a7a4a';
    csvBtn.style.color = '#fff';
    csvBtn.style.border = 'none';
    csvBtn.style.padding = '4px 10px';
    csvBtn.style.borderRadius = '20px';
    csvBtn.style.cursor = 'pointer';

    csvBtn.onclick = () => {
      const result = getResult();
      if (!result) return;
      downloadFile(`${lastFilename}.csv`, toCSV(result), 'text/csv');
    };

    // ── JSON EXPORT
    const jsonBtn = document.createElement('button');
    jsonBtn.textContent = '↓ JSON';
    jsonBtn.style.background = '#2563eb';
    jsonBtn.style.color = '#fff';
    jsonBtn.style.border = 'none';
    jsonBtn.style.padding = '4px 10px';
    jsonBtn.style.borderRadius = '20px';
    jsonBtn.style.cursor = 'pointer';

    jsonBtn.onclick = () => {
      const result = getResult();
      if (!result) return;
      downloadFile(`${lastFilename}.json`, JSON.stringify(result, null, 2), 'application/json');
    };

    group.appendChild(csvBtn);
    group.appendChild(jsonBtn);
    meta.appendChild(group);
  }

  function injectButtons() {
    const fileInput = createFileInput();
    injectOpenButton(fileInput);
    injectExportButtons();
  }

  // ─────────────────────────────
  // CAPTURE RESULT HOOK
  // ─────────────────────────────
  function hookFlatJson() {
    const original = window.flatJson;

    if (!original) return;

    window.flatJson = function (data, opts) {
      const res = original(data, opts);
      setResult(res);
      return res;
    };
  }

  // ─────────────────────────────
  // INIT
  // ─────────────────────────────
  function init() {
    hookFlatJson();
    injectButtons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();