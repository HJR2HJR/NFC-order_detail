import React, { useState } from 'react';
import { OrderData, generateColumnText } from '../utils/parser';
import { Copy, Check, Inbox } from 'lucide-react';

interface DataTableProps {
  orders: OrderData[];
  onRemoveItem?: (index: number) => void;
}

export function DataTable({ orders, onRemoveItem }: DataTableProps) {
  const [copiedCell, setCopiedCell] = useState<{row: number, col: string} | null>(null);
  const [copiedCol, setCopiedCol] = useState<string | null>(null);

  const handleCopyCell = (text: string, rowIdx: number, colKey: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedCell({ row: rowIdx, col: colKey });
      setTimeout(() => setCopiedCell(null), 1500);
    });
  };

  const handleCopyCol = (colKey: keyof OrderData) => {
    const text = generateColumnText(orders, colKey);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedCol(colKey);
      setTimeout(() => setCopiedCol(null), 1500);
    });
  };

  const columns: { key: keyof OrderData; label: string; width: string }[] = [
    { key: 'orderId', label: '亚马逊订单号', width: '13%' },
    { key: 'purchaseDate', label: '下单时间', width: '9%' },
    { key: 'customerName', label: '顾客姓名', width: '9%' },
    { key: 'site', label: '站点', width: '5%' },
    { key: 'bundleType', label: '套装类型', width: '14%' },
    { key: 'quantity', label: '数量', width: '5%' },
    { key: 'address', label: '顾客地址', width: '24%' },
    { key: 'remark', label: '备注', width: '8%' },
    { key: 'orderStatus', label: '状态', width: '13%' }
  ];

  const renderValue = (order: OrderData, col: { key: keyof OrderData; label: string }, isEmptyRow: boolean) => {
    const val = order[col.key];

    if (!val && col.key === 'customerName' && !isEmptyRow) {
      return <span className="text-slate-400">空</span>;
    }

    if (!val) return null;

    if (col.key === 'site') {
      return (
        <span className="inline-flex min-w-10 items-center justify-center rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold text-white">
          {val}
        </span>
      );
    }

    if (col.key === 'orderStatus') {
      const status = String(val);
      const isShipped = status.toLowerCase().includes('shipped');
      const isPending = status.toLowerCase().includes('pending');
      return (
        <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${
          isShipped ? 'bg-emerald-50 text-emerald-700' : isPending ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
        }`}>
          {status}
        </span>
      );
    }

    return (
      <span className={`min-w-0 break-words ${col.key === 'address' ? 'whitespace-pre-wrap leading-6 text-slate-700' : ''} ${col.key === 'orderId' ? 'font-mono text-[11px] leading-5 text-slate-700 xl:text-xs' : ''}`}>
        {val}
        {col.key === 'bundleType' && order.bundleType === order.rawASIN && order.rawASIN && (
          <span className="ml-2 inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
            未知ASIN
          </span>
        )}
      </span>
    );
  };

  if (orders.length === 0) {
    return (
      <div className="flex h-full min-h-80 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-4 py-12 text-center text-slate-500 shadow-sm">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <Inbox size={22} />
        </div>
        <p className="text-sm font-medium text-slate-700">暂无数据</p>
        <p className="mt-1 text-xs">请先上传订单报告文件，或在上方粘贴订单号。</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-80 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
      <table className="w-full table-fixed border-separate border-spacing-0 text-xs xl:text-sm">
        <colgroup>
          {columns.map(col => (
            <col key={col.key} style={{ width: col.width }} />
          ))}
        </colgroup>
        <thead className="sticky top-0 z-10 bg-slate-100">
          <tr>
            {columns.map(col => (
              <th key={col.key} scope="col" className="group border-b border-slate-200 px-2.5 py-3 text-left text-[11px] font-semibold text-slate-600 xl:px-3">
                <div className="flex min-w-0 items-center justify-between gap-1.5">
                  <span className="truncate">{col.label}</span>
                  <button 
                    onClick={() => handleCopyCol(col.key)}
                    className="shrink-0 rounded-md p-1 text-slate-400 opacity-0 transition hover:bg-white hover:text-slate-900 group-hover:opacity-100 focus:opacity-100"
                    title={`复制整列: ${col.label}`}
                  >
                    {copiedCol === col.key ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.map((order, idx) => {
            // Check if it's an empty row constructed from missing pasted ID
            const isEmptyRow = Boolean(!order.purchaseDate && !order.rawASIN && order.orderId);
            return (
              <tr key={`${order.orderId}-${idx}`} className={`transition-colors ${isEmptyRow ? 'bg-amber-50/70' : idx % 2 ? 'bg-slate-50/50 hover:bg-slate-100/70' : 'bg-white hover:bg-slate-50'}`}>
                {columns.map(col => {
                  const val = order[col.key];
                  return (
                    <td key={col.key} className="group relative overflow-hidden border-b border-slate-100 border-r border-slate-100 px-2.5 py-3 align-top text-slate-900 last:border-r-0 xl:px-3">
                       <div className="flex min-h-6 items-start justify-between gap-2">
                         {renderValue(order, col, isEmptyRow)}
                         {val && (
                           <button
                             onClick={() => handleCopyCell(val as string, idx, col.key)}
                             className="mt-0.5 shrink-0 rounded-md p-1 text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-slate-900 group-hover:opacity-100 focus:opacity-100"
                             title="复制单元格"
                           >
                             {copiedCell?.row === idx && copiedCell?.col === col.key 
                               ? <Check size={14} className="text-emerald-600" /> 
                               : <Copy size={14} />}
                           </button>
                         )}
                       </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}
