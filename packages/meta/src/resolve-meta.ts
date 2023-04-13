import {
  MetaData,
  Meta,
  OpenGraphImageMeta,
  OpenGraphVideoMeta,
  OpenGraphAudioMeta,
  OpenGraphMeta,
  OpenGraphMediaKeys,
} from './interface';

function resolveOpenGraphItem<Key extends Exclude<keyof OpenGraphMeta, OpenGraphMediaKeys>>(
  result: MetaData[],
  key: Key,
  value: OpenGraphMeta[Key],
) {
  if (value) {
    result.push({
      tag: 'meta',
      attributes: {
        name: `og:${key}`,
        content: value,
      },
    });
  }
}

function resolveOpenGraphMediaItem(
  result: MetaData[],
  type: OpenGraphMediaKeys,
  media: string | OpenGraphImageMeta | OpenGraphVideoMeta | OpenGraphAudioMeta,
) {
  if (typeof media === 'string') {
    result.push({
      tag: 'meta',
      attributes: {
        name: `og:${type}`,
        content: media,
      },
    });
  } else {
    for (const [key, value] of Object.entries(media)) {
      result.push({
        tag: 'meta',
        attributes: {
          name: `og:${type}:${key}`,
          content: value as string,
        },
      });
    }
  }
}

function resolveOpenGraphMedia(result: MetaData[], meta: Meta, type: OpenGraphMediaKeys) {
  const media = meta.openGraph?.[type];
  if (media) {
    if (Array.isArray(media)) {
      for (let i = 0, len = media.length; i < len; i += 1) {
        resolveOpenGraphMediaItem(
          result,
          type,
          media[i],
        );
      }
    } else {
      resolveOpenGraphMediaItem(
        result,
        type,
        media,
      );
    }
  }
}

function resolveOpenGraph(result: MetaData[], meta: Meta) {
  // Open Graph
  resolveOpenGraphItem(result, 'title', meta.openGraph?.title ?? meta.title);
  resolveOpenGraphItem(result, 'type', meta.openGraph?.type);
  resolveOpenGraphItem(result, 'url', meta.openGraph?.url);
  resolveOpenGraphItem(result, 'description', meta.openGraph?.description ?? meta.description);
  resolveOpenGraphItem(result, 'locale', meta.openGraph?.locale);
  resolveOpenGraphItem(result, 'site_name', meta.openGraph?.site_name);

  resolveOpenGraphMedia(result, meta, 'image');
  resolveOpenGraphMedia(result, meta, 'audio');
  resolveOpenGraphMedia(result, meta, 'video');
}

function resolveRobots(result: MetaData[], meta: Meta) {
  if (meta.robots) {
    let flags: string[] = [];

    if (Array.isArray(meta.robots)) {
      flags = meta.robots;
    } else {
      for (const [key, value] of Object.entries(meta.robots)) {
        if (value) {
          flags.push(key);
        }
      }
    }

    result.push({
      tag: 'meta',
      attributes: {
        name: 'robots',
        content: flags.join(', '),
      },
    });
  }
}

export default function resolveMeta(meta: Meta | undefined): MetaData[] {
  let result: MetaData[] = [];

  if (meta) {
    if (meta.viewport) {
      const flags: string[] = [];
      for (const [key, value] of Object.entries(meta.viewport)) {
        flags.push(`${key}=${value as string}`);
      }
      result.push({
        tag: 'meta',
        attributes: {
          name: 'viewport',
          content: flags.join(', '),
        },
      });
    }
    if (meta.title) {
      result.push({ tag: 'title', content: meta.title });
    }
    if (meta.description) {
      result.push({
        tag: 'meta',
        attributes: {
          name: 'description',
          content: meta.description,
        },
      });
    }
    if (meta.themeColor) {
      result.push({
        tag: 'meta',
        attributes: {
          name: 'theme-color',
          content: meta.themeColor,
        },
      });
    }
    if (meta.colorScheme) {
      result.push({
        tag: 'meta',
        attributes: {
          name: 'color-scheme',
          content: meta.colorScheme,
        },
      });
    }

    resolveOpenGraph(result, meta);
    resolveRobots(result, meta);

    if (meta.others) {
      result = result.concat(meta.others);
    }
  }

  return result;
}
