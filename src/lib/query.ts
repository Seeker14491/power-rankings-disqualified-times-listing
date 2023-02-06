import {
  array,
  Codec,
  Either,
  EitherAsync,
  GetType,
  nullable,
  number,
  string,
} from "purify-ts";
import request, { gql } from "graphql-request";
import type { Inspection } from "$lib/lib";
import { parseLeaderboardName } from "$lib/lib";

const endpoint = "https://distance-db-hasura.seekr.pw/v1/graphql";

export const queryInspections = (): EitherAsync<unknown, Inspection[]> =>
  EitherAsync(async ({ fromPromise }) => {
    const rawInspections = await fromPromise(queryInspectionsRaw());

    return rawInspections.map((inspection) => {
      const playerName = inspection?.player?.name ?? "[unknown]";
      const parsedLeaderboard = parseLeaderboardName(
        inspection.leaderboard.name
      ).unsafeCoerce(); // FIXME

      return {
        playerSteamId: inspection.player_steam_id,
        playerName: playerName,
        gamemode: parsedLeaderboard.gamemode,
        levelName: parsedLeaderboard.levelName,
        rawScore: inspection.score,
        category: inspection.category.name,
        inspectedOn: inspection.inspected_on,
      };
    });
  });

const RawInspection = Codec.interface({
  leaderboard: Codec.interface({
    name: string,
  }),
  player_steam_id: string,
  player: nullable(
    Codec.interface({
      name: string,
    })
  ),
  score: number,
  category: Codec.interface({
    name: string,
  }),
  inspected_on: string,
});

type RawInspection = GetType<typeof RawInspection>;

const InspectionsResponse = Codec.interface({
  lf_inspections: array(RawInspection),
});

const queryInspectionsRaw = async (): Promise<
  Either<unknown, RawInspection[]>
> => {
  const query = gql`
    {
      lf_inspections(where: { is_legal: { _eq: false } }) {
        leaderboard {
          name
        }
        player_steam_id
        player {
          name
        }
        score
        category {
          name
        }
        inspected_on
      }
    }
  `;

  return (await EitherAsync(() => request(endpoint, query)))
    .chain(InspectionsResponse.decode)
    .map((data) => data.lf_inspections);
};
