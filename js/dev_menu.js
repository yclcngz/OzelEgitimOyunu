(function () {
    if (typeof startLevel === 'undefined') return;

    const maxLevel = window.MAX_LEVEL || 5;

    const btn = document.createElement('button');
    btn.textContent = '🛠 DEV';
    btn.style.cssText = `
        position:fixed;bottom:12px;left:12px;z-index:99999;
        background:#222;color:#0f0;border:2px solid #0f0;
        padding:6px 12px;border-radius:8px;font-size:14px;
        font-weight:bold;cursor:pointer;opacity:0.85;
    `;

    const panel = document.createElement('div');
    panel.style.cssText = `
        position:fixed;bottom:52px;left:12px;z-index:99999;
        background:#111;border:2px solid #0f0;border-radius:10px;
        padding:10px;display:none;flex-wrap:wrap;gap:8px;max-width:260px;
    `;

    for (let i = 1; i <= maxLevel; i++) {
        const lb = document.createElement('button');
        lb.textContent = 'Seviye ' + i;
        lb.style.cssText = `
            background:#0f0;color:#111;border:none;
            padding:8px 14px;border-radius:6px;font-size:14px;
            font-weight:bold;cursor:pointer;
        `;
        lb.addEventListener('click', () => {
            panel.style.display = 'none';
            startLevel(i);
        });
        panel.appendChild(lb);
    }

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
    });

    document.addEventListener('click', () => { panel.style.display = 'none'; });

    document.body.appendChild(panel);
    document.body.appendChild(btn);
})();
