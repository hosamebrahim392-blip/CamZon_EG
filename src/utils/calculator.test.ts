import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getChannelCount,
  calculateQuote,
  calculateStorageDays,
  calculatePowerSupply,
  isValidEgyptianPhone,
  generateWhatsAppQuote,
  isValidEgyptianNationalId,
} from './calculator';
import { CalculatorState } from '../types';

test('getChannelCount returns correct recorder sizes', () => {
  assert.equal(getChannelCount(2), 4);
  assert.equal(getChannelCount(4), 4);
  assert.equal(getChannelCount(5), 8);
  assert.equal(getChannelCount(8), 8);
  assert.equal(getChannelCount(12), 16);
  assert.equal(getChannelCount(16), 16);
  assert.equal(getChannelCount(20), 32);
});

test('calculateQuote computes material cost, technician margin, and total', () => {
  const state: CalculatorState = {
    systemType: 'analog',
    brand: 'hikvision',
    res: '2MP',
    cams: 4,
    cable: 50,
    box: 4,
    hddSize: '1TB',
    rack: false,
    powerSupply: true,
    connectors: true,
    includeLabor: false,
    laborPerCam: 150,
    laborPerMeter: 5,
    mode: 'percent',
    margin: 20, // 20%
    techMode: true,
  };

  const result = calculateQuote(state);

  assert.ok(result.cost > 0, 'Cost should be greater than 0');
  assert.equal(result.channelCount, 4);
  assert.equal(result.profit, Math.round((result.cost * 20) / 100));
  assert.equal(result.total, result.cost + result.profit);
  assert.ok(result.lines.length >= 5, 'Should have cameras, dvr, hdd, cable, box lines');
});

test('calculateQuote computes labor cost when enabled', () => {
  const state: CalculatorState = {
    systemType: 'ip',
    brand: 'dahua',
    res: '5MP',
    cams: 8,
    cable: 100,
    box: 8,
    hddSize: '2TB',
    rack: true,
    powerSupply: true,
    connectors: true,
    includeLabor: true,
    laborPerCam: 200,
    laborPerMeter: 10,
    mode: 'fixed',
    margin: 1500,
    techMode: true,
  };

  const result = calculateQuote(state);

  const expectedLabor = (8 * 200) + (100 * 10);
  assert.equal(result.laborCost, expectedLabor);
  assert.equal(result.profit, 1500);
  assert.equal(result.total, result.cost + 1500 + expectedLabor);
});

test('calculateStorageDays calculates reasonable days for CCTV', () => {
  // 4 cams of 2MP with 1TB HDD and H.265+ codec
  const result = calculateStorageDays(4, '2MP', 1, 'H.265+', 'continuous');
  assert.ok(result.days > 0, 'Days should be positive');
  assert.ok(result.dailyGB > 0, 'Daily GB should be calculated');
  assert.ok(result.recommendation.length > 0, 'Recommendation should be provided');

  // Higher resolution 8MP with same HDD should result in fewer days
  const result8MP = calculateStorageDays(4, '8MP', 1, 'H.265+', 'continuous');
  assert.ok(result8MP.days < result.days, '8MP should store fewer days than 2MP for same HDD capacity');
});

test('calculatePowerSupply suggests safe amps and detects long cable runs', () => {
  const safeRun = calculatePowerSupply(4, 25);
  assert.equal(safeRun.isSafe, true);
  assert.ok(safeRun.recommendedAmps >= 5);

  const longRun = calculatePowerSupply(8, 85);
  assert.equal(longRun.isSafe, false);
  assert.match(longRun.voltageDropNotice, /تحذير/);
});

test('isValidEgyptianPhone validates Egyptian mobile prefixes correctly', () => {
  assert.equal(isValidEgyptianPhone('01012345678'), true); // Vodafone
  assert.equal(isValidEgyptianPhone('01112345678'), true); // Etisalat
  assert.equal(isValidEgyptianPhone('01212345678'), true); // Orange
  assert.equal(isValidEgyptianPhone('01512345678'), true); // WE

  assert.equal(isValidEgyptianPhone('01312345678'), false); // Invalid prefix 013
  assert.equal(isValidEgyptianPhone('0101234567'), false); // Too short
  assert.equal(isValidEgyptianPhone('010123456789'), false); // Too long
  assert.equal(isValidEgyptianPhone('abc01012345678'), false);
});

test('generateWhatsAppQuote formats greeting, items, and total correctly', () => {
  const state: CalculatorState = {
    systemType: 'analog',
    brand: 'hikvision',
    res: '2MP',
    cams: 4,
    cable: 40,
    box: 4,
    hddSize: '1TB',
    rack: false,
    powerSupply: true,
    connectors: true,
    includeLabor: false,
    laborPerCam: 150,
    laborPerMeter: 5,
    mode: 'percent',
    margin: 15,
    techMode: false,
  };

  const quote = calculateQuote(state);
  const text = generateWhatsAppQuote('حسام إبراهيم', state, quote);

  assert.match(text, /حسام إبراهيم/);
  assert.match(text, /Hikvision/);
  assert.match(text, /CamZone-EG/);
  assert.match(text, /جنيه مصري/);
});

test('isValidEgyptianNationalId validates 14 digits, century, and governorate', () => {
  // Valid sample: 29505150101234 -> born 1995-05-15, Cairo (01)
  assert.equal(isValidEgyptianNationalId('29505150101234'), true);
  // Valid sample: 30109282105678 -> born 2001-09-28, Giza (21)
  assert.equal(isValidEgyptianNationalId('30109282105678'), true);

  // Invalid: century digit 1
  assert.equal(isValidEgyptianNationalId('19505150101234'), false);
  // Invalid: month 13
  assert.equal(isValidEgyptianNationalId('29513150101234'), false);
  // Invalid: invalid governorate 99
  assert.equal(isValidEgyptianNationalId('29505159901234'), false);
  // Invalid: 13 digits
  assert.equal(isValidEgyptianNationalId('2950515010123'), false);
  // Invalid: letters
  assert.equal(isValidEgyptianNationalId('2950515010abcd'), false);
});

import { calculateCartTotal, sanitizeSqlInput, INITIAL_SHOP_PRODUCTS } from './calculator';

test('calculateCartTotal calculates subtotal and free shipping properly', () => {
  const item1 = { product: INITIAL_SHOP_PRODUCTS[0], quantity: 2 }; // 550 * 2 = 1100
  const cartResult1 = calculateCartTotal([item1]);
  assert.equal(cartResult1.subtotal, 1100);
  assert.equal(cartResult1.shippingFee, 75); // under 3000
  assert.equal(cartResult1.total, 1175);
  assert.equal(cartResult1.itemCount, 2);

  // Free shipping over 3000
  const item2 = { product: INITIAL_SHOP_PRODUCTS[3], quantity: 2 }; // 2950 * 2 = 5900
  const cartResult2 = calculateCartTotal([item2]);
  assert.equal(cartResult2.subtotal, 5900);
  assert.equal(cartResult2.shippingFee, 0); // free shipping
  assert.equal(cartResult2.total, 5900);
});

test('sanitizeSqlInput cleans malicious SQL injection tokens', () => {
  const dangerous = "admin' OR '1'='1; DROP TABLE orders; --";
  const cleaned = sanitizeSqlInput(dangerous);
  assert.equal(cleaned.includes(';'), false);
  assert.equal(cleaned.includes('--'), false);
  assert.equal(cleaned.includes("''"), true); // escaped
});

