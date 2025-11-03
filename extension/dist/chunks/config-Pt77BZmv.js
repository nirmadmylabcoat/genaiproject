const DEFAULT_PROFILE = {
  id: "high-contrast",
  label: "High Contrast",
  description: "Increases contrast and font sizes for low-vision support.",
  preferences: {
    fontScale: 1.3,
    contrast: "high",
    lineSpacing: 1.4,
    dyslexiaFont: false,
    reduceMotion: true,
    focusMode: "guided"
  },
  generativeHints: {
    contrast_ratio: 0.9,
    whitespace_bias: 0.6
  }
};
const DEFAULT_PROFILES = [
  DEFAULT_PROFILE,
  {
    id: "dyslexia-friendly",
    label: "Dyslexia Friendly",
    description: "Applies dyslexia-friendly typefaces and spacing.",
    preferences: {
      fontScale: 1.2,
      contrast: "default",
      lineSpacing: 1.6,
      dyslexiaFont: true,
      reduceMotion: true,
      focusMode: "off"
    },
    generativeHints: {
      font_family: 0.8,
      line_height: 0.7
    }
  },
  {
    id: "adhd-focus",
    label: "ADHD Focus",
    description: "Reduces distractions and guides sequential focus.",
    preferences: {
      fontScale: 1,
      contrast: "default",
      lineSpacing: 1.3,
      dyslexiaFont: false,
      reduceMotion: false,
      focusMode: "high"
    },
    generativeHints: {
      focus_path: 0.9,
      collapse_density: 0.8
    }
  }
];
const DEFAULT_RUNTIME_STATE = {
  backend: {
    baseUrl: "http://localhost:8000/api"
  },
  activeProfile: DEFAULT_PROFILE,
  enabled: true,
  mode: "generative"
};
export {
  DEFAULT_PROFILES as D,
  DEFAULT_RUNTIME_STATE as a
};
//# sourceMappingURL=config-Pt77BZmv.js.map
