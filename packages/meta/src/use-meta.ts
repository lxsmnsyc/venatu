import { createEffect } from 'solid-js';
import resolveMeta from './resolve-meta';
import { CLOSING_TAG, OPENING_TAG } from './constants';
import { Meta } from './interface';

export default function useMeta(meta: Meta | undefined) {
  createEffect(() => {
    // Get anchor node
    let node = document.head.firstChild;
    let anchor: Node | undefined;

    let begin = false;

    const nodes: Node[] = [];

    while (node) {
      if (node.nodeType === Node.COMMENT_NODE) {
        if ((node as Comment).data === OPENING_TAG) {
          begin = true;
        } else if ((node as Comment).data === CLOSING_TAG) {
          anchor = node;
          break;
        } else {
          nodes.push(node);
        }
      } else if (begin) {
        nodes.push(node);
      }
      node = node.nextSibling;
    }

    for (let i = 0, len = nodes.length; i < len; i += 1) {
      document.head.removeChild(nodes[i]);
    }

    if (anchor && meta) {
      const resolved = resolveMeta(meta);

      for (let i = 0, len = resolved.length; i < len; i += 1) {
        const item = resolved[i];
        const current = document.createElement(item.tag);
        if (item.attributes) {
          for (const [key, value] of Object.entries(item.attributes)) {
            if (typeof value === 'string') {
              current.setAttribute(key, value);
            } else if (value === true || value === false) {
              current.setAttribute(key, value ? 'true' : 'false');
            }
          }
        }
        if (item.content) {
          current.innerText = item.content;
        }
        document.head.insertBefore(current, anchor);
      }
    }
  });
}
