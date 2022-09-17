<script context="module" lang="ts">
  import { micromark } from "micromark";
  import { gfm, gfmHtml } from "micromark-extension-gfm";
  import type { Load } from "@sveltejs/kit";

  export const load: Load = async ({ fetch }) => {
    const res = await fetch("info.md");
    const markdown = await res.text();
    const html = micromark(markdown, {
      extensions: [gfm()],
      htmlExtensions: [gfmHtml()],
    });

    return {
      props: {
        html,
      },
    };
  };
</script>

<script lang="ts">
  export let html: string;
</script>

<div class="prose mx-auto px-2 py-4">
  {@html html}
</div>
