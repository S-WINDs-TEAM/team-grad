// FleetManagerRegistration.styles.js
// Style tokens are exported as a single JS object (per project convention),
// colocated with the component in the same folder. Responsive behavior is
// handled by merging in breakpoint-specific partials (see the *Tablet /
// *Mobile keys) from the component, rather than via a separate stylesheet.

const colors = {
  bgDeep: "#080b14",
  bgPanel: "rgba(15, 20, 34, 0.72)",
  bgInput: "rgba(255, 255, 255, 0.03)",
  border: "rgba(255, 255, 255, 0.08)",
  borderStrong: "rgba(255, 255, 255, 0.14)",
  accent: "#3b82f6",
  accentDim: "rgba(59, 130, 246, 0.16)",
  accentBright: "#60a5fa",
  textPrimary: "#f5f7fb",
  textSecondary: "#8b93a7",
  textMuted: "#5b6478",
};

// A simple truck + skyline illustration, used as a CSS background-image
// (not an absolutely-positioned element) on the hero panel, the same way
// a photograph would sit behind the panel's content in the original design.
const truckSceneSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="500" viewBox="0 0 900 500">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0d1526"/>
      <stop offset="1" stop-color="#060911"/>
    </linearGradient>
    <linearGradient id="glow" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#3b82f6" stop-opacity="0"/>
      <stop offset="0.5" stop-color="#3b82f6" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#3b82f6" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="900" height="500" fill="url(#sky)"/>
  <g opacity="0.5" fill="#111a2b">
    <rect x="30" y="300" width="40" height="150"/>
    <rect x="80" y="260" width="30" height="190"/>
    <rect x="120" y="320" width="50" height="130"/>
    <rect x="700" y="280" width="35" height="170"/>
    <rect x="745" y="240" width="28" height="210"/>
    <rect x="785" y="310" width="45" height="140"/>
    <rect x="840" y="270" width="30" height="180"/>
  </g>
  <rect x="0" y="446" width="900" height="6" fill="#161d2c"/>
  <rect x="0" y="420" width="900" height="26" fill="url(#glow)"/>
  <g>
    <rect x="140" y="240" width="420" height="170" rx="8" fill="#0e1420" stroke="#1b2536" stroke-width="2"/>
    <rect x="140" y="240" width="420" height="170" rx="8" fill="none" stroke="#3b82f6" stroke-opacity="0.18" stroke-width="2"/>
    <text x="175" y="335" font-family="Arial, sans-serif" font-size="46" font-weight="800" fill="#60a5fa">S</text>
    <text x="225" y="335" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#e7ebf3">S-WINDs</text>
  </g>
  <g>
    <path d="M560 280 h100 a22 22 0 0 1 21 16 l20 62 a16 16 0 0 1 -16 20 h-125 z" fill="#141b29" stroke="#1b2536" stroke-width="2"/>
    <rect x="592" y="304" width="56" height="36" rx="4" fill="#080b12" stroke="#3b82f6" stroke-opacity="0.35" stroke-width="2"/>
    <circle cx="695" cy="368" r="14" fill="#60a5fa" opacity="0.9"/>
    <circle cx="695" cy="368" r="30" fill="#60a5fa" opacity="0.16"/>
  </g>
  <g fill="#04060a" stroke="#1b2536" stroke-width="2">
    <circle cx="205" cy="412" r="24"/>
    <circle cx="300" cy="412" r="24"/>
    <circle cx="500" cy="412" r="24"/>
    <circle cx="655" cy="412" r="24"/>
  </g>
</svg>
`.trim();

const truckSceneDataUri = `url("data:image/svg+xml,${encodeURIComponent(
  truckSceneSvg,
)}")`;

const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    background: colors.bgDeep,
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: colors.textPrimary,
  },

  main: {
    flex: 1,
    display: "flex",
    alignItems: "stretch",
    justifyContent: "center",
    padding: "40px 48px 24px",
    gap: "56px",
    boxSizing: "border-box",
  },
  mainTablet: {
    gap: "28px",
    padding: "28px 24px 20px",
  },
  mainMobile: {
    flexDirection: "column",
    padding: "20px 16px 16px",
    gap: "16px",
    alignItems: "center",
  },

  // ---------- LEFT / HERO PANEL ----------
  // Truck illustration lives here as a real CSS background-image (layered
  // with the gradient) rather than an absolutely-positioned child element.
  heroPanel: {
    position: "relative",
    flex: "1 1 46%",
    maxWidth: "620px",
    borderRadius: "20px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "40px 44px",
    boxSizing: "border-box",
    backgroundColor: "#0a0f1c",
    backgroundImage: `radial-gradient(120% 90% at 15% 0%, rgba(19,28,51,0.9) 0%, rgba(10,15,28,0.55) 45%, rgba(6,9,17,0.35) 100%), ${truckSceneDataUri}`,
    backgroundRepeat: "no-repeat, no-repeat",
    backgroundPosition: "center, center center",
    backgroundSize: "contain",
    isolation: "isolate",
  },
  heroPanelTablet: {
    maxWidth: "380px",
    padding: "30px 26px",
  },

  heroNetworkLayer: {
    position: "absolute",
    inset: 0,
    opacity: 0.5,
    zIndex: 0,
    pointerEvents: "none",
  },

  logoRow: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  logoMark: {
    width: "40px",
    height: "40px",
    flexShrink: 0,
  },

  logoText: {
    fontSize: "22px",
    fontWeight: 800,
    letterSpacing: "0.5px",
    color: colors.textPrimary,
  },

  heroCopy: {
    position: "relative",
    zIndex: 2,
    marginTop: "48px",
  },

  heroHeading: {
    fontSize: "40px",
    lineHeight: 1.1,
    fontWeight: 800,
    margin: 0,
    letterSpacing: "-0.5px",
  },
  heroHeadingTablet: {
    fontSize: "30px",
  },

  heroHeadingAccent: {
    display: "block",
    background: `linear-gradient(90deg, ${colors.accentBright}, ${colors.accent})`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  },

  heroDivider: {
    width: "64px",
    height: "4px",
    borderRadius: "2px",
    background: colors.accent,
    margin: "20px 0 22px",
  },

  heroSubtext: {
    fontSize: "16px",
    lineHeight: 1.6,
    color: colors.textSecondary,
    maxWidth: "400px",
    margin: 0,
  },
  heroSubtextTablet: {
    fontSize: "14px",
    maxWidth: "300px",
  },

  secureCard: {
    position: "relative",
    zIndex: 2,
    marginTop: "36px",
    background: "rgba(6, 9, 16, 0.72)",
    border: `1px solid ${colors.border}`,
    borderRadius: "16px",
    padding: "22px 24px",
    backdropFilter: "blur(6px)",
  },
  secureCardTablet: {
    padding: "16px 18px",
    marginTop: "24px",
  },

  secureCardTop: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
  },

  secureIconWrap: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    background: colors.accentDim,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    color: colors.accentBright,
  },

  secureTitle: {
    fontSize: "15px",
    fontWeight: 700,
    margin: "0 0 4px",
    color: colors.textPrimary,
  },

  secureBody: {
    fontSize: "13px",
    lineHeight: 1.55,
    color: colors.textSecondary,
    margin: 0,
  },

  secureFeatureRow: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "18px",
    paddingTop: "18px",
    borderTop: `1px solid ${colors.border}`,
  },

  secureFeature: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    flex: 1,
    textAlign: "center",
    color: colors.accentBright,
  },

  secureFeatureLabel: {
    fontSize: "12px",
    color: colors.textSecondary,
    lineHeight: 1.35,
  },

  // ---------- RIGHT / FORM PANEL ----------
  formPanel: {
    flex: "1 1 54%",
    width: "100%",
    maxWidth: "700px",
    background: colors.bgPanel,
    border: `1px solid ${colors.border}`,
    borderRadius: "20px",
    padding: "40px 48px 36px",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
  },
  formPanelTablet: {
    padding: "32px 30px 28px",
  },
  formPanelMobile: {
    maxWidth: "560px",
    padding: "26px 20px 22px",
    borderRadius: "16px",
  },

  formHeaderRow: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    marginBottom: "28px",
  },
  formHeaderRowMobile: {
    gap: "12px",
    marginBottom: "20px",
  },

  formHeaderIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    border: `1.5px solid ${colors.accent}`,
    background: colors.accentDim,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: colors.accentBright,
    flexShrink: 0,
  },
  formHeaderIconMobile: {
    width: "44px",
    height: "44px",
  },

  formTitle: {
    fontSize: "24px",
    fontWeight: 700,
    margin: "0 0 4px",
    color: colors.textPrimary,
  },
  formTitleMobile: {
    fontSize: "19px",
  },

  formSubtitle: {
    fontSize: "14px",
    color: colors.textSecondary,
    margin: 0,
  },
  formSubtitleMobile: {
    fontSize: "12.5px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  formMobile: {
    gap: "16px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  label: {
    fontSize: "13.5px",
    fontWeight: 600,
    color: colors.textPrimary,
  },

  inputWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },

  inputIcon: {
    position: "absolute",
    left: "16px",
    color: colors.accent,
    display: "flex",
    alignItems: "center",
    pointerEvents: "none",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "14px 16px 14px 48px",
    background: colors.bgInput,
    border: `1px solid ${colors.border}`,
    borderRadius: "10px",
    color: colors.textPrimary,
    fontSize: "14.5px",
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color 120ms ease, box-shadow 120ms ease",
  },
  inputMobile: {
    padding: "12px 14px 12px 44px",
    fontSize: "14px",
  },

  inputFocused: {
    borderColor: colors.accent,
    boxShadow: `0 0 0 3px ${colors.accentDim}`,
  },

  select: {
    width: "100%",
    boxSizing: "border-box",
    padding: "14px 44px 14px 48px",
    background: colors.bgInput,
    border: `1px solid ${colors.border}`,
    borderRadius: "10px",
    color: colors.textPrimary,
    fontSize: "14.5px",
    outline: "none",
    fontFamily: "inherit",
    appearance: "none",
    WebkitAppearance: "none",
    cursor: "pointer",
    transition: "border-color 120ms ease, box-shadow 120ms ease",
  },
  selectMobile: {
    padding: "12px 40px 12px 44px",
    fontSize: "14px",
  },

  selectPlaceholder: {
    color: colors.textMuted,
  },

  selectChevron: {
    position: "absolute",
    right: "16px",
    color: colors.textSecondary,
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
  },

  eyeButton: {
    position: "absolute",
    right: "16px",
    background: "none",
    border: "none",
    padding: 0,
    color: colors.textSecondary,
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
  },

  strengthTrack: {
    display: "flex",
    gap: "6px",
    marginTop: "10px",
  },

  strengthSegment: {
    flex: 1,
    height: "4px",
    borderRadius: "2px",
    background: colors.border,
  },

  strengthSegmentActive: {
    background: colors.accent,
  },

  strengthHint: {
    fontSize: "12.5px",
    color: colors.textMuted,
    margin: "8px 0 0",
  },

  submitButton: {
    marginTop: "8px",
    width: "100%",
    padding: "16px",
    border: "none",
    borderRadius: "10px",
    background: `linear-gradient(180deg, ${colors.accentBright}, ${colors.accent})`,
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(59, 130, 246, 0.28)",
    transition:
      "transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease",
  },
  submitButtonMobile: {
    padding: "14px",
    fontSize: "15px",
  },

  submitButtonDisabled: {
    opacity: 0.55,
    cursor: "not-allowed",
    boxShadow: "none",
  },

  signInRow: {
    textAlign: "center",
    marginTop: "22px",
    fontSize: "14px",
    color: colors.textSecondary,
  },

  signInLink: {
    color: colors.accentBright,
    fontWeight: 600,
    textDecoration: "none",
    cursor: "pointer",
  },

  footer: {
    textAlign: "center",
    padding: "8px 24px 28px",
    fontSize: "13px",
    color: colors.textMuted,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    flexWrap: "wrap",
    boxSizing: "border-box",
  },
  footerMobile: {
    padding: "6px 16px 22px",
    fontSize: "12px",
  },

  footerLink: {
    color: colors.textSecondary,
    fontWeight: 600,
    textDecoration: "none",
  },
};

export default styles;
export { colors };
