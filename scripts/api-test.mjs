/**
 * End-to-end API tests against a REAL running backend (Spring Boot + MySQL), not a mock.
 *
 *   API_URL=http://localhost:8090/api ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/api-test.mjs
 *
 * Point it at a TEST database only: it registers users, posts requests and deletes accounts.
 * Admin accounts can't be created through the API (by design), so the admin must already exist.
 * Exits with code 1 if any check fails.
 */

const API = (process.env.API_URL || "http://localhost:8080/api").replace(/\/+$/, "");
const ADMIN = { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD };
// Must be one of the backend's CORS_ORIGINS, like a real browser on the frontend's address.
const ORIGIN = process.env.ORIGIN || "http://localhost:3000";
const run = Date.now().toString(36);

let passed = 0;
const failures = [];

const check = (name, ok, detail = "") => {
  if (ok) {
    passed++;
    console.log(`  ok    ${name}`);
  } else {
    failures.push(name);
    console.log(`  FAIL  ${name}${detail ? `: ${detail}` : ""}`);
  }
};

/** A tiny client with its own cookie jar, i.e. one browser. */
const client = (origin = ORIGIN) => {
  let cookie = "";
  return async (method, path, body) => {
    const res = await fetch(API + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        Origin: origin,
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const set = res.headers.get("set-cookie");
    if (set) cookie = set.split(";")[0];
    const text = await res.text();
    let data = text;
    try {
      data = JSON.parse(text);
    } catch {
      // plain-text body
    }
    return { status: res.status, data, headers: res.headers };
  };
};

const newUser = (role, name) => ({
  firstName: name,
  lastName: "Test",
  email: `${name.toLowerCase()}.${run}@example.test`,
  password: "Neighbor#2026",
  houseNo: "12B",
  phoneNo: "5551234567",
  age: 34,
  role,
});

const inDays = (d) => new Date(Date.now() + d * 86400000).toISOString();

async function main() {
  console.log(`API tests against ${API} (run ${run})\n`);

  const anon = client();
  const residentData = newUser(1, "Rita");
  const volunteerData = newUser(2, "Victor");
  const resident = client();
  const volunteer = client();

  console.log("Registration and validation");
  check("register resident", (await anon("POST", "/user/register", residentData)).status === 200);
  check("register volunteer", (await anon("POST", "/user/register", volunteerData)).status === 200);
  check("duplicate email rejected (409)", (await anon("POST", "/user/register", residentData)).status === 409);
  check("cannot self-register as admin (400)", (await anon("POST", "/user/register", { ...newUser(0, "Mallory"), role: 0 })).status === 400);
  check("under-18 rejected (400)", (await anon("POST", "/user/register", { ...newUser(1, "Kid"), age: 15 })).status === 400);
  check("short password rejected (400)", (await anon("POST", "/user/register", { ...newUser(1, "Shorty"), password: "abc" })).status === 400);
  const badPhone = await anon("POST", "/user/register", { ...newUser(1, "Phony"), phoneNo: "12ab" });
  check("invalid phone rejected with a readable message (400)", badPhone.status === 400 && /phone/i.test(badPhone.data?.message || ""), JSON.stringify(badPhone.data));

  console.log("\nLogin");
  const wrong = await anon("POST", "/user/login", { email: residentData.email, password: "wrong-password" });
  check("wrong password -> 401", wrong.status === 401);
  const login = await resident("POST", "/user/login", { email: residentData.email, password: residentData.password });
  check("resident logs in", login.status === 200 && login.data.role === 1);
  check("login response has no password", login.status === 200 && !JSON.stringify(login.data).includes("password\":\""));
  check("session cookie is HttpOnly", /HttpOnly/i.test(login.headers.get("set-cookie") || ""));
  check("session cookie is SameSite=Lax", /SameSite=Lax/i.test(login.headers.get("set-cookie") || ""));
  const vLogin = await volunteer("POST", "/user/login", { email: volunteerData.email, password: volunteerData.password });
  check("volunteer logs in", vLogin.status === 200 && vLogin.data.role === 2);
  const residentId = login.data.userId;
  const volunteerId = vLogin.data.userId;

  console.log("\nSecurity headers and data exposure");
  const foreign = await client("https://evil.example")("GET", "/opportunities/available");
  check("requests from an unknown website are refused by CORS (403)", foreign.status === 403);
  const opps = await anon("GET", "/opportunities/available");
  check("public opportunity list works without login", opps.status === 200 && Array.isArray(opps.data));
  check("X-Content-Type-Options: nosniff", opps.headers.get("x-content-type-options") === "nosniff");
  check("X-Frame-Options: DENY", opps.headers.get("x-frame-options") === "DENY");
  check("API responses are not cached", opps.headers.get("cache-control") === "no-store");
  const leaks = JSON.stringify(opps.data).match(/"(email|phoneNo|password|age)"/);
  check("public opportunities expose no email, phone, password or age", !leaks, leaks?.[0]);
  check("GET /volunteers is admin-only (403 for anonymous)", (await anon("GET", "/volunteers")).status === 403);
  check("GET /user/all is admin-only (403 for a resident)", (await resident("GET", "/user/all")).status === 403);
  check("cannot read another user's profile (403)", (await resident("GET", `/user/${volunteerId}`)).status === 403);
  check("cannot edit another user's profile (403)", (await resident("PUT", `/user/${volunteerId}`, { firstName: "Hacked" })).status === 403);
  check("old notifications endpoint removed (404)", (await anon("GET", "/notifications/user/1")).status === 404);
  check("contact inbox is admin-only (403)", (await resident("GET", "/contact")).status === 403);
  check("health endpoint up", (await fetch(API.replace(/\/api$/, "") + "/actuator/health").then((r) => r.status)) === 200);

  console.log("\nRequest lifecycle");
  const reqBody = {
    requestType: `Groceries ${run}`,
    description: "Milk, bread and fruit, list on the door.",
    category: "Groceries",
    deadline: inDays(2),
    urgency: "Medium",
    phoneNumber: "5559876543",
    houseNo: "12B",
  };
  check("invalid request rejected (400)", (await resident("POST", "/requests/create", { ...reqBody, phoneNumber: "x" })).status === 400);
  check("volunteer cannot post requests (403)", (await volunteer("POST", "/requests/create", reqBody)).status === 403);
  const created = await resident("POST", "/requests/create", reqBody);
  check("resident posts a request (201)", created.status === 201 && created.data.status === "PENDING");
  const requestId = created.data.id;

  const pending = await volunteer("GET", "/requests/pending");
  const mine = (Array.isArray(pending.data) ? pending.data : []).find((r) => r.id === requestId);
  check("volunteer sees it on the noticeboard", !!mine);
  check("phone number hidden until accepted", mine && mine.phoneNumber == null);
  check("resident's email and phone are not in the request", mine && !mine.user?.email && !mine.user?.phoneNo);
  check("residents cannot see the noticeboard (403)", (await resident("GET", "/requests/pending")).status === 403);
  check("resident cannot accept requests (403)", (await resident("PUT", `/requests/${requestId}/accept`)).status === 403);

  const accepted = await volunteer("PUT", `/requests/${requestId}/accept`);
  check("volunteer accepts", accepted.status === 200 && accepted.data.status === "ACCEPTED");
  check("accepting twice -> 409", (await volunteer("PUT", `/requests/${requestId}/accept`)).status === 409);
  const tasks = await volunteer("GET", "/requests/accepted");
  check("volunteer now sees the phone number", (Array.isArray(tasks.data) ? tasks.data : []).some((r) => r.id === requestId && r.phoneNumber === "5559876543"));
  check("resident cannot withdraw an accepted request (403)", (await resident("DELETE", `/requests/${requestId}`)).status === 403);
  check("feedback before completion is refused (403)", (await resident("POST", "/feedback", { volunteerId, rating: 5, comment: "Early" })).status === 403);
  check("volunteer marks it done", (await volunteer("PUT", `/requests/${requestId}/complete`)).data?.status === "COMPLETED");
  check("rating out of range rejected (400)", (await resident("POST", "/feedback", { volunteerId, rating: 9, comment: "Too high" })).status === 400);
  check("resident rates the volunteer", (await resident("POST", "/feedback", { volunteerId, rating: 5, comment: "Lovely, thank you" })).status === 200);
  const reviews = await volunteer("GET", `/feedback/volunteer/${volunteerId}`);
  check("rating is stored (persists in the database)", (Array.isArray(reviews.data) ? reviews.data : []).some((f) => f.comment === "Lovely, thank you"));

  const second = await resident("POST", "/requests/create", { ...reqBody, requestType: `Second ${run}` });
  check("resident can withdraw a pending request", (await resident("DELETE", `/requests/${second.data.id}`)).status === 204);

  console.log("\nAdmin");
  if (!ADMIN.email || !ADMIN.password) {
    check("admin checks (set ADMIN_EMAIL and ADMIN_PASSWORD)", false, "skipped: no admin credentials given");
  } else {
    const admin = client();
    const aLogin = await admin("POST", "/user/login", ADMIN);
    check("admin logs in", aLogin.status === 200 && aLogin.data.role === 0, `status ${aLogin.status}`);
    check("admin lists all users", (await admin("GET", "/user/all")).status === 200);
    const opp = await admin("POST", "/opportunities", {
      name: `Park tidy ${run}`,
      description: "Litter pick by the river.",
      category: "Environment",
      location: "Riverside Park",
      deadline: inDays(10).slice(0, 10),
      volunteerLimit: 1,
    });
    check("admin creates an opportunity", opp.status === 201, `status ${opp.status} ${JSON.stringify(opp.data)}`);
    check("non-admin cannot create opportunities (403)", (await resident("POST", "/opportunities", { name: "x" })).status === 403);
    if (opp.status === 201) {
      check("volunteer joins", (await volunteer("POST", `/volunteers/opportunities/${opp.data.id}/accept`)).status === 200);
      check("resident cannot join (403)", (await resident("POST", `/volunteers/opportunities/${opp.data.id}/accept`)).status === 403);
      check("limit can't drop below sign-ups (400)", (await admin("PUT", `/opportunities/${opp.data.id}`, { ...opp.data, volunteerLimit: 0 })).status === 400);
      check("admin deletes the opportunity", (await admin("DELETE", `/opportunities/${opp.data.id}`)).status === 204);
    }

    // A ban must end the volunteer's existing session immediately.
    check("admin suspends the volunteer", (await admin("PUT", `/user/${volunteerId}/ban`)).status === 200);
    check("suspended volunteer's live session is ended (401)", (await volunteer("GET", "/requests/accepted")).status === 401);
    const bannedLogin = await anon("POST", "/user/login", { email: volunteerData.email, password: volunteerData.password });
    check("suspended volunteer can't log in (403)", bannedLogin.status === 403);
    const bannedWrong = await anon("POST", "/user/login", { email: volunteerData.email, password: "wrong" });
    check("wrong password for a suspended account doesn't reveal the ban (401)", bannedWrong.status === 401);
    check("admin deletes the volunteer", (await admin("DELETE", `/user/${volunteerId}`)).status === 204);
    check("admin can't delete an admin account", (await admin("DELETE", `/user/${aLogin.data.userId}`)).status === 400);
  }

  console.log("\nAccount deletion and logout");
  check("resident deletes their own account", (await resident("DELETE", "/user/me")).status === 204);
  check("deleted account's session is gone (401)", (await resident("GET", "/requests/user")).status === 401);
  check("deleted account can't log in", (await anon("POST", "/user/login", { email: residentData.email, password: residentData.password })).status === 401);

  console.log("\nRate limiting (last: it locks this IP out of login for 5 minutes)");
  const limiter = client();
  let statuses = [];
  for (let i = 0; i < 12; i++) {
    statuses.push((await limiter("POST", "/user/login", { email: `nobody.${run}@example.test`, password: "x" })).status);
  }
  const limited = await limiter("POST", "/user/login", { email: `nobody.${run}@example.test`, password: "x" });
  check("repeated logins are throttled (429)", limited.status === 429, statuses.join(","));
  check("throttle response says when to retry", !!limited.headers.get("retry-after"));

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) {
    console.log("Failed:\n - " + failures.join("\n - "));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("API test run crashed:", err.message);
  process.exit(1);
});
