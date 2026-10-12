import type { ReactNode } from 'react';
import './shared.css';

export type SharedLayoutMode = 'demo' | 'live';

export function ScreenHeading({ mode, eyebrow, title, description, className = '' }: {
  mode: SharedLayoutMode;
  eyebrow: string;
  title: string;
  description: string;
  className?: string;
}) {
  return <div className={`shared-screen-heading shared-screen-heading--${mode} ${className}`.trim()}>
    <span className="shared-screen-heading__eyebrow">{eyebrow}</span>
    <h1>{title}</h1>
    <p>{description}</p>
  </div>;
}

export function PageFrame({ mode, children, className = '' }: {
  mode: SharedLayoutMode;
  children: ReactNode;
  className?: string;
}) {
  return <div className={`shared-page-frame shared-page-frame--${mode} ${className}`.trim()}>{children}</div>;
}

export function CharacterArtwork({ name, className }: { name: string; className: string }) {
  return <figure className={className}>
    <img src="/assets/characters/li-lan-t0-fullbody.svg?v=20261010" alt={`Toàn thân ${name}`} loading="eager" />
    <figcaption>{name}</figcaption>
  </figure>;
}

export function CharacterSummary({ mode, name, title, grade, level, xp, mana }: {
  mode: SharedLayoutMode;
  name: string;
  title: string;
  grade: string;
  level: number;
  xp: number;
  mana: { current: number; max: number };
}) {
  return <section className={`shared-character-summary shared-character-summary--${mode}`} aria-label="Character summary">
    <div><span>Nhân vật</span><strong>{name}</strong><small>{title} · {grade}</small></div>
    <div><span>Cấp độ</span><strong>{level}</strong><small>{xp.toLocaleString('vi-VN')} XP</small></div>
    <div><span>Mana</span><strong>{mana.current} / {mana.max}</strong><small>Trạng thái máy chủ</small></div>
  </section>;
}
