import type { Config } from "tailwindcss";

export default <Partial<Config>>{
  theme: {
    extend: {
      fontSize: { timer: "10rem", "timer-sm": "6rem" },
      fontFamily: { timer: "Space Mono" },
      colors: {
        polar: {
          "50": "#f1faf9",
          "100": "#dcf2f1",
          "200": "#bce5e4",
          "300": "#8dd3d2",
          "400": "#57b9b9",
          "500": "#3c9d9e",
          "600": "#348186",
          "700": "#30696e",
          "800": "#2e575c",
          "900": "#2a4a4f",
          "950": "#183034",
        },
      },
    },
  },
};
