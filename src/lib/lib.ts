import {
  Codec,
  Either,
  exactly,
  GetType,
  Left,
  number,
  oneOf,
  Right,
  string,
} from "purify-ts";

const Gamemode = oneOf([
  exactly("sprint"),
  exactly("challenge"),
  exactly("stunt"),
]);

export type Gamemode = GetType<typeof Gamemode>;

const Inspection = Codec.interface({
  playerSteamId: string,
  playerName: string,
  gamemode: Gamemode,
  levelName: string,
  rawScore: number,
  category: string,
  inspectedOn: string,
});

export type Inspection = GetType<typeof Inspection>;

export type ParsedLeaderboardName =
  | {
      type: "official";
      levelName: string;
      gamemode: Gamemode;
    }
  | {
      type: "workshop";
      levelName: string;
      gamemode: Gamemode;
      creatorSteamId: string;
    };

export const parseLeaderboardName = (
  leaderboard: string
): Either<string, ParsedLeaderboardName> => {
  const result = leaderboard.match(/^(.+)_(\d+)_([^_]+)$/);
  if (result == null) {
    return Left("Couldn't parse leaderboard name");
  } else {
    const levelName = result[1];

    let gamemode: Gamemode;
    switch (result[2]) {
      case "1":
        gamemode = "sprint";
        break;
      case "2":
        gamemode = "stunt";
        break;
      case "8":
        gamemode = "challenge";
        break;
      default:
        return Left("Unknown gamemode");
    }

    const tail = result[3];
    const justDigits = /^\d+$/.test(tail);
    if (justDigits) {
      return Right({
        type: "workshop",
        levelName,
        gamemode,
        creatorSteamId: tail,
      });
    } else {
      return Right({
        type: "official",
        levelName,
        gamemode,
      });
    }
  }
};

export const capitalizeFirstLetter = (s: string): string =>
  s.charAt(0).toUpperCase() + s.slice(1);

const formatScoreAsTime = (score: number): string => {
  if (score < 0) {
    throw new Error("Negative score");
  }

  if (score != Math.floor(score)) {
    throw new Error("Fractional score");
  }

  const divRem = (a: number, b: number) => [Math.floor(a / b), a % b];

  // `score` is in milliseconds
  const [hours, rem] = divRem(score, 1000 * 60 * 60);
  const [minutes, rem2] = divRem(rem, 1000 * 60);
  const [seconds, rem3] = divRem(rem2, 1000);
  const centiseconds = rem3 / 10;

  const minutesString = String(minutes).padStart(2, "0");
  const secondsString = String(seconds).padStart(2, "0");
  const centisecondsString = String(centiseconds).padStart(2, "0");

  if (hours > 0) {
    const hoursString = String(hours).padStart(2, "0");
    return `${hoursString}:${minutesString}:${secondsString}.${centisecondsString}`;
  } else {
    return `${minutesString}:${secondsString}.${centisecondsString}`;
  }
};

export const formatScore = (score: number, gamemode: Gamemode): string => {
  if (gamemode === "sprint" || gamemode === "challenge") {
    return formatScoreAsTime(score);
  } else {
    return `${score} eV`;
  }
};
