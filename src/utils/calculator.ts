import { CalculatorState, QuoteResult, QuoteLine, LensType, LensConfig, CameraResolution } from '../types';

export const LENS_CONFIGS: Record<LensType, LensConfig> = {
  '2.8': { fov: 90, len: 6, desc: 'عدسة عريضة 2.8 مم (زاوية 90°) - مثالية للمساحات المفتوحة والغرف' },
  '3.6': { fov: 60, len: 10, desc: 'عدسة قياسية 3.6 مم (زاوية 60°) - توازن بين المدى والزاوية' },
  '6': { fov: 40, len: 16, desc: 'عدسة ضيقة 6 مم (زاوية 40°) - ممتازة للممرات والمداخل البعيدة' },
  '12': { fov: 22, len: 25, desc: 'عدسة تيليفوكوس 12 مم (زاوية 22°) - لرصد بوابات وقراءة لوحات بعيدة' },
};

// Base cost prices in Egyptian Pounds (EGP) based on current Cairo security market wholesale rates
export const BASE_PRICES = {
  hikvision: {
    name: 'Hikvision (هايك فيجن)',
    analog: {
      cam: { '2MP': 480, '5MP': 850, '8MP': 1450 },
      dvr: { 4: 1200, 8: 1900, 16: 3400, 32: 6500 },
    },
    ip: {
      cam: { '2MP': 890, '5MP': 1550, '8MP': 2600 },
      nvr: { 4: 1900, 8: 2800, 16: 4900, 32: 9200 },
    },
  },
  dahua: {
    name: 'Dahua (داهوا)',
    analog: {
      cam: { '2MP': 450, '5MP': 800, '8MP': 1380 },
      dvr: { 4: 1150, 8: 1800, 16: 3200, 32: 6100 },
    },
    ip: {
      cam: { '2MP': 840, '5MP': 1480, '8MP': 2450 },
      nvr: { 4: 1800, 8: 2650, 16: 4600, 32: 8700 },
    },
  },
  hilook: {
    name: 'HiLook (هاي لوك)',
    analog: {
      cam: { '2MP': 390, '5MP': 720, '8MP': 1200 },
      dvr: { 4: 1050, 8: 1650, 16: 2900, 32: 5500 },
    },
    ip: {
      cam: { '2MP': 750, '5MP': 1300, '8MP': 2100 },
      nvr: { 4: 1600, 8: 2350, 16: 4100, 32: 7800 },
    },
  },
  ezviz: {
    name: 'Ezviz (إيزفيز وايرلس)',
    analog: {
      cam: { '2MP': 650, '5MP': 1100, '8MP': 1800 },
      dvr: { 4: 1300, 8: 2100, 16: 3600, 32: 6800 },
    },
    ip: {
      cam: { '2MP': 950, '5MP': 1750, '8MP': 2900 },
      nvr: { 4: 2100, 8: 3100, 16: 5200, 32: 9800 },
    },
  },
};

export const ACCESSORY_PRICES = {
  cablePerM: 8.5, // EGP/meter RG59 coaxial or Cat6 UTP
  boxPrice: 35, // EGP per waterproof junction box
  hdd: {
    'none': 0,
    '1TB': 1650,
    '2TB': 2450,
    '4TB': 3950,
    '8TB': 7200,
  },
  rack: 650, // 4U/6U Network/DVR rack cabinet
  powerSupplyPerCam: 75, // 12V 2A switching or central power share
  connectorsPerCam: 25, // BNC + DC male/female or RJ45 jacks
};

/**
 * Calculates the appropriate recorder channel size (4, 8, 16, or 32)
 */
export function getChannelCount(cams: number): number {
  if (cams <= 4) return 4;
  if (cams <= 8) return 8;
  if (cams <= 16) return 16;
  return 32;
}

/**
 * Calculates full quote details, cost, margin, labor, and total client price.
 */
export function calculateQuote(state: CalculatorState): QuoteResult {
  const brandData = BASE_PRICES[state.brand] || BASE_PRICES.hikvision;
  const isIP = state.systemType === 'ip';
  const pricingGroup = isIP ? brandData.ip : brandData.analog;

  const camUnitCost = pricingGroup.cam[state.res] || 500;
  const channels = getChannelCount(state.cams);
  const recorderUnitCost = isIP
    ? brandData.ip.nvr[channels as keyof typeof brandData.ip.nvr] || 2000
    : brandData.analog.dvr[channels as keyof typeof brandData.analog.dvr] || 1500;

  const recorderName = isIP ? `جهاز تسجيل NVR شبكي (${channels} قناة)` : `جهاز تسجيل DVR (${channels} قناة)`;
  const camName = `كاميرا ${brandData.name.split(' ')[0]} ${state.res} ${isIP ? 'IP' : 'HD'}`;

  const lines: QuoteLine[] = [
    {
      label: `${camName} (عدد ${state.cams})`,
      qty: state.cams,
      unitCost: camUnitCost,
      totalCost: camUnitCost * state.cams,
      category: 'camera',
    },
    {
      label: recorderName,
      qty: 1,
      unitCost: recorderUnitCost,
      totalCost: recorderUnitCost,
      category: 'recorder',
    },
  ];

  if (state.hddSize !== 'none') {
    const hddCost = ACCESSORY_PRICES.hdd[state.hddSize] || 0;
    lines.push({
      label: `هارد ديسك مراقبة مخصص WD Purple / Seagate SkyHawk (${state.hddSize})`,
      qty: 1,
      unitCost: hddCost,
      totalCost: hddCost,
      category: 'hdd',
    });
  }

  if (state.cable > 0) {
    const cableCost = state.cable * ACCESSORY_PRICES.cablePerM;
    lines.push({
      label: `كابل ${isIP ? 'شبكة Cat6 Pure Copper' : 'شيلد RG59 باور نحاس'} (${state.cable} متر)`,
      qty: state.cable,
      unitCost: ACCESSORY_PRICES.cablePerM,
      totalCost: cableCost,
      category: 'cable',
    });
  }

  if (state.box > 0) {
    const boxCost = state.box * ACCESSORY_PRICES.boxPrice;
    lines.push({
      label: `بواط حماية معزول ضد الماء 10×10 (عدد ${state.box})`,
      qty: state.box,
      unitCost: ACCESSORY_PRICES.boxPrice,
      totalCost: boxCost,
      category: 'box',
    });
  }

  if (state.powerSupply) {
    const pwrCost = state.cams * ACCESSORY_PRICES.powerSupplyPerCam;
    lines.push({
      label: isIP ? `سويتش PoE مخصص لتغذية الكاميرات` : `باور سبلاي مركزي 12 فولت مزود بفيوزات حماية`,
      qty: 1,
      unitCost: pwrCost,
      totalCost: pwrCost,
      category: 'power',
    });
  }

  if (state.connectors) {
    const connCost = state.cams * ACCESSORY_PRICES.connectorsPerCam;
    lines.push({
      label: isIP ? `جاكات RJ45 أصلية وتوصيلات شبكة` : `جاكات BNC تايواني وجاكات باور DC نحاس`,
      qty: state.cams,
      unitCost: ACCESSORY_PRICES.connectorsPerCam,
      totalCost: connCost,
      category: 'connectors',
    });
  }

  if (state.rack) {
    lines.push({
      label: `راك حماية جداري 6U مع رف وقفل للأجهزة`,
      qty: 1,
      unitCost: ACCESSORY_PRICES.rack,
      totalCost: ACCESSORY_PRICES.rack,
      category: 'rack',
    });
  }

  // Calculate material wholesale cost
  const materialCost = lines.reduce((sum, item) => sum + item.totalCost, 0);

  // Calculate labor cost if enabled
  let laborCost = 0;
  if (state.includeLabor) {
    laborCost = (state.cams * state.laborPerCam) + (state.cable * state.laborPerMeter);
    lines.push({
      label: `مصنعية المعاينة والتثبيت والبرمجة وربط الموبايل (${state.cams} نقطة + ${state.cable}م سلك)`,
      qty: 1,
      unitCost: laborCost,
      totalCost: laborCost,
      category: 'labor',
    });
  }

  const netCost = materialCost + (state.includeLabor ? 0 : 0); // labor is tracked separately or in total

  // Technician profit margin calculation
  let profit = 0;
  if (state.mode === 'percent') {
    profit = Math.round((materialCost * state.margin) / 100);
  } else {
    profit = Math.round(state.margin);
  }

  const grandTotal = materialCost + profit + laborCost;

  return {
    lines,
    cost: materialCost,
    profit,
    laborCost,
    total: grandTotal,
    channelCount: channels,
  };
}

/**
 * Calculates recording storage duration in days based on CCTV camera bitrate formulas
 */
export function calculateStorageDays(
  cams: number,
  res: CameraResolution,
  hddTB: number,
  codec: 'H.264' | 'H.265' | 'H.265+' = 'H.265+',
  recordingMode: 'continuous' | 'motion' = 'continuous'
): { days: number; dailyGB: number; totalGB: number; recommendation: string } {
  if (hddTB <= 0 || cams <= 0) {
    return { days: 0, dailyGB: 0, totalGB: 0, recommendation: 'يرجى اختيار هارد ديسك وكاميرا واحدة على الأقل' };
  }

  // Average bitrates in Mbps per resolution at 20-25fps with H.264
  let baseBitrateMbps = 2.0; // 2MP (1080p)
  if (res === '5MP') baseBitrateMbps = 4.2;
  if (res === '8MP') baseBitrateMbps = 8.0;

  // Codec efficiency reduction factor
  let codecFactor = 1.0;
  if (codec === 'H.265') codecFactor = 0.55;
  if (codec === 'H.265+') codecFactor = 0.35; // Smart Codec compression

  // Motion vs 24/7 continuous
  const motionFactor = recordingMode === 'motion' ? 0.45 : 1.0;

  const actualBitrateMbps = baseBitrateMbps * codecFactor * motionFactor;
  // Gigabytes per camera per day: (Mbps * 3600 * 24) / (8 * 1024)
  const gbPerCamPerDay = (actualBitrateMbps * 86400) / 8192;
  const totalDailyGB = gbPerCamPerDay * cams;

  const totalCapacityGB = hddTB * 1000 * 0.93; // 93% usable formatted space
  const days = Math.floor(totalCapacityGB / totalDailyGB);

  let recommendation = '';
  if (days < 7) {
    recommendation = 'تنبيه: مساحة التخزين تكفي لأقل من أسبوع. يُنصح بترقية الهارد إلى سعة أكبر.';
  } else if (days < 15) {
    recommendation = 'مساحة مناسبة للمحلات والمكاتب (أسبوعين تقريباً).';
  } else if (days <= 35) {
    recommendation = 'ممتاز: تحقق اشتراطات الأمان المعتادة (شهر تسجيل كامل).';
  } else {
    recommendation = 'سعة فائقة: تكفي لأكثر من شهر بكل أمان.';
  }

  return {
    days: Math.max(1, days),
    dailyGB: Math.round(totalDailyGB * 10) / 10,
    totalGB: Math.round(totalCapacityGB),
    recommendation,
  };
}

/**
 * Calculates power supply specifications and checks for voltage drop over cable distance
 * Uses Ohm's Law: ΔV = (2 * Length * Current * Resistivity) / CrossSectionArea
 */
export function calculatePowerSupply(
  cams: number,
  avgCableLengthMeters: number,
  wireGaugeMm2: number = 0.75,
  copperType: 'pure' | 'cca' = 'pure',
  camAmps: number = 1.0
): {
  recommendedAmps: number;
  totalWattage: number;
  voltageDropNotice: string;
  isSafe: boolean;
  calculatedVoltageDrop?: number;
  terminalVoltage?: number;
} {
  // Standard CCTV camera consumes ~0.5A daytime, up to 1.0A - 1.2A with Night Vision IR LEDs active
  const maxCurrentPerCam = camAmps || 1.2;
  const totalDrawAmps = cams * maxCurrentPerCam;
  // Add 30% safety head-room
  const requiredAmpsWithSafety = totalDrawAmps * 1.3;

  let recommendedAmps = 5;
  if (requiredAmpsWithSafety > 20) recommendedAmps = 30;
  else if (requiredAmpsWithSafety > 10) recommendedAmps = 20;
  else if (requiredAmpsWithSafety > 5) recommendedAmps = 10;

  const totalWattage = Math.round(recommendedAmps * 12);

  // Copper resistivity: Pure Copper = 0.0175 ohm*mm2/m, CCA/Commercial = 0.028 ohm*mm2/m
  const rho = copperType === 'pure' ? 0.0175 : 0.028;
  const loopResistance = (2 * avgCableLengthMeters * rho) / Math.max(0.2, wireGaugeMm2);
  const calculatedVoltageDrop = Math.round(maxCurrentPerCam * loopResistance * 10) / 10;
  const terminalVoltage = Math.max(0, Math.round((12.0 - calculatedVoltageDrop) * 10) / 10);

  let voltageDropNotice = `المسافة آمنة ومثالية (هبوط الجهد ${calculatedVoltageDrop}V، الجهد النهائي ${terminalVoltage}V).`;
  let isSafe = true;

  if (avgCableLengthMeters > 70 || calculatedVoltageDrop > 1.5 || terminalVoltage < 10.5) {
    voltageDropNotice = `تحذير: المسافة أطول من 70 متراً أو هبوط الجهد حرج (${calculatedVoltageDrop}V - يصل للكاميرا ${terminalVoltage}V). قد تنفصل الرؤية الليلية؛ يُفضل استخدام كابل نحاس 1.0 مم² أو باور منفصل قرب الكاميرا.`;
    isSafe = false;
  } else if (avgCableLengthMeters > 45 || calculatedVoltageDrop > 0.9) {
    voltageDropNotice = `مسافة متوسطة: هبوط الجهد المتوقع ${calculatedVoltageDrop}V (يصل ${terminalVoltage}V). يوصى بسلك نحاس 0.75 مم² أو باور مركزي قابل لضبط الفولتية (12V-13.8V Potentiometer).`;
  }

  return {
    recommendedAmps,
    totalWattage,
    voltageDropNotice,
    isSafe,
    calculatedVoltageDrop,
    terminalVoltage,
  };
}

/**
 * Validates Egyptian mobile phone number format
 */
export function isValidEgyptianPhone(phone: string): boolean {
  return /^01[0125]\d{8}$/.test(phone.trim());
}

/**
 * Generates an executive WhatsApp quote text ready to be sent to customers
 */
export function generateWhatsAppQuote(
  customerName: string,
  state: CalculatorState,
  quote: QuoteResult
): string {
  const brandName = BASE_PRICES[state.brand]?.name || 'Hikvision';
  const sysName = state.systemType === 'ip' ? 'منظومة شبكية متطورة (IP / PoE)' : 'منظومة كاميرات مراقبة (Turbo HD)';

  const linesText = quote.lines
    .map((l) => `▫️ ${l.label}`)
    .join('\n');

  return `*السلام عليكم أستاذ / ${customerName || 'العميل العزيز'}* 🌿
عرض سعر معتمد من *CamZone-EG* لكاميرات المراقبة:

📌 *تفاصيل المنظومة:*
- الماركة: ${brandName}
- نوع النظام: ${sysName}
- الدقة: ${state.res}
- عدد الكاميرات: ${state.cams} نقطة مراقبة
- جهاز التسجيل: ${quote.channelCount} قنوات مع تطبيق للموبايل

📦 *المشتملات والمستلزمات:*
${linesText}

💰 *إجمالي العرض شامل التوريد:* ${quote.total.toLocaleString('ar-EG')} جنيه مصري
🤝 *طريقة الدفع:* الدفع عند التسليم والمعاينة (COD)
🛡️ *الضمان:* ضمان رسمي استبدال + دعم فني وربط مجاني على الهاتف المحمول.

للتأكيد وموعد التركيب يرجى الرد على هذه الرسالة. شرفتنا دائماً!`.trim();
}

/**
 * Validates Egyptian 14-digit National Identification Number (الرقم القومي المصري)
 */
export function isValidEgyptianNationalId(nid: string): boolean {
  const clean = nid.trim();
  if (!/^\d{14}$/.test(clean)) return false;

  const centuryDigit = parseInt(clean[0], 10);
  if (centuryDigit !== 2 && centuryDigit !== 3) return false;

  const month = parseInt(clean.substring(3, 5), 10);
  const day = parseInt(clean.substring(5, 7), 10);
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  // Valid Egyptian Governorate codes
  const validGovernorates = new Set([
    '01', '02', '03', '04', '11', '12', '13', '14', '15',
    '16', '17', '18', '19', '21', '22', '23', '24', '25',
    '26', '27', '28', '29', '31', '32', '33', '34', '35', '88'
  ]);
  const govCode = clean.substring(7, 9);
  if (!validGovernorates.has(govCode)) return false;

  return true;
}

import { ShopProduct, CartItem } from '../types';

/**
 * Catalog of genuine CCTV products available in the Egyptian market
 */
export const INITIAL_SHOP_PRODUCTS: ShopProduct[] = [
  {
    id: 'prod-hik-2mp-bullet',
    title: 'كاميرا هيك فيجن 2 ميجا بوليت خارجية DS-2CE16D0T-ITPF',
    brand: 'hikvision',
    category: 'cameras',
    price: 550,
    cost: 450,
    resolution: '2MP',
    inStock: true,
    badge: 'الأكثر مبيعاً',
    image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&auto=format&fit=crop&q=80',
    specs: ['دقة 1080p Full HD', 'رؤية ليلية Smart IR حتى 25 متر', 'مقاومة للعوامل الجوية IP67', 'عدسة عريضة 2.8 مم أو 3.6 مم'],
    description: 'كاميرا مراقبة خارجية متينة مقاومة للشمس والأمطار من هيك فيجن الأصلية مع ضمان سنتين.'
  },
  {
    id: 'prod-hik-5mp-dome',
    title: 'كاميرا هيك فيجن 5 ميجا دوم داخلية DS-2CE76H0T-ITPF',
    brand: 'hikvision',
    category: 'cameras',
    price: 980,
    cost: 820,
    resolution: '5MP',
    inStock: true,
    badge: 'دقة فائقة',
    image: 'https://images.unsplash.com/photo-1549109926-58f039549485?w=600&auto=format&fit=crop&q=80',
    specs: ['دقة 5MP Super HD فائق الوضوح', 'رؤية ليلية 20 متر', 'هيكل أنيق للأسقف والديكورات', 'زاوية رؤية 85 درجة'],
    description: 'مثالية للشركات والمنازل والمحلات التي تتطلب وضوحاً فائقاً لتفاصيل الوجوه والنقود.'
  },
  {
    id: 'prod-dahua-2mp-bullet',
    title: 'كاميرا داهوا 2 ميجا HDCVI بوليت معدنية HAC-HFW1200T',
    brand: 'dahua',
    category: 'cameras',
    price: 520,
    cost: 430,
    resolution: '2MP',
    inStock: true,
    image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&auto=format&fit=crop&q=80',
    specs: ['جسم معدني صلب بالكامل', 'رؤية ليلية 30 متر', 'تقنية HDCVI الأصلية من داهوا', 'عدسة 3.6 مم'],
    description: 'تحمل استثنائي في درجات الحرارة العالية وأشعة الشمس المباشرة لواجهات المحلات والمنازل.'
  },
  {
    id: 'prod-hik-4k-ip',
    title: 'كاميرا هيك فيجن شبكية 8 ميجا 4K AcuSense ذكاء اصطناعي DS-2CD2083G2-I',
    brand: 'hikvision',
    category: 'cameras',
    price: 2950,
    cost: 2500,
    resolution: '8MP',
    inStock: true,
    badge: 'ذكاء اصطناعي 4K',
    image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&auto=format&fit=crop&q=80',
    specs: ['دقة 4K Ultra HD (3840×2160)', 'تمييز حركة البشر والمركبات AcuSense', 'تغذية PoE عبر كابل الشبكة', 'فتحة كارت ميموري MicroSD حتى 256GB'],
    description: 'أعلى دقة مراقبة في مصر مع فلترة الإنذارات الخاطئة وتقنية التعرف الذكي على الأشخاص.'
  },
  {
    id: 'prod-dvr-hik-4ch',
    title: 'جهاز تسجيل هيك فيجن 4 قنوات Turbo HD DVR DS-7204HQHI',
    brand: 'hikvision',
    category: 'recorders',
    price: 1390,
    cost: 1150,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?w=600&auto=format&fit=crop&q=80',
    specs: ['يدعم حتى 4 كاميرات بدقة حتى 5MP', 'ضغط H.265 Pro+ لتوفير 75% من الهارد', 'تطبيق مجاني للهاتف Hik-Connect', 'مخارج HDMI و VGA وشبكة LAN'],
    description: 'جهاز التسجيل الأكثر استقراراً في السوق المصري مع متابعة حية سلسة من أي مكان في العالم.'
  },
  {
    id: 'prod-nvr-hik-8ch-poe',
    title: 'جهاز تسجيل شبكي NVR هيك فيجن 8 قنوات PoE مدمج DS-7608NI-K2/8P',
    brand: 'hikvision',
    category: 'recorders',
    price: 4800,
    cost: 4100,
    inStock: true,
    badge: 'PoE احترافي',
    image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?w=600&auto=format&fit=crop&q=80',
    specs: ['8 منافذ PoE مدمجة لتشغيل الكاميرات مباشرة', 'يدعم كاميرات حتى 8MP 4K', 'يدعم 2 هارد ديسك سعة حتى 16TB', 'مخرج 4K HDMI حقيقي'],
    description: 'توصيل وتشغيل Plug & Play بدون الحاجة إلى سويتش خارجي أو محولات كهرباء إضافية.'
  },
  {
    id: 'prod-hdd-purple-1tb',
    title: 'هارد ديسك مراقبة ويسترن ديجيتال بربل WD Purple 1TB',
    brand: 'hikvision',
    category: 'storage',
    price: 1750,
    cost: 1550,
    inStock: true,
    badge: 'مخصص 24/7',
    image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&auto=format&fit=crop&q=80',
    specs: ['سعة 1000 جيجابايت', 'تقنية AllFrame لتقليل سقوط الفريمات', 'تشغيل متواصل 24 ساعة بدون سخونة', 'ضمان رسمي 3 سنوات'],
    description: 'الهارد الموصى به عالمياً لأجهزة الـ DVR والـ NVR لضمان عدم توقف التسجيل أو تلف الهارد.'
  },
  {
    id: 'prod-hdd-purple-2tb',
    title: 'هارد ديسك مراقبة ويسترن ديجيتال بربل WD Purple 2TB',
    brand: 'hikvision',
    category: 'storage',
    price: 2550,
    cost: 2300,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&auto=format&fit=crop&q=80',
    specs: ['سعة 2000 جيجابايت (تسجيل شهر لكاميرات 2MP)', 'كاش 64MB وسرعة نقل 6Gb/s', 'تحمل 180TB في السنة', 'ضمان استبدال معتمد'],
    description: 'المساحة المثالية للشركات والمحلات المتوسطة التي تحتاج إلى حفظ التسجيلات لمدة لا تقل عن شهر كامل.'
  },
  {
    id: 'prod-cable-rg59-roll',
    title: 'لفة سلك كاميرات RG59 باور نحاس أحمر نقي 100 متر',
    brand: 'dahua',
    category: 'cables',
    price: 850,
    cost: 720,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    specs: ['نحاس أحمر أصلي 100% بدون شوائب', 'شيلد حماية كثيف 96% لعزل التشويش', 'سلك كهرباء 2×0.75 مم مدمج', 'مقاوم للحرارة والرطوبة'],
    description: 'سلك نحاس صافي عالي الجودة لضمان صورة نقية 100% ومنع خطوط التموج أو هبوط الجهد ليلاً.'
  },
  {
    id: 'prod-rack-6u',
    title: 'كابينة راك جداري 6U مع باب زجاجي وقفل للمراقبة',
    brand: 'hikvision',
    category: 'accessories',
    price: 750,
    cost: 600,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80',
    specs: ['عمق 45 سم يتسع لجميع أجهزة DVR و NVR', 'باب أمامي زجاج مقوى مع قفل ومفتاحين', 'فتحات تهوية وتمرير كابلات آمنة', 'دهان إلكتروستاتيك مقاوم للصدأ'],
    description: 'حماية كاملة لجهاز التسجيل والباور سبلاي من العبث أو السرقة أو الحرارة مع مظهر ديكوري أنيق.'
  },
  {
    id: 'prod-box-ip66',
    title: 'بواط حماية معزول خارجي IP66 لكاميرات المراقبة (10×10 سم)',
    brand: 'hikvision',
    category: 'accessories',
    price: 35,
    cost: 25,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    specs: ['بلاستيك ABS معالج ضد أشعة UV والحرارة', 'عازل رطوبة وأمطار IP66 مع جوان سيليكون داخلي', 'أبعاد 10×10×5 سم لإخفاء وتأمين الجاكات ومحول الطاقة', 'مسامير تثبيت استنلس ستيل ضد الصدأ'],
    description: 'بواط تركي أصلي لحماية وتأمين وصلات الكاميرا والجاكات من العوامل الجوية والأتربة والماء.'
  },
  {
    id: 'prod-kit-4cam-hik',
    title: 'باقة متكاملة جاهزة: 4 كاميرات هيك فيجن 2MP مع جهاز التسجيل والهارد والأسلاك',
    brand: 'hikvision',
    category: 'smart_kits',
    price: 5490,
    cost: 4600,
    inStock: true,
    badge: 'باقة جاهزة توفير',
    image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&auto=format&fit=crop&q=80',
    specs: ['4 كاميرات 2MP (داخلي/خارجي)', 'جهاز DVR 4 قنوات', 'هارد 1TB ويسترن بربل أصلي', 'باور سبلاي 5A مع بواطات وجاكات', '50 متر سلك نحاس معتمد'],
    description: 'الحل الشامل الأكثر طلباً في مصر للمنازل والمحلات، جاهز للتركيب فوراً مع الدفع عند التسليم.'
  }
];

/**
 * Calculates cart subtotal, shipping fee, item counts, and grand total in EGP
 */
export function calculateCartTotal(items: CartItem[]): {
  subtotal: number;
  shippingFee: number;
  total: number;
  itemCount: number;
} {
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  // Free shipping over 3,000 EGP or flat 75 EGP across Egypt
  const shippingFee = subtotal > 3000 || subtotal === 0 ? 0 : 75;
  const total = subtotal + shippingFee;

  return {
    subtotal,
    shippingFee,
    total,
    itemCount,
  };
}

/**
 * Input sanitizer to prevent SQL Injection attempts in raw SQL queries
 */
export function sanitizeSqlInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/'/g, "''") // escape single quotes
    .replace(/;/g, '')    // strip semicolon statement breakers
    .replace(/--/g, '')   // strip SQL comments
    .replace(/\/\*/g, '') // strip block comments start
    .replace(/\*\//g, '') // strip block comments end
    .trim();
}

/**
 * Production-ready PostgreSQL Row Level Security (RLS) script for Supabase
 */
export const SUPABASE_RLS_POLICIES_SQL = `
-- ==============================================================================
-- CamZone-EG | Row Level Security (RLS) & Anti-SQL-Injection Database Hardening
-- Run this in Supabase SQL Editor to secure tables against unauthorized access
-- ==============================================================================

-- 1. Enable RLS on all primary tables
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admins ENABLE ROW LEVEL SECURITY;

-- 2. Orders Table Security
-- Anyone can insert a new order (with schema validation), but only verified admins can view/edit
CREATE POLICY "Public guest can insert orders"
ON public.orders FOR INSERT
WITH CHECK (
  phone ~ '^01[0125][0-9]{8}$' AND
  total > 0
);

CREATE POLICY "Admins full access to orders"
ON public.orders FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE admins.user_id = auth.uid()
  )
);

-- 3. Products Catalog Security
-- Public can read active products, but cannot modify wholesale cost or stock directly
CREATE POLICY "Public can view active products"
ON public.products FOR SELECT
USING (active = true);

CREATE POLICY "Admins can manage products"
ON public.products FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE admins.user_id = auth.uid()
  )
);

-- 4. Technicians Application & Contracts Table Security
-- Technicians can submit applications with 14-digit National ID validation
CREATE POLICY "Technicians can submit applications"
ON public.technicians FOR INSERT
WITH CHECK (
  length(national_id) = 14 AND
  phone ~ '^01[0125][0-9]{8}$'
);

CREATE POLICY "Admins can view and approve technician applications"
ON public.technicians FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE admins.user_id = auth.uid()
  )
);
`.trim();

