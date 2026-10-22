// Polyfills for React Native Hermes
// This file must be imported first in your app

// Event polyfill for Hermes
if (typeof global.Event === "undefined") {
  global.Event = class Event {
    type: string;
    target: any;
    currentTarget: any;
    eventPhase: number;
    bubbles: boolean;
    cancelable: boolean;
    defaultPrevented: boolean;
    composed: boolean;
    timeStamp: number;
    isTrusted: boolean;

    constructor(type: string, eventInitDict?: any) {
      this.type = type;
      this.target = null;
      this.currentTarget = null;
      this.eventPhase = 0;
      this.bubbles = eventInitDict?.bubbles || false;
      this.cancelable = eventInitDict?.cancelable || false;
      this.defaultPrevented = false;
      this.composed = eventInitDict?.composed || false;
      this.timeStamp = Date.now();
      this.isTrusted = false;
    }

    preventDefault() {
      this.defaultPrevented = true;
    }

    stopPropagation() {}

    stopImmediatePropagation() {}

    initEvent(type: string, bubbles?: boolean, cancelable?: boolean) {
      this.type = type;
      this.bubbles = bubbles || false;
      this.cancelable = cancelable || false;
    }
  };
}

// CustomEvent polyfill
if (typeof global.CustomEvent === "undefined") {
  global.CustomEvent = class CustomEvent extends global.Event {
    detail: any;

    constructor(type: string, eventInitDict?: any) {
      super(type, eventInitDict);
      this.detail = eventInitDict?.detail || null;
    }
  };
}

// EventTarget polyfill
if (typeof global.EventTarget === "undefined") {
  global.EventTarget = class EventTarget {
    listeners: { [key: string]: Function[] } = {};

    addEventListener(type: string, listener: Function) {
      if (!this.listeners[type]) {
        this.listeners[type] = [];
      }
      this.listeners[type].push(listener);
    }

    removeEventListener(type: string, listener: Function) {
      if (this.listeners[type]) {
        this.listeners[type] = this.listeners[type].filter(
          (l) => l !== listener,
        );
      }
    }

    dispatchEvent(event: any) {
      if (this.listeners[event.type]) {
        this.listeners[event.type].forEach((listener) => {
          listener.call(this, event);
        });
      }
      return true;
    }
  };
}

// structuredClone polyfill
if (typeof global.structuredClone === "undefined") {
  global.structuredClone = function structuredClone(obj: any, options?: any) {
    if (obj === null || typeof obj !== "object") {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }

    if (obj instanceof Array) {
      return obj.map((item) => structuredClone(item, options));
    }

    if (typeof obj === "object") {
      const clonedObj: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = structuredClone(obj[key], options);
        }
      }
      return clonedObj;
    }

    return obj;
  };
}
