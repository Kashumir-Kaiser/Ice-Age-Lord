import type { ReactNode } from 'react';
import './shared.css';

export function InspectorHeading({ mode, eyebrow, title, description, badges = [], icon, className = '' }: {
  mode: 'demo' | 'live';
  eyebrow: string;
  title: string;
  description?: string;
  badges?: readonly string[];
  icon?: ReactNode;
  className?: string;
}) {
  return <header className={`shared-inspector-heading shared-inspector-heading--${mode} ${className}`.trim()}>
    {icon && <span className="shared-inspector-heading__icon" aria-hidden="true">{icon}</span>}
    <div className="shared-inspector-heading__body">
      <span className="shared-inspector-heading__eyebrow">{eyebrow}</span>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {badges.length > 0 && <div className="shared-inspector-heading__badges">{badges.map(badge => <span key={badge}>{badge}</span>)}</div>}
    </div>
  </header>;
}

export function InspectorFrame({
  as: Element = 'aside', className, label, entityId, knowledge, testId, children,
}: {
  as?: 'aside' | 'div' | 'section';
  className: string;
  label: string;
  entityId?: string;
  knowledge?: string;
  testId?: string;
  children: ReactNode;
}) {
  return <Element
    className={`shared-inspector-frame ${className}`}
    role="region"
    aria-label={label}
    data-entity-id={entityId}
    data-knowledge={knowledge}
    data-testid={testId}
  >{children}</Element>;
}
