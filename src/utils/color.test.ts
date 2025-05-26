import { describe, it, expect } from 'vitest';
import { rgbToHex } from './color';

describe('rgbToHex', () => {
	it('should handle string input and return it unchanged', () => {
		expect(rgbToHex('rgba(255, 0, 0, 0.5)')).toBe('rgba(255, 0, 0, 0.5)');
		expect(rgbToHex('#ff0000')).toBe('#ff0000');
		expect(rgbToHex('red')).toBe('red');
	});

	it('should return null for null input', () => {
		expect(rgbToHex(null)).toBeNull();
	});

	it('should return null for undefined input', () => {
		expect(rgbToHex(undefined)).toBeNull();
	});

	it('should return null for non-object input', () => {
		expect(rgbToHex(123)).toBeNull();
		expect(rgbToHex(true)).toBeNull();
		expect(rgbToHex([])).toBeNull();
	});

	it('should return null for objects without r, g, b properties', () => {
		expect(rgbToHex({})).toBeNull();
		expect(rgbToHex({ r: 1 })).toBeNull();
		expect(rgbToHex({ r: 1, g: 1 })).toBeNull();
		expect(rgbToHex({ r: 'red', g: 1, b: 1 })).toBeNull();
	});

	it('should return null for objects with non-number r, g, b values', () => {
		expect(rgbToHex({ r: 'red', g: 0, b: 0 })).toBeNull();
		expect(rgbToHex({ r: 0, g: 'green', b: 0 })).toBeNull();
		expect(rgbToHex({ r: 0, g: 0, b: 'blue' })).toBeNull();
	});

	it('should return null for objects with NaN values', () => {
		expect(rgbToHex({ r: NaN, g: 0, b: 0 })).toBeNull();
		expect(rgbToHex({ r: 0, g: NaN, b: 0 })).toBeNull();
		expect(rgbToHex({ r: 0, g: 0, b: NaN })).toBeNull();
	});

	it('should convert RGB to hex format', () => {
		expect(rgbToHex({ r: 1, g: 0, b: 0 })).toBe('#ff0000');
		expect(rgbToHex({ r: 0, g: 1, b: 0 })).toBe('#00ff00');
		expect(rgbToHex({ r: 0, g: 0, b: 1 })).toBe('#0000ff');
		expect(rgbToHex({ r: 1, g: 1, b: 1 })).toBe('#ffffff');
		expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
	});

	it('should handle fractional RGB values', () => {
		expect(rgbToHex({ r: 0.5, g: 0.5, b: 0.5 })).toBe('#808080');
		expect(rgbToHex({ r: 0.2, g: 0.4, b: 0.6 })).toBe('#336699');
	});

	it('should clamp RGB values to 0-1 range', () => {
		expect(rgbToHex({ r: 2, g: 0, b: 0 })).toBe('#ff0000');
		expect(rgbToHex({ r: -1, g: 0, b: 0 })).toBe('#000000');
		expect(rgbToHex({ r: 1.5, g: -0.5, b: 2.5 })).toBe('#ff00ff');
	});

	it('should handle alpha values and return rgba format', () => {
		expect(rgbToHex({ r: 1, g: 0, b: 0, a: 0.5 })).toBe('rgba(255, 0, 0, 0.5000)');
		expect(rgbToHex({ r: 0, g: 1, b: 0, a: 0.8 })).toBe('rgba(0, 255, 0, 0.8000)');
		expect(rgbToHex({ r: 0.5, g: 0.5, b: 0.5, a: 0.25 })).toBe('rgba(128, 128, 128, 0.2500)');
	});

	it('should treat alpha = 1 as fully opaque and return hex format', () => {
		expect(rgbToHex({ r: 1, g: 0, b: 0, a: 1 })).toBe('#ff0000');
		expect(rgbToHex({ r: 0, g: 1, b: 0, a: 1.0 })).toBe('#00ff00');
	});

	it('should handle missing alpha property (defaults to 1)', () => {
		expect(rgbToHex({ r: 1, g: 0, b: 0 })).toBe('#ff0000');
	});

	it('should handle non-number alpha values (defaults to 1)', () => {
		expect(rgbToHex({ r: 1, g: 0, b: 0, a: 'invalid' })).toBe('#ff0000');
		expect(rgbToHex({ r: 1, g: 0, b: 0, a: null })).toBe('#ff0000');
		expect(rgbToHex({ r: 1, g: 0, b: 0, a: undefined })).toBe('#ff0000');
	});

	it('should clamp alpha RGB values for rgba output', () => {
		expect(rgbToHex({ r: 2, g: -1, b: 0.5, a: 0.5 })).toBe('rgba(255, 0, 128, 0.5000)');
	});

	it('should handle zero values correctly', () => {
		expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
		expect(rgbToHex({ r: 0, g: 0, b: 0, a: 0 })).toBe('rgba(0, 0, 0, 0.0000)');
	});

	it('should handle edge case values that result in single-digit hex', () => {
		// Values that would result in hex values < 16 (single digit)
		expect(rgbToHex({ r: 0.03, g: 0.06, b: 0.09 })).toBe('#080f17'); // Should pad with leading zeros
	});
}); 