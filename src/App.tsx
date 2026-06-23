import React, { useState, useCallback, useMemo } from 'react';
import { DropZone } from './components/DropZone';
import { DataTable } from './components/DataTable';
import { parseExportData, OrderData, generateTableText, COUNTRY_MAP, EUROPE_SITES } from './utils/parser';
import { Copy, Trash2, Check, Settings, FileSpreadsheet, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { SettingsModal, SiteMappingRule, DEFAULT_MAPPINGS } from './components/SettingsModal';

function applyMappingRulesToOrders(orders: OrderData[], rules: SiteMappingRule[]): OrderData[] {
  return orders.map(o => {
    // 强制跳过的SKU/ASIN片段，防止其被误映射覆盖掉刚才 parser.ts 处理的结果
    const skuUpper = (o.rawSKU || '').toUpperCase();
    const asinUpper = (o.rawASIN || '').toUpperCase();
    const isDE = skuUpper.includes('-DE-') || ['B0GGR62227','B0GGRB7SHZ','B0GGR2TM58','B0GGRL7VK4','B0GGR5522Q','B0GGRPZQLQ','B0GGR889LC','B0GGRJLNWT','B0GGRB1CZZ'].includes(asinUpper);
    const isEU = skuUpper.includes('-EU-') || ['B0GH112KNV','B0GGQRLP9S','B0GGQTMN9J','B0GGQXB9PX','B0GGQYQZ99','B0GGR3ZHGR','B0GGQWZD8D','B0GGQXS31H','B0GGR3XZKR'].includes(asinUpper);
    if (isDE || isEU) {
      return o;
    }

    let newSite = o.site;
    let addedRemark = o.remark;
    if (newSite) {
      const uSite = newSite.toUpperCase();
      const matchedRule = rules.find(r => r.fromSite.toUpperCase() === uSite);
      if (matchedRule && matchedRule.toSite.trim()) {
        newSite = matchedRule.toSite.trim();
        const ruleRemark = (o.addressCountryName || matchedRule.remark).trim();
        if (ruleRemark) {
           addedRemark = addedRemark ? `${addedRemark}, ${ruleRemark}` : ruleRemark;
        }
      }
    }
    return { ...o, site: newSite, remark: addedRemark };
  });
}

export default function App() {
  const [mappingRules, setMappingRules] = useState<SiteMappingRule[]>(() => {
    const saved = localStorage.getItem('siteMappingRules');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_MAPPINGS;
      }
    }
    return DEFAULT_MAPPINGS;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleSaveSettings = useCallback((newRules: SiteMappingRule[]) => {
    setMappingRules(newRules);
    localStorage.setItem('siteMappingRules', JSON.stringify(newRules));
  }, []);

  const [orders, setOrders] = useState<OrderData[]>([]);
  const [copiedState, setCopiedState] = useState<'table' | 'blocks' | null>(null);

  const [pastedOrdersText, setPastedOrdersText] = useState("");
  const queryOrderIds = useMemo(() => {
    return pastedOrdersText.split('\n').map(s => s.trim()).filter(Boolean);
  }, [pastedOrdersText]);

  const displayedOrders = useMemo(() => {
    if (queryOrderIds.length > 0) {
      return queryOrderIds.map(oId => {
         const found = orders.find(o => o.orderId === oId);
         if (found) return found;
         return {
            orderId: oId, purchaseDate: '', customerName: '', site: '', bundleType: '', quantity: '', address: '', rawASIN: '', orderStatus: '', remark: '', rawSKU: ''
         };
      });
    }
    return orders;
  }, [orders, queryOrderIds]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFilesAccepted = useCallback(async (files: File[]) => {
    let newOrders: OrderData[] = [];
    
    for (const file of files) {
      try {
        const name = file.name.toLowerCase();
        if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
           const buffer = await file.arrayBuffer();
           const wb = XLSX.read(buffer, { type: 'array' });
           const ws = wb.Sheets[wb.SheetNames[0]];
           const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][];
           const extracted = parseExportData(data);
           if (extracted.length === 0) {
             setErrorMsg(`文件 ${file.name} 未能成功提取订单，请确保包含“订单号”等有效列名。`);
             setTimeout(() => setErrorMsg(null), 5000);
           }
           newOrders.push(...extracted);
        } else if (name.endsWith('.txt') || name.endsWith('.csv')) {
           const text = await file.text();
           const isTxt = name.endsWith('.txt');
           const parsed = Papa.parse(text, { 
             header: false, 
             skipEmptyLines: true, 
             delimiter: isTxt ? '\t' : undefined
           });
           const extracted = parseExportData(parsed.data as any[][]);
           if (extracted.length === 0) {
             setErrorMsg(`文件 ${file.name} 未能成功提取订单，请确保包含“订单号”等有效列名。`);
             setTimeout(() => setErrorMsg(null), 5000);
           }
           newOrders.push(...extracted);
        }
      } catch (err) {
        console.error("Error reading file:", file.name, err);
      }
    }

    if (newOrders.length > 0) {
      // Apply custom mapping rules here
      newOrders = applyMappingRulesToOrders(newOrders, mappingRules);

      setOrders(prev => {
        const existingIds = new Set(prev.map(o => o.orderId));
        return [...prev, ...newOrders.filter(o => !existingIds.has(o.orderId))];
      });
    }
  }, [mappingRules]);

  const handleCopyTable = useCallback(() => {
    if (displayedOrders.length === 0) return;
    const text = generateTableText(displayedOrders);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedState('table');
      setTimeout(() => setCopiedState(null), 2000);
    });
  }, [displayedOrders]);

  const handleClear = useCallback(() => {
    setOrders([]);
    setPastedOrdersText('');
  }, []);

  return (
    <div className="min-h-screen bg-[#f6f7f4] text-slate-900 font-sans">
      <header className="border-b border-slate-200/80 bg-white/90 px-4 py-5 shadow-[0_1px_0_rgba(15,23,42,0.03)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white shadow-sm">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-950">亚马逊/领星订单处理器</h1>
              <p className="mt-1 text-sm text-slate-500">导入订单、统一站点、整理地址与备注，生成可复制到 Excel 的结果。</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span>已载入 {orders.length} 条</span>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            >
              <Settings size={16} className="mr-2" />
              映射设置
            </button>
            {orders.length > 0 && (
              <>
                <button
                  onClick={handleCopyTable}
                  className="inline-flex h-10 items-center rounded-lg bg-slate-950 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                >
                  {copiedState === 'table' ? <Check size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />}
                  {copiedState === 'table' ? '已复制表格' : '复制表格 (Excel)'}
                </button>

                <button
                  onClick={handleClear}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-600 shadow-sm transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:ring-offset-2"
                  title="清空数据"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-6 pb-12">
        {errorMsg && (
          <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 shadow-sm" role="alert">
            <span className="block sm:inline">{errorMsg}</span>
          </div>
        )}
        <div className="grid items-stretch gap-5 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="flex flex-col gap-5 lg:min-h-[calc(100vh-136px)]">
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3">
                <h2 className="text-sm font-semibold text-slate-950">文件上传</h2>
                <p className="mt-1 text-xs text-slate-500">导入订单报告后自动解析。</p>
              </div>
              <DropZone onFilesAccepted={handleFilesAccepted} />
            </section>

            <section className="flex flex-1 flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3">
                <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-950">
                  <Search size={15} />
                  比对已发货
                </label>
                <p className="mt-1 text-xs text-slate-500">粘贴订单号后，右侧列表会按粘贴顺序过滤并对齐。</p>
              </div>
              <textarea
                className="min-h-64 flex-1 resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 font-mono text-xs leading-5 text-slate-800 shadow-inner outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200 lg:min-h-0"
                placeholder={'每行一个订单号...'}
                value={pastedOrdersText}
                onChange={e => setPastedOrdersText(e.target.value)}
              ></textarea>
            </section>
          </aside>

          <section className="flex min-w-0 flex-col space-y-3 lg:min-h-[calc(100vh-136px)]">
            <div className="flex flex-col justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center">
              <div>
                <h2 className="text-base font-semibold text-slate-950">
                  订单列表
                  <span className="ml-2 rounded-md bg-emerald-50 px-2 py-1 text-sm font-semibold text-emerald-700">{displayedOrders.length}</span>
                </h2>
                <p className="mt-1 text-xs text-slate-500">所有字段可单格复制，表头按钮可复制整列。</p>
              </div>
              {queryOrderIds.length > 0 && (
                <span className="inline-flex w-fit rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                  已按 {queryOrderIds.length} 个订单号过滤
                </span>
              )}
            </div>
            <div className="min-h-0 flex-1">
              <DataTable orders={displayedOrders} />
            </div>
          </section>
        </div>
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        rules={mappingRules}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
