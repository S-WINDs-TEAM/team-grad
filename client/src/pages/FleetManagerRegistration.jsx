// FleetManagerRegistration.jsx
import { useState, useEffect } from "react";
import {
  HiOutlineBuildingOffice2,
  HiOutlineUsers,
  HiOutlineUser,
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineChevronDown,
  HiOutlineShieldCheck,
  HiOutlineFingerPrint,
  HiOutlineDocumentCheck,
} from "react-icons/hi2";
import { PiLockKeyOpenLight } from "react-icons/pi";
import styles, { colors } from "./FleetManagerRegistration.styles";

const FLEET_SIZE_OPTIONS = [
  { value: "", label: "Select fleet size" },
  { value: "1-10", label: "1 - 10 vehicles" },
  { value: "11-50", label: "11 - 50 vehicles" },
  { value: "51-200", label: "51 - 200 vehicles" },
  { value: "200+", label: "200+ vehicles" },
];

const TABLET_BREAKPOINT = 1024;
const MOBILE_BREAKPOINT = 640;

function passwordStrength(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score; // 0-4
}

// Merge base styles with breakpoint overrides, skipping any that don't exist.
function merge(...styleObjects) {
  return Object.assign({}, ...styleObjects.filter(Boolean));
}

function useViewport() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1280,
  );

  useEffect(() => {
    function handleResize() {
      setWidth(window.innerWidth);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    isMobile: width < MOBILE_BREAKPOINT,
    isTablet: width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT,
    isDesktop: width >= TABLET_BREAKPOINT,
  };
}

function Logo() {
  return (
    <svg
      style={styles.logoMark}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="swindsGrad"
          x1="0"
          y1="0"
          x2="40"
          y2="40"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor={colors.accentBright} />
          <stop offset="1" stopColor={colors.accent} />
        </linearGradient>
      </defs>
      <rect
        width="40"
        height="40"
        rx="10"
        fill="url(#swindsGrad)"
        opacity="0.14"
      />
      <path
        d="M28 12c0-2.2-3.6-4-9-4-6.2 0-9 2.2-9 5 0 2.4 2.1 3.6 6.6 4.4l3.8.7c2.6.5 3.6 1 3.6 2.1 0 1.3-1.9 2.1-4.6 2.1-3.4 0-5.4-1-6-2.9h-4c.5 4 4.3 6.6 10 6.6 6 0 9.6-2.3 9.6-5.4 0-2.6-2-3.8-6.6-4.6l-3.9-.7c-2.4-.4-3.4-.9-3.4-2 0-1.2 1.6-2 4.2-2 3 0 4.7.9 5.2 2.7h4z"
        fill="url(#swindsGrad)"
      />
    </svg>
  );
}

function InputField({
  id,
  label,
  icon,
  type = "text",
  placeholder,
  value,
  onChange,
  rightSlot,
  isMobile,
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={styles.field}>
      <label htmlFor={id} style={styles.label}>
        {label}
      </label>
      <div style={styles.inputWrap}>
        <span style={styles.inputIcon}>{icon}</span>
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={merge(
            styles.input,
            isMobile ? styles.inputMobile : null,
            focused ? styles.inputFocused : null,
          )}
        />
        {rightSlot}
      </div>
    </div>
  );
}

export default function FleetManagerRegistration() {
  const { isMobile, isTablet } = useViewport();

  const [companyName, setCompanyName] = useState("");
  const [fleetSize, setFleetSize] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectFocused, setSelectFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const strength = passwordStrength(password);

  const isValid =
    companyName.trim() &&
    fleetSize &&
    contactName.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    password.length >= 8 &&
    password === confirmPassword;

  function handleSubmit(e) {
    e.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    // Wire this up to your registration API.
    window.setTimeout(() => setSubmitting(false), 1200);
  }

  return (
    <div style={styles.page}>
      <div
        style={merge(
          styles.main,
          isTablet ? styles.mainTablet : null,
          isMobile ? styles.mainMobile : null,
        )}
      >
        {/* LEFT HERO PANEL — hidden on mobile */}
        {!isMobile && (
          <section
            style={merge(
              styles.heroPanel,
              isTablet ? styles.heroPanelTablet : null,
            )}
          >
            <div style={styles.logoRow}>
              <Logo />
              <span style={styles.logoText}>S-WINDs</span>
            </div>

            <div style={styles.heroCopy}>
              <h1
                style={merge(
                  styles.heroHeading,
                  isTablet ? styles.heroHeadingTablet : null,
                )}
              >
                Register as a
                <span style={styles.heroHeadingAccent}>Fleet Manager</span>
              </h1>
              <div style={styles.heroDivider} />
              <p
                style={merge(
                  styles.heroSubtext,
                  isTablet ? styles.heroSubtextTablet : null,
                )}
              >
                Take control of your fleet operations with S-WINDs. Real-time
                insights, smarter decisions, better performance.
              </p>
            </div>

            <div
              style={merge(
                styles.secureCard,
                isTablet ? styles.secureCardTablet : null,
              )}
            >
              <div style={styles.secureCardTop}>
                <div style={styles.secureIconWrap}>
                  <HiOutlineLockClosed size={18} />
                </div>
                <div>
                  <p style={styles.secureTitle}>Your data is secure</p>
                  <p style={styles.secureBody}>
                    We use industry-standard encryption and best security
                    practices to protect your data.
                  </p>
                </div>
              </div>

              <div style={styles.secureFeatureRow}>
                <div style={styles.secureFeature}>
                  <HiOutlineShieldCheck size={20} />
                  <span style={styles.secureFeatureLabel}>
                    Secure
                    <br />
                    Encryption
                  </span>
                </div>
                <div style={styles.secureFeature}>
                  <PiLockKeyOpenLight size={20} />
                  <span style={styles.secureFeatureLabel}>
                    Data
                    <br />
                    Protection
                  </span>
                </div>
                <div style={styles.secureFeature}>
                  <HiOutlineDocumentCheck size={20} />
                  <span style={styles.secureFeatureLabel}>
                    GDPR
                    <br />
                    Compliant
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* RIGHT FORM PANEL */}
        <section
          style={merge(
            styles.formPanel,
            isTablet ? styles.formPanelTablet : null,
            isMobile ? styles.formPanelMobile : null,
          )}
        >
          <div
            style={merge(
              styles.formHeaderRow,
              isMobile ? styles.formHeaderRowMobile : null,
            )}
          >
            <div
              style={merge(
                styles.formHeaderIcon,
                isMobile ? styles.formHeaderIconMobile : null,
              )}
            >
              <HiOutlineUsers size={isMobile ? 22 : 26} />
            </div>
            <div>
              <h2
                style={merge(
                  styles.formTitle,
                  isMobile ? styles.formTitleMobile : null,
                )}
              >
                Fleet Manager Registration
              </h2>
              <p
                style={merge(
                  styles.formSubtitle,
                  isMobile ? styles.formSubtitleMobile : null,
                )}
              >
                Create your account to get started with S-WINDs
              </p>
            </div>
          </div>

          <form
            style={merge(styles.form, isMobile ? styles.formMobile : null)}
            onSubmit={handleSubmit}
            noValidate
          >
            <InputField
              id="companyName"
              label="Company Name"
              icon={<HiOutlineBuildingOffice2 size={18} />}
              placeholder="Enter your company name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              isMobile={isMobile}
            />

            <div style={styles.field}>
              <label htmlFor="fleetSize" style={styles.label}>
                Fleet Size
              </label>
              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}>
                  <HiOutlineUsers size={18} />
                </span>
                <select
                  id="fleetSize"
                  value={fleetSize}
                  onChange={(e) => setFleetSize(e.target.value)}
                  onFocus={() => setSelectFocused(true)}
                  onBlur={() => setSelectFocused(false)}
                  style={merge(
                    styles.select,
                    isMobile ? styles.selectMobile : null,
                    selectFocused ? styles.inputFocused : null,
                    fleetSize === "" ? styles.selectPlaceholder : null,
                  )}
                >
                  {FLEET_SIZE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <span style={styles.selectChevron}>
                  <HiOutlineChevronDown size={18} />
                </span>
              </div>
            </div>

            <InputField
              id="contactName"
              label="Contact Person Name"
              icon={<HiOutlineUser size={18} />}
              placeholder="Enter contact person name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              isMobile={isMobile}
            />

            <InputField
              id="companyEmail"
              label="Company Email"
              icon={<HiOutlineEnvelope size={18} />}
              type="email"
              placeholder="Enter company email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              isMobile={isMobile}
            />

            <div style={styles.field}>
              <InputField
                id="password"
                label="Password"
                icon={<HiOutlineLockClosed size={18} />}
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                isMobile={isMobile}
                rightSlot={
                  <button
                    type="button"
                    style={styles.eyeButton}
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <HiOutlineEyeSlash size={18} />
                    ) : (
                      <HiOutlineEye size={18} />
                    )}
                  </button>
                }
              />
              <div style={styles.strengthTrack}>
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={merge(
                      styles.strengthSegment,
                      i < strength ? styles.strengthSegmentActive : null,
                    )}
                  />
                ))}
              </div>
              <p style={styles.strengthHint}>
                Use 8+ characters with a mix of letters, numbers &amp; symbols
              </p>
            </div>

            <InputField
              id="confirmPassword"
              label="Confirm Password"
              icon={<HiOutlineLockClosed size={18} />}
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              isMobile={isMobile}
              rightSlot={
                <button
                  type="button"
                  style={styles.eyeButton}
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <HiOutlineEyeSlash size={18} />
                  ) : (
                    <HiOutlineEye size={18} />
                  )}
                </button>
              }
            />

            <button
              type="submit"
              style={merge(
                styles.submitButton,
                isMobile ? styles.submitButtonMobile : null,
                !isValid || submitting ? styles.submitButtonDisabled : null,
              )}
              disabled={!isValid || submitting}
            >
              <HiOutlineShieldCheck size={18} />
              {submitting ? "Registering..." : "Register"}
            </button>
          </form>

          <p style={styles.signInRow}>
            Already have an account?{" "}
            <a href="#signin" style={styles.signInLink}>
              Sign in
            </a>
          </p>
        </section>
      </div>

      <div style={merge(styles.footer, isMobile ? styles.footerMobile : null)}>
        <HiOutlineFingerPrint size={14} />
        <span>
          By registering, you agree to our{" "}
          <a href="#tos" style={styles.footerLink}>
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#privacy" style={styles.footerLink}>
            Privacy Policy
          </a>
          .
        </span>
      </div>
    </div>
  );
}
