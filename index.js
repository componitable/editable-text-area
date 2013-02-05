var emitter = require('emitter');
var editable = require('editable');
var toArray = require('to-element-array');
var matches = require('matches-selector');

module.exports = makeEditable;
function makeEditable(elements, options) {
  options = options || {};
  editable.click(typeof elements === 'string' ? (elements + ' *, ' + elements) : elements, function (element) {
    if (typeof elements === 'string') {
      while (!matches(element, elements) && element.parentNode && element != element.parentNode) {
        element = element.parentNode;
      }
    }
    if (element.getAttribute('data-in-edit-mode') == 'true') return;
    element.setAttribute('data-in-edit-mode', 'true');
    edit(element, options);
  });
  setInterval(fixElements, 500);
  fixElements();
  function fixElements() {
    var els = toArray(elements);
    for (var i = 0; i < els.length; i++) {
      if (els[i].getElementsByTagName('input').length === 0 && !els[i].hasAttribute('data-real-text')) {
        fixElement(els[i], els[i].innerHTML.replace(/<\/p>[\s ]*<p>/g, '\n\n').replace(/<\/?p>/g, ''));
      }
    }
  }
}
emitter(makeEditable);

function fixElement(el, content) {
  var normalized = content.trim().replace(/\r?\n/g, '\n\n').replace(/\n\n\n+/g, '\n\n');
  el.setAttribute('data-real-text', normalized);
  el.innerHTML = '<p>' + normalized.replace(/\n\n/g, '</p><p>') + '</p>';
  return normalized;
}



function edit(element, options) {
  var dimensions;
  var oldStyle;
  if (options.maintainSize === true) {
    dimensions = editable.dimensions(element);
  }
  emit('pre-begin-edit', element);
  var value = element.getAttribute('data-real-text') || fixElement(element, element.textContent);
  element.innerHTML = '';
  var edit = document.createElement('textarea');
  edit.value = value;
  element.appendChild(edit);
  if (options.maintainSize === true) {
    var editDimensions = editable.transformDimensions(edit, dimensions);
    edit.style.width = editDimensions.width + 'px';
    edit.style.height = editDimensions.height + 'px';
    oldStyle = {width: element.style.width, height: element.style.height};
    element.style.width = dimensions.width + 'px';
    element.style.height = dimensions.height + 'px';
  }
  edit.focus();
  editable.blur(edit, function () {
    if (element.getAttribute('data-in-edit-mode') != 'true') return;
    element.setAttribute('data-in-edit-mode', 'false');
    emit('pre-end-edit', element);
    var result = fixElement(element, edit.value.trim());
    if (options.maintainSize === true) {
      element.style.width = oldStyle.width;
      element.style.height = oldStyle.height;
    }
    if (value != result) {
      emit('update', element, result);
    }
    emit('post-end-edit', element);
  });
  emit('post-begin-edit', element);
}

function emit() {
  module.exports.emit.apply(module.exports, arguments);
  editable.emit.apply(editable, arguments);
}
