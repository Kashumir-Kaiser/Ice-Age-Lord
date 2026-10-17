import { ArrowRight, BookOpen, Flame, ScrollText, Shield, Snowflake } from 'lucide-react';

export type EntryIntent = 'new' | 'load';
type LandingPageProps = {
  demoEnabled: boolean;
  onNewGame: () => void;
  onLoadSave: () => void;
  onDemo: () => void;
};

/**
 * The menu is presentation only. It never creates saves, authenticates,
 * advances the world clock, or imports the demo client.
 */
export default function LandingPage({ demoEnabled, onNewGame, onLoadSave, onDemo }: LandingPageProps) {
  return <main className="frozen-menu" aria-labelledby="frozen-menu-title">
    <div className="frozen-menu__scene" aria-hidden="true" />
    <div className="frozen-menu__veils" aria-hidden="true" />
    <div className="frozen-menu__snow frozen-menu__snow--near" aria-hidden="true" />
    <div className="frozen-menu__snow frozen-menu__snow--far" aria-hidden="true" />

    <header className="frozen-menu__masthead">
      <div className="frozen-menu__seal" aria-hidden="true"><Snowflake size={29} strokeWidth={1.4}/><Flame size={18} strokeWidth={1.8}/></div>
      <div className="frozen-menu__title-group">
        <span className="frozen-menu__overline">BIÊN NIÊN BĂNG PHONG</span>
        <h1 id="frozen-menu-title"><span>ICE AGE</span> <em>LORD</em></h1>
        <div className="frozen-menu__title-rule"><span /></div>
      </div>
    </header>

    <div className="frozen-menu__lore" aria-hidden="true">
      <span className="frozen-menu__lore-mark">I</span>
      <p>Thế giới đã hóa băng.</p>
      <strong>Ngọn lửa cuối cùng chưa tắt.</strong>
    </div>

    <section className="frozen-menu__right" aria-label="Menu chính">
      <div className="frozen-menu__frame">
        <div className="frozen-menu__corner frozen-menu__corner--tl" aria-hidden="true" />
        <div className="frozen-menu__corner frozen-menu__corner--tr" aria-hidden="true" />
        <div className="frozen-menu__corner frozen-menu__corner--bl" aria-hidden="true" />
        <div className="frozen-menu__corner frozen-menu__corner--br" aria-hidden="true" />
        <div className="frozen-menu__frame-head">
          <div className="frozen-menu__ornament" aria-hidden="true"><span>✦</span></div>
          <span>ĐẠI SẢNH BĂNG PHONG</span>
          <h2>Hành trình của lãnh chúa</h2>
          <p>Một thế giới. Một lần khởi đầu. Những lựa chọn không thể xóa.</p>
        </div>
        <nav className="frozen-menu__actions" aria-label="Bắt đầu chơi">
          <button type="button" className="frozen-menu__action frozen-menu__action--primary" onClick={onNewGame} data-testid="menu-new-game">
            <span className="frozen-menu__action-icon"><Flame size={23} strokeWidth={1.5}/></span>
            <span className="frozen-menu__action-content"><strong>Trò chơi mới</strong><small>Khởi đầu một lãnh địa tại T0</small></span>
            <ArrowRight size={17} aria-hidden="true" />
          </button>
          <button type="button" className="frozen-menu__action" onClick={onLoadSave} data-testid="menu-load-save">
            <span className="frozen-menu__action-icon"><BookOpen size={23} strokeWidth={1.5}/></span>
            <span className="frozen-menu__action-content"><strong>Tải lượt lưu</strong><small>Tiếp tục từ một lượt đã lưu trên máy chủ</small></span>
            <ArrowRight size={17} aria-hidden="true" />
          </button>
          {demoEnabled && <button type="button" className="frozen-menu__action frozen-menu__action--demo" onClick={onDemo} data-testid="menu-demo">
            <span className="frozen-menu__action-icon"><ScrollText size={23} strokeWidth={1.5}/></span>
            <span className="frozen-menu__action-content"><strong>Bản demo</strong><small>Xem giao diện mẫu · Không ghi vào lượt lưu</small></span>
            <ArrowRight size={17} aria-hidden="true" />
          </button>}
        </nav>
        <div className="frozen-menu__frame-foot"><Shield size={15} strokeWidth={1.6}/><span>Lửa Sinh Tồn sẽ chỉ cháy khi thế giới thực sự bắt đầu.</span></div>
      </div>
    </section>

    <footer className="frozen-menu__footer">
      <span>ICE AGE LORD · BĂNG PHONG TẬN THẾ</span>
      <span className="frozen-menu__footer-center">SINH TỒN <b>✦</b> XÂY DỰNG <b>✦</b> CHINH PHỤC</span>
      <span>© ICE AGE LORD · BĂNG PHONG TẬN THẾ</span>
    </footer>
  </main>;
}
