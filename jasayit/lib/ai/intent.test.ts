import { describe, expect, it } from "vitest";
import { detectIntent } from "./intent";

describe("detectIntent", () => {
  it.each([
    ["Turn into a banana.", "banana"],
    ["Become a potato", "potato"],
    ["become a Ferrari", "car"],
    ["Become a chair.", "chair"],
    ["can you be a kitten?", "cat"],
    ["transform yourself into a rubber duck please", "duck"],
    ["morph into a goldfish", "fish"],
    ["turn into a sneaker", "shoe"],
    ["be a teacup", "cup"],
    ["make yourself a pizza", "pizza"],
    ["become love", "heart"],
    ["turn into an oak tree", "tree"],
    ["you're a robot now", "robot"],
    ["become saturn", "planet"],
    ["turn into a coffee mug", "mug"],
    ["turn into a coffee cup", "mug"],
    ["banana!", "banana"],
  ])("%s → %s", (text, shape) => {
    expect(detectIntent(text)).toEqual({ kind: "transform", shape });
  });

  it.each([
    ["turn into a dragon", "dragon"],
    ["Become a giraffe please", "giraffe"],
    ["can you be a toaster", "toaster"],
  ])("%s is unsupported (%s)", (text, requested) => {
    expect(detectIntent(text)).toEqual({ kind: "unsupported", requested });
  });

  it.each(["turn back", "be yourself", "go back to your original form", "change back please"])("%s reverts", (text) => {
    expect(detectIntent(text)).toEqual({ kind: "revert" });
  });

  it.each(["hello there", "what is the capital of France?", "I love pizza with friends", "can you be serious for once"])(
    "%s is chat",
    (text) => {
      expect(detectIntent(text)).toEqual({ kind: "chat" });
    },
  );
});
