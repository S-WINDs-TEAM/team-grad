// FleetManagerRegistration.jsx
import { useState } from "react";
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
import styles from "./FleetManagerRegistration.module.css";

const FLEET_SIZE_OPTIONS = [
  { value: "", label: "Select fleet size" },
  { value: "1-10", label: "1 - 10 vehicles" },
  { value: "11-50", label: "11 - 50 vehicles" },
  { value: "51-200", label: "51 - 200 vehicles" },
  { value: "200+", label: "200+ vehicles" },
];

function passwordStrength(password) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score; // 0-4
}

function cx(...classNames) {
  return classNames.filter(Boolean).join(" ");
}

function Logo() {
  return (
    <svg
      className={styles.logoMark}
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
          <stop offset="0" stopColor="#60a5fa" />
          <stop offset="1" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill="url(#swindsGrad)" opacity="0.14" />
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
}) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.inputWrap}>
        <span className={styles.inputIcon}>{icon}</span>
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={styles.input}
        />
        {rightSlot}
      </div>
    </div>
  );
}

export default function FleetManagerRegistration() {
  const [companyName, setCompanyName] = useState("");
  const [fleetSize, setFleetSize] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    <div className={styles.page}>
      <div className={styles.main}>
        {/* LEFT HERO PANEL — hidden on mobile purely via CSS (@media max-width: 639px) */}
        <section className={styles.heroPanel}>
          <div className={styles.logoRow}>
            <Logo />
            <span className={styles.logoText}>S-WINDs</span>
          </div>

          <div className={styles.heroCopy}>
            <h1 className={styles.heroHeading}>
              Register as a
              <span className={styles.heroHeadingAccent}>Fleet Manager</span>
            </h1>
            <div className={styles.heroDivider} />
            <p className={styles.heroSubtext}>
              Take control of your fleet operations with S-WINDs. Real-time
              insights, smarter decisions, better performance.
            </p>
          </div>

          <div className={styles.secureCard}>
            <div className={styles.secureCardTop}>
              <div className={styles.secureIconWrap}>
                <HiOutlineLockClosed size={18} />
              </div>
              <div>
                <p className={styles.secureTitle}>Your data is secure</p>
                <p className={styles.secureBody}>
                  We use industry-standard encryption and best security
                  practices to protect your data.
                </p>
              </div>
            </div>

            <div className={styles.secureFeatureRow}>
              <div className={styles.secureFeature}>
                <HiOutlineShieldCheck size={20} />
                <span className={styles.secureFeatureLabel}>
                  Secure
                  <br />
                  Encryption
                </span>
              </div>
              <div className={styles.secureFeature}>
                <PiLockKeyOpenLight size={20} />
                <span className={styles.secureFeatureLabel}>
                  Data
                  <br />
                  Protection
                </span>
              </div>
              <div className={styles.secureFeature}>
                <HiOutlineDocumentCheck size={20} />
                <span className={styles.secureFeatureLabel}>
                  GDPR
                  <br />
                  Compliant
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT FORM PANEL */}
        <section className={styles.formPanel}>
          <div className={styles.formHeaderRow}>
            <div className={styles.formHeaderIcon}>
              <HiOutlineUsers size={26} />
            </div>
            <div>
              <h2 className={styles.formTitle}>Fleet Manager Registration</h2>
              <p className={styles.formSubtitle}>
                Create your account to get started with S-WINDs
              </p>
            </div>
          </div>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <InputField
              id="companyName"
              label="Company Name"
              icon={<HiOutlineBuildingOffice2 size={18} />}
              placeholder="Enter your company name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />

            <div className={styles.field}>
              <label htmlFor="fleetSize" className={styles.label}>
                Fleet Size
              </label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>
                  <HiOutlineUsers size={18} />
                </span>
                <select
                  id="fleetSize"
                  value={fleetSize}
                  onChange={(e) => setFleetSize(e.target.value)}
                  className={cx(
                    styles.select,
                    fleetSize === "" ? styles.selectPlaceholder : null
                  )}
                >
                  {FLEET_SIZE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <span className={styles.selectChevron}>
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
            />

            <InputField
              id="companyEmail"
              label="Company Email"
              icon={<HiOutlineEnvelope size={18} />}
              type="email"
              placeholder="Enter company email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className={styles.field}>
              <InputField
                id="password"
                label="Password"
                icon={<HiOutlineLockClosed size={18} />}
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                rightSlot={
                  <button
                    type="button"
                    className={styles.eyeButton}
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <HiOutlineEyeSlash size={18} />
                    ) : (
                      <HiOutlineEye size={18} />
                    )}
                  </button>
                }
              />
              <div className={styles.strengthTrack}>
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={cx(
                      styles.strengthSegment,
                      i < strength ? styles.strengthSegmentActive : null
                    )}
                  />
                ))}
              </div>
              <p className={styles.strengthHint}>
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
              rightSlot={
                <button
                  type="button"
                  className={styles.eyeButton}
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
              className={styles.submitButton}
              disabled={!isValid || submitting}
            >
              <HiOutlineShieldCheck size={18} />
              {submitting ? "Registering..." : "Register"}
            </button>
          </form>

          <p className={styles.signInRow}>
            Already have an account?{" "}
            <a href="#signin" className={styles.signInLink}>
              Sign in
            </a>
          </p>
        </section>
      </div>

      <div className={styles.footer}>
        <HiOutlineFingerPrint size={14} />
        <span>
          By registering, you agree to our{" "}
          <a href="#tos" className={styles.footerLink}>
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#privacy" className={styles.footerLink}>
            Privacy Policy
          </a>
          .
        </span>
      </div>
    </div>
  );
}
