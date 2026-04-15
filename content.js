const PANEL_HOST_ID = 'hust-sb-panel-host';

let ehustSubmitScheduled = false;
let ehustObserver = null;

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleInPlace(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function isHiddenBranch(el) {
    return !!(el && el.closest && el.closest('.ant-form-item-hidden'));
}

function isRequiredByAncestors(el) {
    let node = el;
    for (let depth = 0; depth < 24 && node; depth++) {
        if (node.getAttribute && node.getAttribute('aria-required') === 'true') {
            return true;
        }
        if (node.classList && node.classList.contains('ant-form-item-required')) {
            return true;
        }
        if (node === document.body) break;
        node = node.parentElement;
    }
    return false;
}

function isEHustGroupRequired(group) {
    if (!group || isHiddenBranch(group)) return false;
    if (group.getAttribute('aria-required') === 'true') return true;
    return isRequiredByAncestors(group);
}

function dispatchInputEvents(el) {
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
}

function setInputValue(el, value) {
    try {
        const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        const desc = Object.getOwnPropertyDescriptor(proto, 'value');
        if (desc && desc.set) {
            desc.set.call(el, value);
        } else {
            el.value = value;
        }
        dispatchInputEvents(el);
    } catch (e) {
        console.warn('HUST Survey Bypass: setInputValue failed', e);
    }
}

function clickAntControl(input) {
    if (!input || isHiddenBranch(input)) return;
    const label = input.closest('label');
    if (label && !isHiddenBranch(label)) {
        label.click();
        return;
    }
    const radioOrCb = input.closest('.ant-radio, .ant-checkbox');
    if (radioOrCb && !isHiddenBranch(radioOrCb)) {
        radioOrCb.click();
        return;
    }
    input.click();
}

function middleIndex(len) {
    if (len <= 0) return 0;
    return Math.floor((len - 1) / 2);
}

function runCttSisAutoFill(shouldAlert) {
    const labels = document.querySelectorAll('td.dxichTextCellSys label.dx-wrap');
    let count = 0;

    labels.forEach((label) => {
        const text = label.innerText.trim();
        if (text.startsWith('4.') || text.startsWith('4:')) {
            const labelTd = label.closest('td.dxichTextCellSys');
            if (labelTd) {
                const row = labelTd.parentElement;
                const radioTd = row.querySelector('td.dxichCellSys');
                if (radioTd) {
                    const radioButton = radioTd.querySelector('span.dxeIRadioButton_Mulberry');
                    if (radioButton) {
                        radioButton.click();
                        count++;
                    }
                }
            }
        }
    });

    console.log(`Đã chọn xong ${count} mục.`);

    const submitBtn = document.querySelector('div[id$="submitButton"]');
    const submitInput = document.querySelector('input[id$="submitButton_I"]');

    if (submitBtn || submitInput) {
        setTimeout(() => {
            if (submitInput) {
                submitInput.click();
            } else {
                submitBtn.click();
            }
            if (shouldAlert) {
                alert('Đã điền và bấm gửi xong!');
            }
        }, 500);
    } else if (shouldAlert) {
        alert('Đã điền xong nhưng không tìm thấy nút Gửi. Bạn hãy bấm tay nhé.');
    }
}

function fillEHustRadioGroups() {
    document.querySelectorAll('.response-radio-group').forEach((group) => {
        if (!isEHustGroupRequired(group)) return;
        if (group.querySelector('input[type="radio"]:checked')) return;
        const radios = Array.from(group.querySelectorAll('input[type="radio"]')).filter(
            (r) => !r.disabled && !isHiddenBranch(r)
        );
        if (radios.length === 0) return;
        const pick = radios[randomInt(0, radios.length - 1)];
        clickAntControl(pick);
    });
}

function fillEHustCheckboxGroups() {
    document.querySelectorAll('.response-checkbox-group').forEach((group) => {
        if (!isEHustGroupRequired(group)) return;
        const boxes = Array.from(group.querySelectorAll('input[type="checkbox"]')).filter(
            (c) => !c.disabled && !isHiddenBranch(c)
        );
        if (boxes.length === 0) return;
        if (boxes.some((c) => c.checked)) return;
        const n = boxes.length;
        const k = randomInt(1, n);
        const indices = shuffleInPlace(Array.from({ length: n }, (_, i) => i));
        for (let i = 0; i < k; i++) {
            const cb = boxes[indices[i]];
            if (!cb.checked) {
                clickAntControl(cb);
            }
        }
    });
}

function tableMatrixLooksLikeLikert(table) {
    const thead = table.querySelector('thead');
    if (!thead) return false;
    const firstRow = thead.querySelector('tr');
    if (!firstRow) return false;
    const ths = firstRow.querySelectorAll('th');
    return ths.length >= 3;
}

function isAntTableLikertMatrix(table) {
    if (!tableMatrixLooksLikeLikert(table)) return false;
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    if (!thead || !tbody) return false;
    const theadLooksAnt = thead.classList.contains('ant-table-thead') || thead.querySelector('.ant-table-cell');
    const tbodyLooksAnt = tbody.classList.contains('ant-table-tbody') || tbody.querySelector('.ant-table-row');
    if (!theadLooksAnt && !tbodyLooksAnt) return false;
    const firstRow = tbody.querySelector('tr');
    if (!firstRow) return false;
    const tds = firstRow.querySelectorAll('td');
    if (tds.length < 3) return false;
    let radioInOptionCells = 0;
    Array.from(tds)
        .slice(1)
        .forEach((td) => {
            if (td.querySelector('input[type="radio"]')) radioInOptionCells++;
        });
    return radioInOptionCells >= 2;
}

function shouldFillEHustMatrixTable(table) {
    if (isRequiredByAncestors(table)) return true;
    if (isAntTableLikertMatrix(table)) return true;
    return false;
}

function fillEHustMatrixTables() {
    document.querySelectorAll('table').forEach((table) => {
        if (isHiddenBranch(table)) return;
        if (!tableMatrixLooksLikeLikert(table)) return;
        if (!shouldFillEHustMatrixTable(table)) return;

        const tbody = table.querySelector('tbody');
        if (!tbody) return;

        tbody.querySelectorAll('tr').forEach((tr) => {
            if (isHiddenBranch(tr)) return;
            const tds = tr.querySelectorAll('td');
            if (tds.length < 2) return;

            const optionCells = Array.from(tds).slice(1);
            const radios = [];
            const checkboxes = [];

            optionCells.forEach((td) => {
                td.querySelectorAll('input[type="radio"]').forEach((r) => {
                    if (!r.disabled && !isHiddenBranch(r)) radios.push(r);
                });
                td.querySelectorAll('input[type="checkbox"]').forEach((c) => {
                    if (!c.disabled && !isHiddenBranch(c)) checkboxes.push(c);
                });
            });

            if (radios.length > 1) {
                if (radios.some((r) => r.checked)) return;
                const idx = middleIndex(radios.length);
                clickAntControl(radios[idx]);
            } else if (checkboxes.length > 1) {
                if (checkboxes.some((c) => c.checked)) return;
                const idx = middleIndex(checkboxes.length);
                const target = checkboxes[idx];
                if (!target.checked) {
                    clickAntControl(target);
                }
            }
        });
    });
}

function fillEHustRequiredText() {
    const selectors = [
        'input.response-short-answer[type="text"]',
        'textarea.response-short-answer',
        'input[class*="response-short-answer"]',
    ];
    selectors.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => {
            if (isHiddenBranch(el)) return;
            if (!isRequiredByAncestors(el)) return;
            const val = (el.value || '').trim();
            if (val !== '') return;
            setInputValue(el, '.');
        });
    });
}

function findEHustSubmitButton() {
    const byClass = document.querySelector('button.submit-answer-btn');
    if (byClass && !isHiddenBranch(byClass)) return byClass;
    const buttons = document.querySelectorAll('button.ant-btn-primary, button[type="button"].ant-btn');
    for (let i = 0; i < buttons.length; i++) {
        const b = buttons[i];
        if (isHiddenBranch(b)) continue;
        const text = (b.textContent || '').replace(/\s+/g, ' ').trim();
        if (text === 'Gửi' || text.includes('Gửi')) return b;
    }
    return null;
}

function ehustSurveyRootPresent() {
    return !!document.querySelector(
        '.response-radio-group, .response-checkbox-group, .question-preview, table.ant-table, [class*="response-radio"], [class*="response-checkbox"]'
    );
}

function runEHustFillPass() {
    fillEHustRadioGroups();
    fillEHustCheckboxGroups();
    fillEHustMatrixTables();
    fillEHustRequiredText();
}

function scheduleEHustSubmitOnce(shouldAlert) {
    if (ehustSubmitScheduled) return;
    ehustSubmitScheduled = true;
    if (ehustObserver) {
        ehustObserver.disconnect();
        ehustObserver = null;
    }

    setTimeout(() => {
        const submitBtn = findEHustSubmitButton();
        if (submitBtn) {
            submitBtn.click();
            if (shouldAlert) {
                alert('Đã điền và bấm gửi xong!');
            }
        } else if (shouldAlert) {
            alert('Đã điền xong nhưng không tìm thấy nút Gửi. Bạn hãy bấm tay nhé.');
        }
    }, 600);
}

function runEHustAutoFill(shouldAlert) {
    ehustSubmitScheduled = false;

    let attempts = 0;
    const maxAttempts = 50;
    const intervalMs = 400;

    function tick() {
        attempts++;
        runEHustFillPass();

        const submitVisible = !!findEHustSubmitButton();
        const formSeen = ehustSurveyRootPresent();

        if (formSeen && submitVisible) {
            scheduleEHustSubmitOnce(shouldAlert);
            return;
        }

        if (attempts >= maxAttempts) {
            if (ehustObserver) {
                ehustObserver.disconnect();
                ehustObserver = null;
            }
            if (submitVisible) {
                scheduleEHustSubmitOnce(shouldAlert);
            } else if (shouldAlert) {
                console.warn('HUST Survey Bypass: không thấy form khảo sát hoặc nút Gửi sau khi chờ.');
            }
            return;
        }

        setTimeout(tick, intervalMs);
    }

    tick();

    if (ehustObserver) {
        ehustObserver.disconnect();
        ehustObserver = null;
    }
    let debounceTimer = null;
    ehustObserver = new MutationObserver(() => {
        if (ehustSubmitScheduled) return;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (ehustSubmitScheduled) return;
            runEHustFillPass();
            if (ehustSurveyRootPresent() && findEHustSubmitButton()) {
                scheduleEHustSubmitOnce(shouldAlert);
            }
        }, 350);
    });
    ehustObserver.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
}

function routeAutoFill(shouldAlert) {
    const host = location.hostname;
    const path = location.pathname || '';

    if (host === 'e.hust.edu.vn' && path.startsWith('/survey')) {
        console.log('Đang chạy auto survey e.hust...');
        runEHustAutoFill(shouldAlert);
        return;
    }

    if (host === 'ctt-sis.hust.edu.vn') {
        console.log('Đang chạy tool tự động điền (ctt-sis)...');
        runCttSisAutoFill(shouldAlert);
        return;
    }

    console.log('Host không khớp survey đã hỗ trợ, bỏ qua.');
}

function executeAutoFill() {
    chrome.storage.sync.get(['enableAlert', 'enableAutoFill'], function (result) {
        const shouldAutoFill = result.enableAutoFill !== false;

        if (!shouldAutoFill) {
            console.log('Tự động điền đang tắt.');
            return;
        }

        const shouldAlert = result.enableAlert !== false;
        routeAutoFill(shouldAlert);
    });
}

function injectSettingsPanel() {
    if (document.getElementById(PANEL_HOST_ID)) return;

    const host = document.createElement('div');
    host.id = PANEL_HOST_ID;
    host.setAttribute('data-hust-sb', 'settings');
    Object.assign(host.style, {
        position: 'fixed',
        right: '12px',
        bottom: '12px',
        zIndex: '2147483646',
        fontFamily: 'system-ui, Segoe UI, sans-serif',
        pointerEvents: 'auto',
    });

    const shadow = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      :host { all: initial; }
      * { box-sizing: border-box; }
      .box {
        min-width: 220px;
        max-width: min(280px, calc(100vw - 24px));
        padding: 12px 14px;
        background: #fafafa;
        border: 1px solid #e0e0e0;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,.12);
      }
      .title {
        margin: 0 0 10px 0;
        font-size: 14px;
        font-weight: 600;
        color: #b71c1c;
        border-bottom: 1px solid #eee;
        padding-bottom: 8px;
      }
      .row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 10px;
        font-size: 13px;
        color: #333;
      }
      .row:last-child { margin-bottom: 0; }
      .switch {
        position: relative;
        display: inline-block;
        width: 34px;
        height: 20px;
        flex-shrink: 0;
      }
      .switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }
      .slider {
        position: absolute;
        cursor: pointer;
        top: 0; left: 0; right: 0; bottom: 0;
        background-color: #ccc;
        transition: .25s;
        border-radius: 34px;
      }
      .slider:before {
        position: absolute;
        content: "";
        height: 12px;
        width: 12px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        transition: .25s;
        border-radius: 50%;
      }
      input:checked + .slider { background-color: #b71c1c; }
      input:focus-visible + .slider { box-shadow: 0 0 0 2px rgba(183,28,28,.25); }
      input:checked + .slider:before { transform: translateX(14px); }
    `;

    const box = document.createElement('div');
    box.className = 'box';
    box.innerHTML = `
      <p class="title">HUST Auto Survey</p>
      <div class="row">
        <span>Tự động điền</span>
        <label class="switch">
          <input type="checkbox" id="hust-sb-autofill" />
          <span class="slider"></span>
        </label>
      </div>
      <div class="row">
        <span>Hiện thông báo</span>
        <label class="switch">
          <input type="checkbox" id="hust-sb-alert" />
          <span class="slider"></span>
        </label>
      </div>
    `;

    shadow.appendChild(style);
    shadow.appendChild(box);

    const autoFillToggle = shadow.getElementById('hust-sb-autofill');
    const alertToggle = shadow.getElementById('hust-sb-alert');

    chrome.storage.sync.get(['enableAlert', 'enableAutoFill'], function (result) {
        alertToggle.checked = result.enableAlert !== false;
        autoFillToggle.checked = result.enableAutoFill !== false;
    });

    autoFillToggle.addEventListener('change', function () {
        chrome.storage.sync.set({ enableAutoFill: autoFillToggle.checked });
    });
    alertToggle.addEventListener('change', function () {
        chrome.storage.sync.set({ enableAlert: alertToggle.checked });
    });

    document.documentElement.appendChild(host);
}

function bootstrap() {
    injectSettingsPanel();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
} else {
    bootstrap();
}

window.addEventListener('load', executeAutoFill);
