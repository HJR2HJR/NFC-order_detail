import Papa from 'papaparse';

export interface OrderData {
  orderId: string;
  purchaseDate: string;
  customerName: string;
  site: string;
  bundleType: string;
  quantity: string;
  address: string;
  rawASIN: string;
  orderStatus: string;
  remark: string; // New field
  rawSKU: string;
  addressCountryCode?: string;
  addressCountryName?: string;
}

const ASIN_MAP: Record<string, string> = {
  "B0F2GM1F8V": "NFC黑立牌1个装-1",
  "B0F2GMJ46L": "NFC黑立牌3个装-1",
  "B0F2GKXQCD": "NFC白立牌1个装-1",
  "B0F2G64854": "NFC白立牌3个装-1",
  "B0FDB1LW6L": "NFC白1加黑1立牌装-1",
  "B0F2GJ64SK": "NFC黑卡片3张装-1",
  "B0F2GH2V1G": "NFC黑卡片5张装-1",
  "B0F2GC92GX": "NFC白卡片3张装-1",
  "B0F2GSZ5Z7": "NFC白卡片5张装-1",
  // EU and DE ASINs
  "B0GGR62227": "NFC黑立牌1个装-1",
  "B0GGRB7SHZ": "NFC黑立牌3个装-1",
  "B0GGR2TM58": "NFC白立牌1个装-1",
  "B0GGRL7VK4": "NFC白立牌3个装-1",
  "B0GGR5522Q": "NFC白1加黑1立牌装-1",
  "B0GGRPZQLQ": "NFC黑卡片3张装-1",
  "B0GGR889LC": "NFC黑卡片5张装-1",
  "B0GGRJLNWT": "NFC白卡片3张装-1",
  "B0GGRB1CZZ": "NFC白卡片5张装-1",
  "B0GH112KNV": "NFC黑立牌1个装-1",
  "B0GGQRLP9S": "NFC黑立牌3个装-1",
  "B0GGQTMN9J": "NFC白立牌1个装-1",
  "B0GGQXB9PX": "NFC白立牌3个装-1",
  "B0GGQYQZ99": "NFC白1加黑1立牌装-1",
  "B0GGR3ZHGR": "NFC黑卡片3张装-1",
  "B0GGQWZD8D": "NFC黑卡片5张装-1",
  "B0GGQXS31H": "NFC白卡片3张装-1",
  "B0GGR3XZKR": "NFC白卡片5张装-1",
};

export const COUNTRY_MAP: Record<string, string> = {
  US: '美国', CA: '加拿大', UK: '英国', GB: '英国',
  DE: '德国', FR: '法国', IT: '意大利', ES: '西班牙',
  NL: '荷兰', SE: '瑞典', PL: '波兰', BE: '比利时',
  AU: '澳大利亚', JP: '日本', MX: '墨西哥', AE: '阿联酋',
  SA: '沙特', SG: '新加坡',
  AT: '奥地利', CH: '瑞士', IE: '爱尔兰', CZ: '捷克',
  DK: '丹麦', NO: '挪威', FI: '芬兰', PT: '葡萄牙'
};

export const CHINESE_TO_EN_MAP: Record<string, string> = {
  '美国': 'US',
  '加拿大': 'CA',
  '英国': 'UK', '大不列颠': 'UK',
  '德国': 'DE',
  '法国': 'FR',
  '意大利': 'IT',
  '西班牙': 'ES',
  '荷兰': 'NL',
  '瑞典': 'SE',
  '波兰': 'PL',
  '比利时': 'BE',
  '澳大利亚': 'AU', '澳洲': 'AU',
  '日本': 'JP',
  '墨西哥': 'MX',
  '阿联酋': 'AE',
  '沙特阿拉伯': 'SA', '沙特': 'SA',
  '新加坡': 'SG',
  '奥地利': 'AT',
  '瑞士': 'CH',
  '爱尔兰': 'IE',
  '捷克': 'CZ',
  '丹麦': 'DK',
  '挪威': 'NO',
  '芬兰': 'FI',
  '葡萄牙': 'PT'
};

export const EUROPE_SITES = [
  'UK', 'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE', 'PL', 'BE',
  'AT', 'CH', 'IE', 'CZ', 'DK', 'NO', 'FI', 'PT'
];

const matchKey = (obj: any, keywords: string[]) => {
  const keys = Object.keys(obj);
  for (const kw of keywords) {
    const found = keys.find(k => k.toLowerCase().includes(kw));
    if (found) return obj[found] || '';
  }
  return '';
};

const matchExactKey = (obj: any, candidates: string[]) => {
  const keys = Object.keys(obj);
  for (const candidate of candidates) {
    const found = keys.find(k => k.trim().toLowerCase() === candidate.toLowerCase());
    if (found) return obj[found] || '';
  }
  return '';
};

const normalizeCountry = (value: string) => {
  const raw = String(value || '').trim();
  if (!raw) return { code: '', name: '' };

  if (CHINESE_TO_EN_MAP[raw]) {
    return { code: CHINESE_TO_EN_MAP[raw], name: raw };
  }

  const code = raw.toUpperCase();
  return {
    code,
    name: COUNTRY_MAP[code] || raw
  };
};

export function parseExportData(rows: any[][]): OrderData[] {
  const orders: OrderData[] = [];

  // 尝试前15行寻找包含 "订单号"、"amazon-order-id" 等关键字的表头行
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(15, rows.length); i++) {
    const row = rows[i];
    if (Array.isArray(row)) {
      const hasOrderId = row.some(cell => {
        if (typeof cell !== 'string') return false;
        const lower = cell.toLowerCase().replace(/-/g, '');
        return lower.includes('订单') || lower.includes('单号') || lower.includes('orderid');
      });
      if (hasOrderId) {
        headerRowIdx = i;
        break;
      }
    }
  }

  if (headerRowIdx === -1) {
    return []; // 未找到有效表头
  }

  const headers = rows[headerRowIdx].map(h => typeof h === 'string' ? h.trim() : String(h || ''));
  
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const rowRaw = rows[i];
    if (!Array.isArray(rowRaw) || rowRaw.length === 0) continue;
    
    // 转成 key-value 对象
    const row: Record<string, any> = {};
    headers.forEach((h, idx) => {
      row[h] = rowRaw[idx];
    });

    // 订单号
    const orderId = matchKey(row, ['订单号', 'amazon-order-id', 'order id', 'order_id', '单号']);
    if (!orderId) continue;

    // 下单时间
    let purchaseDate = matchKey(row, ['付款时间', '下单时间', 'purchase-date', '创建时间', '订购日期']);
    if (purchaseDate) {
      if (purchaseDate.includes('T')) {
         const datePart = purchaseDate.split('T')[0];
         purchaseDate = datePart.replace(/-/g, '/');
      } else if (purchaseDate.includes(' ')) {
         const datePart = purchaseDate.split(' ')[0];
         purchaseDate = datePart.replace(/-/g, '/');
      }
    }

    // 买家姓名
    const customerName = matchKey(row, ['买家姓名', '收件人', 'buyer-name', 'buyer-company-name', '买家名称']);

    // 站点和收件地址国家分开处理：A列“国家”是站点，L列“国家/地区”是地址国家。
    const rawMarketplace = matchExactKey(row, ['站点', '国家'])
      || matchKey(row, ['marketplace', 'sales-channel']);
    const marketplaceCountry = normalizeCountry(rawMarketplace);
    let site = marketplaceCountry.code;

    const rawAddressCountry = matchExactKey(row, ['国家/地区'])
      || matchKey(row, ['ship-country', 'ship country', 'shipping-country', 'country/region']);
    const addressCountry = normalizeCountry(rawAddressCountry);

    // SKU & ASIN 与 DE/EU 重新判断
    const sku = matchKey(row, ['sku', '商家sku', 'seller-sku', 'seller sku', '商家商品编号', '商品SKU']);
    const asin = matchKey(row, ['asin', 'ASIN']);
    let remark = '';

    const upperSKU = sku.toUpperCase();
    const upperASIN = asin.toUpperCase();
    
    const isDE = upperSKU.includes('-DE-') || 
      ['B0GGR62227','B0GGRB7SHZ','B0GGR2TM58','B0GGRL7VK4','B0GGR5522Q','B0GGRPZQLQ','B0GGR889LC','B0GGRJLNWT','B0GGRB1CZZ'].includes(upperASIN);
      
    const isEU = upperSKU.includes('-EU-') || 
      ['B0GH112KNV','B0GGQRLP9S','B0GGQTMN9J','B0GGQXB9PX','B0GGQYQZ99','B0GGR3ZHGR','B0GGQWZD8D','B0GGQXS31H','B0GGR3XZKR'].includes(upperASIN);

    if (isDE) {
      if (addressCountry.name) {
        remark = addressCountry.name;
      }
      site = 'DE';
    } else if (isEU) {
      if (addressCountry.name) {
        remark = addressCountry.name;
      }
      site = 'EU';
    }
    const productName = matchKey(row, ['品名', '商品名称', 'product-name', '标题']);
    
    let bundleType = '';
    if (asin && ASIN_MAP[asin]) {
       bundleType = ASIN_MAP[asin];
    } else {
       // if no ASIN match, fallback to Product Name + "-1" if not empty
       if (productName) {
          bundleType = productName.endsWith('-1') ? productName : `${productName}-1`;
       } else if (asin) {
          bundleType = asin;
       }
    }

    // 数量
    const quantity = matchKey(row, ['数量', 'quantity']);

    // 地址组合
    const city = matchKey(row, ['城市', 'ship-city']);
    const state = matchKey(row, ['州', '省', 'ship-state']);
    const zip = matchKey(row, ['邮编', 'ship-postal-code', 'postal']);
    const addr1 = matchKey(row, ['地址1', '街道', 'address 1', 'address1']);
    const addr2 = matchKey(row, ['地址2', 'address 2', 'address2']);
    
    const streetBase = [addr1, addr2].filter(Boolean).join(' ');
    const stateZip = [state, zip].filter(Boolean).join(', ');
    const parts = [streetBase, city, stateZip].filter(Boolean);
    
    // Fallback if the user just has a single address field
    const directAddr = matchKey(row, ['地址', 'ship-address']);
    
    let address = '';
    if (parts.length > 0) {
       address = parts.join('\n');
       if (directAddr && !address.includes(directAddr)) {
         address = [directAddr, city, stateZip].filter(Boolean).join('\n');
       }
    } else if (directAddr) {
       address = directAddr;
    }

    if (addressCountry.name && !address.includes(addressCountry.name)) {
       address = address ? `${address}\n${addressCountry.name}` : addressCountry.name;
    }

    const orderStatus = matchKey(row, ['订单状态', 'order-status', 'item-status']);

    orders.push({
      orderId,
      purchaseDate,
      customerName,
      site,
      bundleType,
      quantity,
      address,
      rawASIN: asin,
      orderStatus,
      remark: remark,
      rawSKU: sku,
      addressCountryCode: addressCountry.code,
      addressCountryName: addressCountry.name
    });
  }

  return orders;
}

export function generateTableText(orders: OrderData[]): string {
  const escapeCell = (val: unknown) => {
    const text = String(val ?? '');
    if (text.includes('\n') || text.includes('\t') || text.includes('"')) {
       return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const rows = orders.map(o => [
    o.orderId || '',
    o.purchaseDate || '',
    o.customerName || '',
    o.site || '',
    o.bundleType || '',
    o.quantity || '',
    o.address || '',
    o.remark || '',
    o.orderStatus || ''
  ]);
  return rows.map(r => r.map(escapeCell).join('\t')).join('\n');
}

export function generateColumnText(orders: OrderData[], colKey: keyof OrderData): string {
  return orders.map(o => o[colKey] || '').join('\n');
}
