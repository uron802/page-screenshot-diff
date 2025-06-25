import { jest } from '@jest/globals';

export const goto = jest.fn();
export const click = jest.fn();
export const type = jest.fn();
export const evaluate = jest.fn();
export const waitForNavigation = jest.fn();
export const screenshot = jest.fn();
export const waitForTimeout = jest.fn();

export const page = {
  goto,
  click,
  type,
  evaluate,
  waitForNavigation,
  screenshot,
  waitForTimeout
};

export const newPage = jest.fn(async () => page);
export const close = jest.fn();
export const browser = { newPage, close };
export const launch = jest.fn(async () => browser);
export const connect = jest.fn(async () => browser);

export default { launch, connect };
