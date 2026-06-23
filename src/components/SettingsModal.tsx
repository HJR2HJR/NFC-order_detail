import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

export interface SiteMappingRule {
  id: string;
  fromSite: string;
  toSite: string;
  remark: string;
}

export const DEFAULT_MAPPINGS: SiteMappingRule[] = [
  { id: '1', fromSite: 'CA', toSite: 'US', remark: '加拿大' },
  { id: '2', fromSite: 'MX', toSite: 'US', remark: '墨西哥' },
  { id: '3', fromSite: 'UK', toSite: 'EU', remark: '英国' },
  { id: '4', fromSite: 'GB', toSite: 'EU', remark: '英国' },
  { id: '5', fromSite: 'DE', toSite: 'EU', remark: '德国' },
  { id: '6', fromSite: 'FR', toSite: 'EU', remark: '法国' },
  { id: '7', fromSite: 'IT', toSite: 'EU', remark: '意大利' },
  { id: '8', fromSite: 'ES', toSite: 'EU', remark: '西班牙' },
  { id: '9', fromSite: 'NL', toSite: 'EU', remark: '荷兰' },
  { id: '10', fromSite: 'SE', toSite: 'EU', remark: '瑞典' },
  { id: '11', fromSite: 'PL', toSite: 'EU', remark: '波兰' },
  { id: '12', fromSite: 'BE', toSite: 'EU', remark: '比利时' }
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: SiteMappingRule[];
  onSave: (rules: SiteMappingRule[]) => void;
}

export function SettingsModal({ isOpen, onClose, rules, onSave }: SettingsModalProps) {
  const [localRules, setLocalRules] = useState<SiteMappingRule[]>(rules);

  if (!isOpen) return null;

  const handleAdd = () => {
    setLocalRules([...localRules, { id: Math.random().toString(), fromSite: '', toSite: '', remark: '' }]);
  };

  const handleUpdate = (id: string, field: keyof SiteMappingRule, value: string) => {
    setLocalRules(localRules.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleRemove = (id: string) => {
    setLocalRules(localRules.filter(r => r.id !== id));
  };

  const handleSave = () => {
    // Filter out completely empty rules
    const validRules = localRules.filter(r => r.fromSite.trim() || r.toSite.trim() || r.remark.trim());
    onSave(validRules);
    onClose();
  };

  const handleLoadDefaults = () => {
    setLocalRules(DEFAULT_MAPPINGS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-2xl ring-1 ring-slate-900/10">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">映射设置</h2>
            <p className="mt-0.5 text-xs text-slate-500">规则缓存于当前浏览器本地。</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4 flex items-end justify-between gap-4">
            <p className="text-sm text-slate-500">上传订单时会自动应用以下规则，符合来源站点后替换为目标站点并添加备注。</p>
            <button
              onClick={handleLoadDefaults}
              className="whitespace-nowrap rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200"
            >
              恢复预设
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex gap-2 rounded-md bg-slate-100 px-2 py-2 text-xs font-semibold text-slate-500">
              <div className="w-1/4">来源站点</div>
              <div className="w-1/4">目标站点</div>
              <div className="flex-1">备注</div>
              <div className="w-8"></div>
            </div>
            
            {localRules.map(rule => (
              <div key={rule.id} className="flex gap-2 items-center">
                <input
                  className="w-1/4 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  placeholder="如: CA"
                  value={rule.fromSite}
                  onChange={e => handleUpdate(rule.id, 'fromSite', e.target.value)}
                />
                <input
                  className="w-1/4 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  placeholder="如: US"
                  value={rule.toSite}
                  onChange={e => handleUpdate(rule.id, 'toSite', e.target.value)}
                />
                <input
                  className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  placeholder="如: 加拿大"
                  value={rule.remark}
                  onChange={e => handleUpdate(rule.id, 'remark', e.target.value)}
                />
                <button
                  onClick={() => handleRemove(rule.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-rose-400 transition hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {localRules.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400">
                暂无映射规则
              </div>
            )}
          </div>
          
          <button
            onClick={handleAdd}
            className="mt-4 flex items-center rounded-md px-1 py-1 text-sm font-medium text-slate-700 transition hover:text-slate-950"
          >
            <Plus size={16} className="mr-1" /> 添加映射规则
          </button>
        </div>

        <div className="flex justify-end gap-3 rounded-b-lg border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            保存并应用 (新订单)
          </button>
        </div>
      </div>
    </div>
  );
}
