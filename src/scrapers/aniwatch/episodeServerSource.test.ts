import { describe, expect, it } from "vitest";

import { ensureVidSrcEmbedHost } from "./episodeServerSource";

describe("ensureVidSrcEmbedHost", () => {
  it("normalizes vidsrc urls to vidsrc-embed.su with https", () => {
    const original = new URL("http://vidsrc.to/embed/abc?ep=1");

    const normalized = ensureVidSrcEmbedHost(original);

    expect(normalized.hostname).toBe("vidsrc-embed.su");
    expect(normalized.protocol).toBe("https:");
    expect(normalized.pathname).toBe("/embed/abc");
    expect(normalized.search).toBe("?ep=1");
    expect(original.hostname).toBe("vidsrc.to");
  });

  it("keeps the same url instance when already normalized", () => {
    const alreadyNormalized = new URL("https://vidsrc-embed.su/embed/xyz");

    const normalized = ensureVidSrcEmbedHost(alreadyNormalized);

    expect(normalized).toBe(alreadyNormalized);
  });
});
