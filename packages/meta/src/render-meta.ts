import {
  BOOLEAN_ATTRS,
  CLOSING_TAG,
  OPENING_TAG,
  VOID_ELEMENTS,
} from './constants';
import { Meta, MetaData } from './interface';
import resolveMeta from './resolve-meta';

// https://github.com/ryansolid/dom-expressions/blob/main/packages/dom-expressions/src/server.js#L332-L384
export function escape(s: string, attr: boolean): string {
  const delim = attr ? '"' : '<';
  const escDelim = attr ? '&quot;' : '&lt;';
  let iDelim = s.indexOf(delim);
  let iAmp = s.indexOf('&');

  if (iDelim < 0 && iAmp < 0) return s;

  let left = 0;
  let out = '';

  while (iDelim >= 0 && iAmp >= 0) {
    if (iDelim < iAmp) {
      if (left < iDelim) out += s.substring(left, iDelim);
      out += escDelim;
      left = iDelim + 1;
      iDelim = s.indexOf(delim, left);
    } else {
      if (left < iAmp) out += s.substring(left, iAmp);
      out += '&amp;';
      left = iAmp + 1;
      iAmp = s.indexOf('&', left);
    }
  }

  if (iDelim >= 0) {
    do {
      if (left < iDelim) out += s.substring(left, iDelim);
      out += escDelim;
      left = iDelim + 1;
      iDelim = s.indexOf(delim, left);
    } while (iDelim >= 0);
  } else {
    while (iAmp >= 0) {
      if (left < iAmp) out += s.substring(left, iAmp);
      out += '&amp;';
      left = iAmp + 1;
      iAmp = s.indexOf('&', left);
    }
  }

  return left < s.length ? out + s.substring(left) : out;
}

function renderToString(el: MetaData) {
  let result = `<${el.tag} `;

  if (el.attributes) {
    for (const [key, value] of Object.entries(el.attributes)) {
      if (BOOLEAN_ATTRS.has(key) && value) {
        result += key;
      } else if (value === undefined) {
        // skip
      } else if (value === true || value === false) {
        result += `${key}="${String(value)}"`;
      } else {
        result += `${key}="${escape(value, true)}"`;
      }
    }
  }

  if (VOID_ELEMENTS.test(el.tag)) {
    return `${result}/>`;
  }
  return `${result}>${el.content || ''}</${el.tag}>`;
}

export default function renderMeta(result: Meta | undefined) {
  let html = `<!--${OPENING_TAG}-->`;
  if (result) {
    const resolved = resolveMeta(result);
    for (let i = 0, len = resolved.length; i < len; i += 1) {
      html += renderToString(resolved[i]);
    }
  }
  html += `<!--${CLOSING_TAG}-->`;

  return html;
}
