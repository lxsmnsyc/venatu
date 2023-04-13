// https://github.com/ryansolid/dom-expressions/blob/main/packages/lit-dom-expressions/src/index.ts#L35
export const VOID_ELEMENTS = /^(?:area|base|br|col|embed|hr|img|input|keygen|link|menuitem|meta|param|source|track|wbr)$/i;

// https://github.com/ryansolid/dom-expressions/blob/main/packages/dom-expressions/src/constants.js#L1-L26
export const BOOLEAN_ATTRS = new Set([
  'allowfullscreen',
  'async',
  'autofocus',
  'autoplay',
  'checked',
  'controls',
  'default',
  'disabled',
  'formnovalidate',
  'hidden',
  'indeterminate',
  'ismap',
  'loop',
  'multiple',
  'muted',
  'nomodule',
  'novalidate',
  'open',
  'playsinline',
  'readonly',
  'required',
  'reversed',
  'seamless',
  'selected',
]);

export const OPENING_TAG = 'meta:start';
export const CLOSING_TAG = 'meta:close';
