import { MIN_AGE, passwordStrength, rules, validate } from "./validation";

describe("field rules", () => {
  test("names must be present and contain no digits", () => {
    expect(rules.firstName("")).toMatch(/first name/i);
    expect(rules.firstName("   ")).toMatch(/first name/i);
    expect(rules.firstName("Priya2")).toMatch(/numbers/i);
    expect(rules.firstName("Priya")).toBe("");
    expect(rules.lastName("O'Connor-Shah")).toBe("");
  });

  test("email needs a local part, an @ and a domain with a dot", () => {
    expect(rules.email("priya@example.com")).toBe("");
    expect(rules.email("  priya@example.com  ")).toBe("");
    expect(rules.email("priya@example")).not.toBe("");
    expect(rules.email("priya.example.com")).not.toBe("");
    expect(rules.email("pri ya@example.com")).not.toBe("");
  });

  test("passwords need 8+ characters, a number and a symbol", () => {
    expect(rules.password("short1!")).toMatch(/8 characters/);
    expect(rules.password("longenough")).toMatch(/number and one symbol/);
    expect(rules.password("longenough1")).toMatch(/symbol/);
    expect(rules.password("long-enough1")).toBe("");
  });

  test("phone numbers are 10 digits, ignoring spaces and dashes", () => {
    expect(rules.phoneNo("5550000002")).toBe("");
    expect(rules.phoneNo("555-000 0002")).toBe("");
    expect(rules.phoneNo("555000000")).not.toBe("");
    expect(rules.phoneNo("55500000021")).not.toBe("");
    expect(rules.phoneNo("555000000a")).not.toBe("");
  });

  test(`age must be a number from ${MIN_AGE} to 120`, () => {
    expect(rules.age("")).toMatch(/enter your age/i);
    expect(rules.age("abc")).toMatch(/enter your age/i);
    expect(rules.age(String(MIN_AGE - 1))).toMatch(new RegExp(`${MIN_AGE} or older`));
    expect(rules.age(String(MIN_AGE))).toBe("");
    expect(rules.age("121")).not.toBe("");
  });

  test("house number must not be blank", () => {
    expect(rules.houseNo(" ")).not.toBe("");
    expect(rules.houseNo("14B")).toBe("");
  });
});

describe("validate", () => {
  test("returns only the failing fields that were asked about", () => {
    const values = { firstName: "", email: "bad", phoneNo: "5550000002", age: "40" };
    expect(validate(values, ["firstName", "email", "phoneNo", "age"])).toEqual({
      firstName: expect.any(String),
      email: expect.any(String),
    });
    expect(validate(values, ["phoneNo"])).toEqual({});
  });

  test("treats missing values as empty strings instead of crashing", () => {
    expect(validate({}, ["houseNo"])).toEqual({ houseNo: expect.any(String) });
  });
});

describe("passwordStrength", () => {
  test("scores rise with length and variety", () => {
    expect(passwordStrength("").score).toBe(0);
    expect(passwordStrength("abcdefgh").label).toBe("Weak");
    expect(passwordStrength("Abcdefgh1234!").score).toBe(5);
  });
});
