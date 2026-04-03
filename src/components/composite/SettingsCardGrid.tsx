import type { ReactNode } from 'react';
import { Card } from '../ui/Card';
import { TextLink } from '../ui/TextLink';
import { Button } from '../ui/Button';

export interface SettingsCard {
  icon: ReactNode;
  title: string;
  content: ReactNode;
  linkLabel?: string;
  onLinkClick?: () => void;
}

export interface DangerAction {
  description: string;
  buttonLabel: string;
  onClick: () => void;
}

export interface SettingsCardGridProps {
  cards: SettingsCard[];
  dangerAction?: DangerAction;
}

export function SettingsCardGrid({ cards, dangerAction }: SettingsCardGridProps) {
  return (
    <div>
      {/* Card grid */}
      <div className="grid grid-cols-3 gap-5">
        {cards.map((card) => (
          <Card key={card.title} padding="24px">
            <div className="flex items-center gap-2 mb-4">
              <span className="shrink-0">{card.icon}</span>
              <h3 className="text-[16px] font-semibold text-foreground">{card.title}</h3>
            </div>
            <div className="text-[14px] text-muted-foreground leading-relaxed">
              {card.content}
            </div>
            {card.linkLabel && (
              <div className="mt-4">
                <TextLink variant="primary" fontSize={13} onClick={card.onLinkClick}>
                  {card.linkLabel}
                </TextLink>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Danger zone */}
      {dangerAction && (
        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[14px] font-semibold text-destructive">위험 영역</span>
              <p className="text-[13px] text-gray-400 mt-1">{dangerAction.description}</p>
            </div>
            <Button variant="destructive-ghost" size="sm" onClick={dangerAction.onClick}>
              {dangerAction.buttonLabel}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
