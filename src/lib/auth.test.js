import { ROLES, clearSession, getSession, homePathFor, saveSession, updateSession } from "./auth";

// auth.js imports the HTTP client only for logout(); keep the tests offline.
jest.mock("./api", () => ({ __esModule: true, default: { post: jest.fn() } }));

beforeEach(() => sessionStorage.clear());

test("no session until someone logs in", () => {
  expect(getSession()).toBeNull();
});

test("saveSession / getSession round-trip, with the role as a number", () => {
  saveSession({ userId: 7, role: ROLES.VOLUNTEER, email: "sam@example.com", firstName: "Sam", lastName: "Okafor" });
  expect(getSession()).toEqual({ userId: "7", role: 2, email: "sam@example.com", firstName: "Sam", lastName: "Okafor" });
});

test("updateSession changes only the fields given", () => {
  saveSession({ userId: 7, role: ROLES.USER, email: "a@example.com", firstName: "Priya", lastName: "Shah" });
  updateSession({ firstName: "Pri" });
  expect(getSession()).toMatchObject({ firstName: "Pri", lastName: "Shah", email: "a@example.com" });
});

test("clearSession logs the person out locally", () => {
  saveSession({ userId: 1, role: ROLES.ADMIN, email: "x@example.com" });
  clearSession();
  expect(getSession()).toBeNull();
});

test("each role lands on its own home page", () => {
  expect(homePathFor(ROLES.ADMIN)).toBe("/admin-dashboard");
  expect(homePathFor(ROLES.VOLUNTEER)).toBe("/volunteer-home");
  expect(homePathFor(ROLES.USER)).toBe("/");
});
