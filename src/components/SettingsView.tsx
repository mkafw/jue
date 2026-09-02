import React from 'react';
import { Settings, Key, Palette, Database, Info, ExternalLink } from 'lucide-react';

interface SettingsViewProps {
  onClose: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = () => {
  const Section = ({
    title,
    icon: Icon,
    children,
  }: {
    title: string;
    icon: any;
    children: React.ReactNode;
  }) => (
    <div className="paper-card p-5 mb-4">
      <div className="flex items-center gap-2.5 mb-4">
        <Icon className="text-gold" size={17} strokeWidth={1.5} />
        <h2 className="font-serif font-extralight text-base text-ink tracking-widest-2">{title}</h2>
      </div>
      {children}
    </div>
  );

  const SettingRow = ({
    label,
    value,
    onClick,
  }: {
    label: string;
    value?: string;
    onClick?: () => void;
  }) => (
    <div
      className={`flex items-center justify-between py-2.5 border-b border-line/40 last:border-0 ${
        onClick ? 'cursor-pointer hover:bg-paper-deep -mx-2 px-2 rounded-ticket' : ''
      }`}
      onClick={onClick}
    >
      <span className="text-sm text-ink-soft">{label}</span>
      {value && <span className="text-xs text-ink-faint font-mono">{value}</span>}
    </div>
  );

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Settings size={18} className="text-gold" strokeWidth={1.5} />
        <h1 className="font-serif font-extralight text-2xl text-ink tracking-shoujin">器用</h1>
      </div>

      <Section title="数据" icon={Database}>
        <SettingRow label="数据源" value="Cloudflare Workers + GitHub" />
        <SettingRow label="API 地址" value="qa-os-api.tiklt1.workers.dev" />
        <div className="pt-3">
          <a
            href="https://dash.cloudflare.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gold hover:text-ink text-xs transition-colors"
          >
            <ExternalLink size={13} />
            管理 Cloudflare Workers
          </a>
        </div>
      </Section>

      <Section title="加密" icon={Key}>
        <SettingRow label="加密方式" value="AES-GCM + PBKDF2" />
        <SettingRow label="密钥" value="本地管理" />
        <div className="pt-2 text-xs text-ink-faint">加密密钥仅存储于本地，不上传服务器。</div>
      </Section>

      <Section title="外观" icon={Palette}>
        <SettingRow label="主题" value="烟光暮山紫" />
        <SettingRow label="字体" value="Noto Serif SC / Inter / JetBrains Mono" />
      </Section>

      <Section title="关于" icon={Info}>
        <SettingRow label="版本" value="0.1.0" />
        <SettingRow label="技术栈" value="React + D3 + Three.js + Vite" />
        <SettingRow label="存储" value="GitHub Issues (加密)" />
      </Section>
    </div>
  );
};
