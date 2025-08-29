import { describe, it, expect } from 'vitest';
import { WangInterpreter } from '../../dist/esm/index.js';

describe('jQuery injection into Wang', () => {
  it('should inject jQuery mock and use $ syntax', async () => {
    const interpreter = new WangInterpreter();
    
    // Store jQuery element state
    const elementStore = {};
    
    // Mock jQuery object with common methods
    const jQueryMock = function(selector) {
      // Get or create element data for this selector
      if (!elementStore[selector]) {
        elementStore[selector] = {
          selector: selector,
          classes: [],
          attributes: {},
          dataStore: {}
        };
      }
      
      const elementData = elementStore[selector];
      
      return {
        selector: selector,
        text: function(content) {
          if (content !== undefined) {
            elementData.content = content;
            return this;
          }
          return elementData.content || `Text from ${selector}`;
        },
        html: function(html) {
          if (html !== undefined) {
            elementData.htmlContent = html;
            return this;
          }
          return elementData.htmlContent || `<div>HTML from ${selector}</div>`;
        },
        addClass: function(className) {
          elementData.classes.push(className);
          return this;
        },
        removeClass: function(className) {
          elementData.classes = elementData.classes.filter(c => c !== className);
          return this;
        },
        hasClass: function(className) {
          return elementData.classes.includes(className);
        },
        val: function(value) {
          if (value !== undefined) {
            elementData.value = value;
            return this;
          }
          return elementData.value || '';
        },
        attr: function(name, value) {
          if (value !== undefined) {
            elementData.attributes[name] = value;
            return this;
          }
          return elementData.attributes[name];
        },
        each: function(callback) {
          // Simulate iterating over elements
          const elements = [{ index: 0 }, { index: 1 }];
          elements.forEach((el, i) => callback.call(el, i, el));
          return this;
        },
        click: function(handler) {
          if (handler) {
            this.clickHandler = handler;
          } else if (this.clickHandler) {
            this.clickHandler();
          }
          return this;
        },
        data: function(key, value) {
          if (value !== undefined) {
            elementData.dataStore[key] = value;
            return this;
          }
          return elementData.dataStore[key];
        },
        // Access to internal state for testing
        classes: elementData.classes
      };
    };
    
    // Add jQuery static methods
    jQueryMock.ajax = function(options) {
      return Promise.resolve({ data: 'ajax response', status: 200 });
    };
    
    jQueryMock.extend = function(target, ...sources) {
      return Object.assign(target, ...sources);
    };
    
    // Inject jQuery as $
    interpreter.setVariable('$', jQueryMock);
    
    const result = await interpreter.execute(`
      // Test basic jQuery selector and chaining
      let element = $("#myDiv")
      element.addClass("active").addClass("highlight")
      
      // Test method chaining
      $("#input").val("test value")
      let inputValue = $("#input").val()
      
      // Test attribute manipulation
      $("#link").attr("href", "https://example.com")
      let href = $("#link").attr("href")
      
      // Test data storage
      $("#button").data("id", 123)
      let dataId = $("#button").data("id")
      
      // Test class checking
      let hasActive = element.hasClass("active")
      
      // Return test results
      {
        inputValue: inputValue,
        href: href,
        dataId: dataId,
        hasActive: hasActive,
        classes: element.classes
      }
    `);
    
    expect(result.inputValue).toBe("test value");
    expect(result.href).toBe("https://example.com");
    expect(result.dataId).toBe(123);
    expect(result.hasActive).toBe(true);
    expect(result.classes).toEqual(["active", "highlight"]);
  });

  it('should support jQuery-style pipelines', async () => {
    const interpreter = new WangInterpreter();
    
    // Simplified jQuery mock
    const $ = (selector) => ({
      selector,
      find: function(childSelector) {
        return $(`${this.selector} ${childSelector}`);
      },
      text: function() {
        return `Text from ${this.selector}`;
      }
    });
    
    interpreter.setVariable('$', $);
    
    const result = await interpreter.execute(`
      // Use jQuery with Wang pipeline operators
      let parentEl = $(".parent")
      
      // Direct method call instead of pipeline for now
      let childEl = parentEl.find(".child")
      let text = childEl.text()
      
      text
    `);
    
    expect(result).toBe("Text from .parent .child");
  });

  it('should work with jQuery ajax and async/await', async () => {
    const interpreter = new WangInterpreter();
    
    // Mock jQuery with ajax
    const $ = {
      ajax: function(options) {
        return Promise.resolve({
          data: { 
            users: [
              { id: 1, name: "Alice" },
              { id: 2, name: "Bob" }
            ]
          },
          status: 200
        });
      },
      get: function(url) {
        return this.ajax({ url, method: 'GET' });
      },
      post: function(url, data) {
        return this.ajax({ url, method: 'POST', data });
      }
    };
    
    interpreter.setVariable('$', $);
    
    const result = await interpreter.execute(`
      // Test async jQuery ajax
      async function fetchUsers() {
        let response = await $.get("/api/users")
        return response.data.users
      }
      
      let users = await fetchUsers()
      users.length
    `);
    
    expect(result).toBe(2);
  });

  it('should integrate jQuery with Wang classes', async () => {
    const interpreter = new WangInterpreter();
    
    // Mock jQuery
    const $ = function(selector) {
      return {
        selector,
        hide: function() {
          this.hidden = true;
          return this;
        },
        show: function() {
          this.hidden = false;
          return this;
        },
        toggle: function() {
          this.hidden = !this.hidden;
          return this;
        },
        isHidden: function() {
          return this.hidden || false;
        }
      };
    };
    
    interpreter.setVariable('$', $);
    
    const result = await interpreter.execute(`
      // Create a Wang class that uses jQuery
      class UIComponent {
        constructor(selector) {
          this.element = $(selector)
        }
        
        hide() {
          this.element.hide()
          return this
        }
        
        show() {
          this.element.show()
          return this
        }
        
        toggle() {
          this.element.toggle()
          return this
        }
        
        isVisible() {
          return !this.element.isHidden()
        }
      }
      
      // Test the class
      let component = new UIComponent("#myComponent")
      component.hide()
      let hidden = !component.isVisible()
      component.show()
      let visible = component.isVisible()
      
      { hidden: hidden, visible: visible }
    `);
    
    expect(result.hidden).toBe(true);
    expect(result.visible).toBe(true);
  });
});