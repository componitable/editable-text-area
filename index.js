var emitter = require('emitter');
var editable = require('editable');

module.exports = makeEditable;
function makeEditable(elements, options) {
    options = options || {};
    editable.click(elements, function (element) {
        if (element.getAttribute('data-in-edit-mode') == 'true') return;
        element.setAttribute('data-in-edit-mode', 'true');
        edit(element, options);
    });
}
emitter(makeEditable);

function edit(element, options) {
    var dimensions;
    var oldStyle;
    if (options.maintainSize === true) {
        dimensions = editable.dimensions(element);
    }
    emit('pre-begin-edit', element);
    var value = element.textContent.trim();
    element.innerHTML = '';
    var edit = document.createElement('textarea');
    edit.textContent = value;
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
        element.innerHTML = edit.textContent.trim();
        if (options.maintainSize === true) {
            element.style.width = oldStyle.width;
            element.style.height = oldStyle.height;
        }
        if (value != edit.textContent.trim()) {
            emit('update', element, edit.textContent.trim());
        }
        emit('post-end-edit', element);
    });
    emit('post-begin-edit', element);
}

function emit() {
    module.exports.emit.apply(module.exports, arguments);
    editable.emit.apply(editable, arguments);
}