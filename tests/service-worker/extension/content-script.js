/**
 * Wang Test Environment - Content Script
 * Handles DOM operations requested by Wang code running in service worker
 */

class WangContentScript {
  constructor() {
    this.init();
  }
  
  init() {
    this.setupMessageListener();
    this.injectPageHelpers();
    console.log('[Wang Content Script] Initialized');
  }
  
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });
  }
  
  async handleMessage(message, sender, sendResponse) {
    try {
      const { action, data } = message;
      let result;
      
      switch (action) {
        case 'querySelector':
          result = this.querySelector(data.selector);
          break;
          
        case 'querySelectorAll':
          result = this.querySelectorAll(data.selector);
          break;
          
        case 'click':
          result = this.click(data.selector);
          break;
          
        case 'type':
          result = this.type(data.selector, data.text);
          break;
          
        case 'getValue':
          result = this.getValue(data.selector);
          break;
          
        case 'setValue':
          result = this.setValue(data.selector, data.value);
          break;
          
        case 'getAttribute':
          result = this.getAttribute(data.selector, data.attribute);
          break;
          
        case 'setAttribute':
          result = this.setAttribute(data.selector, data.attribute, data.value);
          break;
          
        case 'getTextContent':
          result = this.getTextContent(data.selector);
          break;
          
        case 'setTextContent':
          result = this.setTextContent(data.selector, data.text);
          break;
          
        case 'addClass':
          result = this.addClass(data.selector, data.className);
          break;
          
        case 'removeClass':
          result = this.removeClass(data.selector, data.className);
          break;
          
        case 'hasClass':
          result = this.hasClass(data.selector, data.className);
          break;
          
        case 'scrollTo':
          result = this.scrollTo(data.selector);
          break;
          
        case 'waitFor':
          result = await this.waitFor(data.selector, data.timeout);
          break;
          
        case 'getPageInfo':
          result = this.getPageInfo();
          break;
          
        case 'executeScript':
          result = this.executeScript(data.code);
          break;
          
        default:
          throw new Error(`Unknown action: ${action}`);
      }
      
      sendResponse({ success: true, result });
      
    } catch (error) {
      console.error('[Wang Content Script] Error:', error);
      sendResponse({ 
        success: false, 
        error: error.message,
        stack: error.stack 
      });
    }
  }
  
  // DOM query methods
  querySelector(selector) {
    const element = document.querySelector(selector);
    return this.serializeElement(element);
  }
  
  querySelectorAll(selector) {
    const elements = Array.from(document.querySelectorAll(selector));
    return elements.map(el => this.serializeElement(el));
  }
  
  // DOM interaction methods
  click(selector) {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);
    
    // Simulate real click
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    const clickEvent = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true
    });
    
    element.dispatchEvent(clickEvent);
    element.click(); // Also trigger programmatic click
    
    return { clicked: true, element: this.serializeElement(element) };
  }
  
  type(selector, text) {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);
    
    element.focus();
    
    // Clear existing value
    element.value = '';
    
    // Simulate typing
    for (const char of text) {
      const keydownEvent = new KeyboardEvent('keydown', {
        key: char,
        bubbles: true,
        cancelable: true
      });
      
      const inputEvent = new InputEvent('input', {
        data: char,
        bubbles: true,
        cancelable: true
      });
      
      element.dispatchEvent(keydownEvent);
      element.value += char;
      element.dispatchEvent(inputEvent);
    }
    
    // Trigger change event
    const changeEvent = new Event('change', { bubbles: true });
    element.dispatchEvent(changeEvent);
    
    return { typed: text, element: this.serializeElement(element) };
  }
  
  getValue(selector) {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);
    
    return element.value || element.textContent || element.innerText;
  }
  
  setValue(selector, value) {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);
    
    if ('value' in element) {
      element.value = value;
    } else {
      element.textContent = value;
    }
    
    // Trigger change event
    const changeEvent = new Event('change', { bubbles: true });
    element.dispatchEvent(changeEvent);
    
    return { set: value, element: this.serializeElement(element) };
  }
  
  getAttribute(selector, attribute) {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);
    
    return element.getAttribute(attribute);
  }
  
  setAttribute(selector, attribute, value) {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);
    
    element.setAttribute(attribute, value);
    return { set: { [attribute]: value }, element: this.serializeElement(element) };
  }
  
  getTextContent(selector) {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);
    
    return element.textContent;
  }
  
  setTextContent(selector, text) {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);
    
    element.textContent = text;
    return { set: text, element: this.serializeElement(element) };
  }
  
  addClass(selector, className) {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);
    
    element.classList.add(className);
    return { added: className, element: this.serializeElement(element) };
  }
  
  removeClass(selector, className) {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);
    
    element.classList.remove(className);
    return { removed: className, element: this.serializeElement(element) };
  }
  
  hasClass(selector, className) {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);
    
    return element.classList.contains(className);
  }
  
  scrollTo(selector) {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);
    
    element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center',
      inline: 'center'
    });
    
    return { scrolled: true, element: this.serializeElement(element) };
  }
  
  // Wait for element to appear
  async waitFor(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const check = () => {
        const element = document.querySelector(selector);
        
        if (element) {
          resolve(this.serializeElement(element));
          return;
        }
        
        if (Date.now() - startTime >= timeout) {
          reject(new Error(`Timeout waiting for element: ${selector} (${timeout}ms)`));
          return;
        }
        
        setTimeout(check, 100);
      };
      
      check();
    });
  }
  
  // Get page information
  getPageInfo() {
    return {
      url: window.location.href,
      title: document.title,
      readyState: document.readyState,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      scroll: {
        x: window.scrollX,
        y: window.scrollY
      },
      elementCounts: {
        total: document.querySelectorAll('*').length,
        visible: document.querySelectorAll('*:not([hidden]):not([style*="display: none"])').length
      }
    };
  }
  
  // Execute arbitrary JavaScript in page context
  executeScript(code) {
    try {
      const result = eval(code);
      return { result, success: true };
    } catch (error) {
      return { error: error.message, success: false };
    }
  }
  
  // Helper method to serialize DOM elements for message passing
  serializeElement(element) {
    if (!element) return null;
    
    return {
      tagName: element.tagName,
      id: element.id,
      className: element.className,
      textContent: element.textContent?.substring(0, 100), // Limit text length
      value: element.value,
      attributes: this.getElementAttributes(element),
      boundingRect: element.getBoundingClientRect(),
      isVisible: this.isElementVisible(element),
      selector: this.generateSelector(element)
    };
  }
  
  getElementAttributes(element) {
    const attrs = {};
    for (const attr of element.attributes) {
      attrs[attr.name] = attr.value;
    }
    return attrs;
  }
  
  isElementVisible(element) {
    const style = window.getComputedStyle(element);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      element.offsetParent !== null
    );
  }
  
  // Generate a unique CSS selector for an element
  generateSelector(element) {
    if (element.id) {
      return `#${element.id}`;
    }
    
    const path = [];
    let current = element;
    
    while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.body) {
      let selector = current.nodeName.toLowerCase();
      
      if (current.className) {
        selector += '.' + current.className.trim().split(/\s+/).join('.');
      }
      
      // Add nth-child if needed for uniqueness
      let sibling = current.parentElement?.querySelector(selector);
      if (sibling !== current) {
        const siblings = Array.from(current.parentElement?.children || [])
          .filter(el => el.nodeName === current.nodeName);
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-child(${index})`;
      }
      
      path.unshift(selector);
      current = current.parentElement;
    }
    
    return path.join(' > ');
  }
  
  // Inject helper functions into page context
  injectPageHelpers() {
    // Create a bridge for page-to-content-script communication
    const script = document.createElement('script');
    script.textContent = `
      // Wang helper functions for page context
      window.WangHelpers = {
        // Trigger custom events for Wang to listen to
        triggerWangEvent: function(type, data) {
          const event = new CustomEvent('wang-event', {
            detail: { type, data }
          });
          document.dispatchEvent(event);
        },
        
        // Send data to Wang service worker
        sendToWang: function(data) {
          this.triggerWangEvent('data', data);
        }
      };
    `;
    document.documentElement.appendChild(script);
    script.remove();
    
    // Listen for custom events from page
    document.addEventListener('wang-event', (event) => {
      const { type, data } = event.detail;
      
      // Forward to service worker
      chrome.runtime.sendMessage({
        type: 'page_event',
        eventType: type,
        data: data
      });
    });
  }
}

// Initialize content script
new WangContentScript();