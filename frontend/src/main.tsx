import React, { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import './live/live.css';

type GameMode = 'demo' | 'live';

function configuredMode(): GameMode | null {
  const queryMode = new URLSearchParams(window.location.search).get('mode');
  if (queryMode === 'demo' || queryMode === 'live') return queryMode;
  const config = import.meta.env.VITE_GAME_MODE;
  return config === 'demo' || config === 'live' ? config : null;
}

function chooseMode(mode: GameMode, setMode: (mode: GameMode) => void) {
  const url = new URL(window.location.href);
  url.searchParams.set('mode', mode);
  window.history.replaceState(null, '', url.toString());
  setMode(mode);
}

function ModeChooser({ onChoose }: { onChoose: (mode: GameMode) => void }) {
  return <main className="mode-chooser">
    <section className="mode-chooser-card">
      <span className="live-eyebrow">ICE AGE LORD · GAME CLIENT</span>
      <h1>Chọn chế độ</h1>
      <p>Chọn nguồn dữ liệu cho phiên này. Chế độ live chỉ hiển thị trạng thái do API Stage 03 trả về.</p>
      <div className="mode-choices">
        <button className="mode-choice" onClick={() => onChoose('live')}>
          <strong>Live · SQLite API</strong>
          <span>Kết nối máy chủ cục bộ, tạo hoặc mở lượt lưu.</span>
        </button>
        <button className="mode-choice mode-choice--demo" onClick={() => onChoose('demo')}>
          <strong>Demo · dữ liệu giao diện</strong>
          <span>Mở bản xem thử bảy màn hình.</span>
        </button>
      </div>
    </section>
  </main>;
}

function Bootstrap() {
  const [mode, setMode] = useState<GameMode | null>(() => configuredMode());
  const [LoadedApp, setLoadedApp] = useState<ComponentType | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!mode) return;
    let active = true;
    setLoadedApp(null);
    setLoadError('');
    const loaded = mode === 'live' ? import('./LiveApp') : import('./App');
    loaded.then(module => {
      if (active) setLoadedApp(() => module.default);
    }).catch(() => {
      if (active) setLoadError('Không thể tải giao diện đã chọn.');
    });
    return () => { active = false; };
  }, [mode]);

  if (!mode) return <ModeChooser onChoose={next => chooseMode(next, setMode)} />;
  if (loadError) return <main className="mode-chooser"><section className="mode-chooser-card"><h1>Lỗi tải giao diện</h1><p role="alert">{loadError}</p><button className="live-button" onClick={() => setMode(null)}>Chọn lại chế độ</button></section></main>;
  if (!LoadedApp) return <main className="mode-chooser"><p role="status">Đang tải giao diện…</p></main>;
  return <LoadedApp />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><Bootstrap /></React.StrictMode>,
);
