import React, { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import ReactDOM from 'react-dom/client';
import LandingPage from './landing/LandingPage';
import './styles.css';
import './live/live.css';

type GameMode = 'demo' | 'live';
type LiveEntryIntent = 'new' | 'load' | 'either';
type Launch = { mode: GameMode; intent: LiveEntryIntent };
type GameComponentProps = { entryIntent?: LiveEntryIntent; onExit?: () => void };

// The demo is a development fixture, not an alternate persistence backend.
// Vite folds these constants at build time. An ordinary production bundle does
// not show or load demo, even if a user manually enters ?mode=demo.
const demoEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO === 'true';

function configuredLaunch(): Launch | null {
  const params = new URLSearchParams(window.location.search);
  const queryMode = params.get('mode');
  const configuredMode = import.meta.env.VITE_GAME_MODE;
  const mode = queryMode === 'live' || queryMode === 'demo'
    ? queryMode
    : configuredMode === 'live' || configuredMode === 'demo' ? configuredMode : null;
  if (!mode || (mode === 'demo' && !demoEnabled)) return null;
  const value = params.get('intent');
  const intent: LiveEntryIntent = value === 'new' || value === 'load' ? value : 'either';
  return { mode, intent };
}

function navigateTo(launch: Launch | null, setLaunch: (launch: Launch | null) => void) {
  const url = new URL(window.location.href);
  if (launch) {
    url.searchParams.set('mode', launch.mode);
    if (launch.mode === 'live' && launch.intent !== 'either') url.searchParams.set('intent', launch.intent);
    else url.searchParams.delete('intent');
  } else {
    url.searchParams.delete('mode');
    url.searchParams.delete('intent');
  }
  window.history.pushState(null, '', url.toString());
  setLaunch(launch);
}

function Bootstrap() {
  const [launch, setLaunch] = useState<Launch | null>(() => configuredLaunch());
  const [LoadedApp, setLoadedApp] = useState<ComponentType<GameComponentProps> | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const syncUrl = () => setLaunch(configuredLaunch());
    window.addEventListener('popstate', syncUrl);
    return () => window.removeEventListener('popstate', syncUrl);
  }, []);

  useEffect(() => {
    if (!launch) {
      setLoadedApp(null);
      setLoadError('');
      return;
    }
    let active = true;
    setLoadedApp(null);
    setLoadError('');
    const load = async () => {
      try {
        // Dynamic imports keep preview fixtures out of the live client.
        if (launch.mode === 'demo') {
          if (!demoEnabled) throw new Error('DEMO_DISABLED');
          const module = await import('./App');
          if (active) setLoadedApp(() => module.default as ComponentType<GameComponentProps>);
        } else {
          const module = await import('./LiveApp');
          if (active) setLoadedApp(() => module.default as ComponentType<GameComponentProps>);
        }
      } catch {
        if (active) setLoadError('Không thể tải giao diện đã chọn. Hãy thử lại.');
      }
    };
    void load();
    return () => { active = false; };
  }, [launch?.mode, launch?.intent]);

  const menu = () => navigateTo(null, setLaunch);
  if (!launch) return <LandingPage
    demoEnabled={demoEnabled}
    onNewGame={() => navigateTo({ mode: 'live', intent: 'new' }, setLaunch)}
    onLoadSave={() => navigateTo({ mode: 'live', intent: 'load' }, setLaunch)}
    onDemo={() => { if (demoEnabled) navigateTo({ mode: 'demo', intent: 'either' }, setLaunch); }}
  />;
  if (loadError) return <main className="live-start-page"><section className="live-start-card" role="alert">
    <h1>Không thể mở trò chơi</h1><p>{loadError}</p>
    <button className="live-button" onClick={menu}>Trở về menu chính</button>
  </section></main>;
  if (!LoadedApp) return <main className="live-start-page"><p role="status">Đang mở trò chơi…</p></main>;
  return <>
    {launch.mode === 'demo' && <button type="button" className="frozen-menu__demo-exit" onClick={menu}>← Menu chính</button>}
    <LoadedApp entryIntent={launch.intent} onExit={menu} />
  </>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><Bootstrap /></React.StrictMode>,
);
