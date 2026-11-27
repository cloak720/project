// Field rules shared by registration and profile editing. Each returns an error string or "".
// They mirror the backend's constraints so people see problems before submitting.

export const MIN_AGE = 18;

export const rules = {
  firstName: (v) => (!v.trim() ? "Enter your first name." : /\d/.test(v) ? "Names can't contain numbers." : ""),
  lastName: (v) => (!v.trim() ? "Enter your last name." : /\d/.test(v) ? "Names can't contain numbers." : ""),
  email: (v) => (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "Enter a valid email address." : ""),
  password: (v) =>
    v.length < 8
      ? "Use at least 8 characters."
      : !/\d/.test(v) || !/[^A-Za-z0-9]/.test(v)
      ? "Include at least one number and one symbol."
      : "",
  phoneNo: (v) => (!/^\d{10}$/.test(v.replace(/[\s-]/g, "")) ? "Enter a 10-digit phone number." : ""),
  age: (v) => {
    const n = Number(v);
    if (v === "" || Number.isNaN(n)) return "Enter your age.";
    if (n < MIN_AGE) return `You must be ${MIN_AGE} or older to join.`;
    if (n > 120) return "Enter a real age.";
    return "";
  },
  houseNo: (v) => (!String(v).trim() ? "Enter your house or flat number." : ""),
};

/** Validate the listed fields of `values`; returns { field: message } for failures only. */
export const validate = (values, fields) =>
  fields.reduce((errs, f) => {
    const msg = rules[f] ? rules[f](String(values[f] ?? "")) : "";
    if (msg) errs[f] = msg;
    return errs;
  }, {});

export const passwordStrength = (pw) => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/\d/.test(pw) && /[A-Za-z]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  const levels = ["Too weak", "Weak", "Fair", "Good", "Strong", "Strong"];
  return { score, label: levels[score] };
};
