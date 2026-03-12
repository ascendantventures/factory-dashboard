'use client';

import { MessageSquare, Hash } from 'lucide-react';

export interface PresetConfig {
  type: 'discord' | 'slack';
  urlPlaceholder: string;
  defaultEvents: string[];
}

const PRESETS: PresetConfig[] = [
  {
    type: 'discord',
    urlPlaceholder: 'https://discord.com/api/webhooks/…',
    defaultEvents: ['build.completed', 'qa.passed', 'deploy.completed'],
  },
  {
    type: 'slack',
    urlPlaceholder: 'https://hooks.slack.com/services/…',
    defaultEvents: ['build.completed', 'qa.passed', 'deploy.completed'],
  },
];

interface IntegrationPresetsProps {
  onSelect: (preset: PresetConfig) => void;
  compact?: boolean;
}

export default function IntegrationPresets({ onSelect, compact = false }: IntegrationPresetsProps) {
  return (
    <div className={`flex gap-3 flex-wrap ${compact ? '' : ''}`}>
      {PRESETS.map((preset) => {
        const isDiscord = preset.type === 'discord';
        return (
          <button
            key={preset.type}
            data-testid={`preset-${preset.type}`}
            type="button"
            onClick={() => onSelect(preset)}
            className="group text-left transition-all duration-200 focus:outline-none"
            style={{
              background: '#161A1F',
              border: '1px solid #2E353D',
              borderRadius: '12px',
              padding: compact ? '12px 16px' : '20px',
              cursor: 'pointer',
              flex: compact ? '0 0 auto' : '1 1 200px',
              maxWidth: compact ? '200px' : '280px',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.borderColor = 'rgba(232, 93, 4, 0.4)';
              el.style.transform = 'translateY(-2px)';
              el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.borderColor = '#2E353D';
              el.style.transform = 'translateY(0)';
              el.style.boxShadow = 'none';
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232, 93, 4, 0.3)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div
              className="flex items-center justify-center mb-3"
              style={{
                width: compact ? '36px' : '48px',
                height: compact ? '36px' : '48px',
                borderRadius: '10px',
                background: isDiscord ? '#5865F2' : '#4A154B',
              }}
            >
              {isDiscord
                ? <MessageSquare className="text-white" size={compact ? 18 : 24} />
                : <Hash className="text-white" size={compact ? 18 : 24} />
              }
            </div>
            <div
              className="font-semibold mb-1"
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: compact ? '14px' : '16px',
                color: '#F0F2F4',
              }}
            >
              {isDiscord ? 'Discord' : 'Slack'}
            </div>
            {!compact && (
              <div
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '13px',
                  color: '#6B7380',
                }}
              >
                {isDiscord
                  ? 'Send events to a Discord channel via webhook'
                  : 'Send events to a Slack channel via incoming webhook'
                }
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
