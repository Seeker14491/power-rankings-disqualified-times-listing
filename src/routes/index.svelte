<script context="module" lang="ts">
  export const ssr = false;
</script>

<script lang="ts">
  import type { Gamemode, Inspection } from "$lib/lib";
  import dayjs from "dayjs";
  import { queryInspections } from "$lib/query";
  import { capitalizeFirstLetter, formatScore } from "$lib/lib";
  import type { Maybe } from "purify-ts";
  import { Just, Nothing } from "purify-ts";
  import sortBy from "lodash-es/sortBy";

  let gamemode: Gamemode = "sprint";
  let loadingState: "loading" | "finished" | "failed" = "loading";
  let sortOption: "player" | "level" = "player";

  let inspections: Maybe<Inspection[]> = Nothing;
  queryInspections()
    .run()
    .then((x) =>
      x.caseOf({
        Left: () => {
          loadingState = "failed";
          throw new Error("Error fetching inspections");
        },
        Right: (y) => {
          loadingState = "finished";
          inspections = Just(y);
        },
      })
    );

  let inspectionsForGamemode: Maybe<Inspection[]> = Nothing;
  $: {
    inspectionsForGamemode = inspections.map((xs) => {
      const filtered = xs.filter(
        (inspection) => inspection.gamemode === gamemode
      );

      switch (sortOption) {
        case "player":
          return sortBy(filtered, [
            (inspection) => inspection.playerName.toLowerCase(),
            "levelName",
          ]);
        case "level":
          return sortBy(filtered, [
            (inspection) => inspection.levelName.toLowerCase(),
            (inspection) => {
              if (inspection.gamemode === "stunt") {
                return -inspection.rawScore;
              } else {
                return inspection.rawScore;
              }
            },
          ]);
      }
    });
  }

  $: scoreColumnHeader = gamemode === "stunt" ? "Score" : "Time";
</script>

<div class="flex flex-col w-max m-auto py-4">
  <div class="flex justify-between items-end pb-5">
    <h1 class="text-3xl font-bold mr-8">
      Disqualified Entries ({capitalizeFirstLetter(gamemode)})
    </h1>
    <div class="btn-group">
      <button
        on:click={() => (gamemode = "sprint")}
        class:btn-active={gamemode === "sprint"}
        class="btn btn-sm"
      >
        Sprint
      </button>
      <button
        on:click={() => (gamemode = "challenge")}
        class:btn-active={gamemode === "challenge"}
        class="btn btn-sm"
      >
        Challenge
      </button>
      <button
        on:click={() => (gamemode = "stunt")}
        class:btn-active={gamemode === "stunt"}
        class="btn btn-sm"
      >
        Stunt
      </button>
    </div>
  </div>

  <div class="font-semibold">Sort by:</div>
  <div class="form-control max-w-min">
    <label class="cursor-pointer label">
      <span class="label-text pr-4">Player</span>
      <input
        type="radio"
        name="sort-by"
        class="radio radio-primary"
        value="player"
        bind:group={sortOption}
      />
    </label>
    <label class="cursor-pointer label">
      <span class="label-text">Level</span>
      <input
        type="radio"
        name="sort-by"
        class="radio radio-primary"
        value="level"
        bind:group={sortOption}
      />
    </label>
  </div>

  {#if loadingState === "loading"}
    <h2 class="text-xl">Loading...</h2>
  {:else if loadingState === "finished"}
    <table class="table table-compact">
      <thead>
        <tr>
          <th>Player</th>
          <th>Level</th>
          <th>{scoreColumnHeader}</th>
          <th>Reason</th>
          <th>Inspected On</th>
        </tr>
      </thead>
      <tbody>
        {#each inspectionsForGamemode.unsafeCoerce() as { levelName, playerName, playerSteamId, rawScore, category, inspectedOn, gamemode }}
          <tr>
            <td
              ><a
                class="link"
                href="https://steamcommunity.com/profiles/{playerSteamId}"
                >{playerName}</a
              ></td
            >
            <td>{levelName}</td>
            <td>{formatScore(rawScore, gamemode)}</td>
            <td>
              {#if category === "no-wheelieboosting"}
                <div class="badge badge-primary">WB</div>
              {:else if category === "no-cheated-or-invalidated-replay"}
                <div class="badge badge-secondary">cheated or invalidated</div>
              {/if}
            </td>
            <td>{dayjs(inspectedOn).format("YYYY-MM-DD")}</td>
          </tr>
        {/each}
      </tbody>
      <tfoot>
        <tr>
          <th>Player</th>
          <th>Level</th>
          <th>{scoreColumnHeader}</th>
          <th>Reason</th>
          <th>Inspected On</th>
        </tr>
      </tfoot>
    </table>
  {:else}
    <h2 class="text-xl">Failed to load data.</h2>
  {/if}
</div>
