# jQuery Integration with Wang Language

Wang Language fully supports jQuery injection, allowing you to use jQuery's powerful DOM manipulation and traversal features within Wang scripts.

## How jQuery Injection Works

Wang provides two main ways to inject external JavaScript libraries like jQuery:

1. **Via `setVariable()` method**: Inject the jQuery object as a variable (typically `$`)
2. **Via `functions` option**: Add jQuery methods as individual functions

## Injection Methods

### Method 1: Direct jQuery Object Injection (Recommended)

```javascript
import { WangInterpreter } from 'wang-lang';

const interpreter = new WangInterpreter();

// Inject the entire jQuery object
interpreter.setVariable('$', jQuery);  // or window.$ if jQuery is global
interpreter.setVariable('jQuery', jQuery);  // Optional: both $ and jQuery

// Now use jQuery in Wang code
await interpreter.execute(`
  $("#myDiv").addClass("active")
  $(".buttons").on("click", function() {
    $(this).toggleClass("clicked")
  })
`);
```

### Method 2: Individual Method Injection

```javascript
const interpreter = new WangInterpreter({
  functions: {
    // Inject specific jQuery functionality
    $: (selector) => $(selector),
    jQuery: (selector) => jQuery(selector),
    ajax: (options) => $.ajax(options)
  }
});
```

## Browser Environment

### Loading jQuery from CDN

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
  <script type="module">
    import { WangInterpreter } from './dist/wang.min.js';
    
    // Wait for jQuery to load
    $(document).ready(async function() {
      const interpreter = new WangInterpreter();
      
      // Inject jQuery and window/document objects
      interpreter.setVariable('$', $);
      interpreter.setVariable('window', window);
      interpreter.setVariable('document', document);
      
      // Execute Wang code with jQuery
      await interpreter.execute(`
        // jQuery is now available in Wang!
        $("body").append("<div id='wang-content'>Hello from Wang!</div>")
        $("#wang-content").fadeIn(1000)
      `);
    });
  </script>
</head>
<body>
  <h1>Wang + jQuery Integration</h1>
</body>
</html>
```

## Node.js Environment

```javascript
import { JSDOM } from 'jsdom';
import jquery from 'jquery';
import { WangInterpreter } from 'wang-lang';

// Create DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
const { window } = dom;

// Initialize jQuery with the DOM
const $ = jquery(window);

// Create interpreter
const interpreter = new WangInterpreter();

// Inject jQuery and DOM objects
interpreter.setVariable('$', $);
interpreter.setVariable('document', window.document);
interpreter.setVariable('window', window);

// Use jQuery in Wang
await interpreter.execute(`
  $("body").html("<h1>Server-side jQuery!</h1>")
`);
```

## Working with jQuery in Wang

### Basic DOM Manipulation

```javascript
// Inject jQuery
interpreter.setVariable('$', $);

await interpreter.execute(`
  // Selecting elements
  let header = $("#header")
  let buttons = $(".btn")
  
  // Modifying elements
  header.text("New Header Text")
  buttons.addClass("primary")
  
  // Creating elements
  let newDiv = $("<div>").attr("id", "dynamic")
  newDiv.html("<p>Dynamic content</p>")
  newDiv.appendTo("body")
  
  // Chaining
  $("#content")
    .addClass("container")
    .css("padding", "20px")
    .fadeIn(500)
`);
```

### Event Handling

```javascript
await interpreter.execute(`
  // Click events
  $("#submit-btn").on("click", function() {
    let formData = $("#myForm").serialize()
    console.log("Form submitted:", formData)
  })
  
  // Delegated events
  $(document).on("click", ".dynamic-btn", function() {
    $(this).toggleClass("active")
  })
  
  // Multiple events
  $("input").on({
    focus: function() { $(this).addClass("focused") },
    blur: function() { $(this).removeClass("focused") }
  })
`);
```

### AJAX with jQuery

```javascript
await interpreter.execute(`
  // GET request
  $.get("/api/users", function(data) {
    data.forEach(user => {
      $("#users").append("<li>" + user.name + "</li>")
    })
  })
  
  // POST with async/await
  async function saveData() {
    try {
      let response = await $.ajax({
        url: "/api/save",
        method: "POST",
        data: { name: "John", age: 30 },
        dataType: "json"
      })
      console.log("Saved:", response)
    } catch(error) {
      console.error("Error:", error)
    }
  }
  
  await saveData()
`);
```

### jQuery with Wang Pipelines

```javascript
await interpreter.execute(`
  // jQuery objects work with Wang's pipeline operators
  let elements = $(".item")
  
  // Filter and manipulate
  elements
    |> filter(_, function() { return $(this).data("active") })
    |> each(_, function() { $(this).addClass("highlighted") })
  
  // Extract data
  let texts = $(".title")
    |> map(_, function() { return $(this).text() })
    |> toArray(_)
`);
```

## Advanced Patterns

### jQuery Plugins

```javascript
// If you have jQuery plugins loaded
interpreter.setVariable('$', $);

await interpreter.execute(`
  // Use jQuery plugins
  $("#datepicker").datepicker({
    dateFormat: "yy-mm-dd",
    onSelect: function(date) {
      console.log("Selected:", date)
    }
  })
  
  // Custom plugin methods
  $(".carousel").slick({
    autoplay: true,
    dots: true
  })
`);
```

### Combining with Wang Classes

```javascript
await interpreter.execute(`
  class DOMManager {
    constructor(selector) {
      this.element = $(selector)
    }
    
    show() {
      this.element.fadeIn()
      return this
    }
    
    hide() {
      this.element.fadeOut()
      return this
    }
    
    update(content) {
      this.element.html(content)
      return this
    }
  }
  
  let manager = new DOMManager("#content")
  manager.update("<h2>Updated!</h2>").show()
`);
```

### Web Scraping Pattern

```javascript
await interpreter.execute(`
  // Scrape data from a page
  class LinkedInScraper {
    async scrapeProfiles() {
      let profiles = []
      
      $(".profile-card").each(function() {
        let $card = $(this)
        profiles.push({
          name: $card.find(".name").text().trim(),
          title: $card.find(".title").text().trim(),
          company: $card.find(".company").text().trim(),
          link: $card.find("a.profile-link").attr("href")
        })
      })
      
      return profiles
    }
    
    async clickLoadMore() {
      let $button = $("button.load-more")
      if ($button.length > 0) {
        $button.click()
        // Wait for content to load
        await new Promise(resolve => setTimeout(resolve, 2000))
        return true
      }
      return false
    }
  }
  
  let scraper = new LinkedInScraper()
  let allProfiles = []
  
  // Scrape with pagination
  do {
    let profiles = await scraper.scrapeProfiles()
    allProfiles = allProfiles.concat(profiles)
  } while (await scraper.clickLoadMore())
  
  console.log("Total profiles:", allProfiles.length)
`);
```

## Best Practices

1. **Always inject jQuery before executing Wang code** that depends on it
2. **Include window and document** when working in Node.js environments
3. **Use `$(document).ready()`** or ensure DOM is loaded in browser environments
4. **Handle jQuery promises** with async/await for cleaner code
5. **Test for jQuery availability** before using it:

```javascript
await interpreter.execute(`
  if (typeof $ !== "undefined") {
    // jQuery is available
    $("#app").html("jQuery loaded!")
  } else {
    console.error("jQuery not found!")
  }
`);
```

## Common Issues and Solutions

### Issue: $ is not defined
**Solution**: Ensure jQuery is injected before executing Wang code
```javascript
interpreter.setVariable('$', jQuery);
```

### Issue: jQuery methods return undefined
**Solution**: jQuery might not be fully loaded. Wait for it:
```javascript
$(document).ready(function() {
  interpreter.setVariable('$', $);
  // Now execute Wang code
});
```

### Issue: DOM elements not found
**Solution**: Ensure DOM is ready or elements exist:
```javascript
await interpreter.execute(`
  // Wait for element to exist
  function waitForElement(selector) {
    return new Promise(resolve => {
      let check = setInterval(() => {
        if ($(selector).length > 0) {
          clearInterval(check)
          resolve($(selector))
        }
      }, 100)
    })
  }
  
  let element = await waitForElement("#dynamic-content")
  element.addClass("ready")
`);
```

## Performance Considerations

1. **Minimize jQuery object creation** - cache selectors:
```javascript
await interpreter.execute(`
  let $container = $("#container")  // Cache it
  $container.find(".item").each(...)
  $container.addClass("processed")
`);
```

2. **Use event delegation** for dynamic content:
```javascript
await interpreter.execute(`
  $(document).on("click", ".dynamic-button", handler)
`);
```

3. **Batch DOM operations**:
```javascript
await interpreter.execute(`
  let html = ""
  data.forEach(item => {
    html += "<li>" + item.name + "</li>"
  })
  $("#list").html(html)  // Single DOM update
`);
```