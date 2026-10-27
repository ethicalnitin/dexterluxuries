import { render, screen, waitFor, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";

const TOKEN_KEY = "cv_auth_token";
const USER_KEY = "cv_auth_user";

const jsonResponse = (status, body) =>
  Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) });

function setupAuth() {
  const ref = { current: null };
  function Probe() {
    const auth = useAuth();
    ref.current = auth;
    return (
      <p data-testid="state">
        {auth.isReady ? "ready" : "loading"}|{auth.user ? auth.user.email : "anon"}|{auth.isAdmin ? "admin" : "not-admin"}
      </p>
    );
  }
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );
  return ref;
}

const state = () => screen.getByTestId("state").textContent;

function storeSession(user = { id: "1", name: "Stored", email: "stored@example.com" }) {
  localStorage.setItem(TOKEN_KEY, "stored-token");
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

beforeEach(() => {
  localStorage.clear();
  global.fetch = jest.fn();
});

describe("AuthProvider session persistence", () => {
  it("is ready and signed out when nothing is stored", async () => {
    setupAuth();
    await waitFor(() => expect(state()).toBe("ready|anon|not-admin"));
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("restores a stored session and refreshes the profile (including role) from /auth/me", async () => {
    storeSession();
    global.fetch.mockReturnValueOnce(
      jsonResponse(200, { user: { id: "1", name: "Stored", email: "stored@example.com", role: "admin" } })
    );
    setupAuth();

    await waitFor(() => expect(state()).toBe("ready|stored@example.com|admin"));
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/auth\/me$/);
    expect(options.headers.Authorization).toBe("Bearer stored-token");
    expect(JSON.parse(localStorage.getItem(USER_KEY)).role).toBe("admin");
  });

  it("signs out when the server rejects the stored token", async () => {
    storeSession();
    global.fetch.mockReturnValueOnce(jsonResponse(401, { error: "Your session has expired. Sign in again." }));
    setupAuth();

    await waitFor(() => expect(state()).toBe("ready|anon|not-admin"));
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
  });

  it("keeps the session when the server can't be reached", async () => {
    storeSession();
    global.fetch.mockReturnValueOnce(Promise.reject(new TypeError("Failed to fetch")));
    setupAuth();

    await waitFor(() => expect(state()).toBe("ready|stored@example.com|not-admin"));
    expect(localStorage.getItem(TOKEN_KEY)).toBe("stored-token");
  });

  it("saves the session after logging in", async () => {
    global.fetch.mockReturnValueOnce(
      jsonResponse(200, { token: "new-token", user: { id: "2", name: "New", email: "new@example.com", role: "customer" } })
    );
    const auth = setupAuth();
    await waitFor(() => expect(state()).toBe("ready|anon|not-admin"));

    await act(() => auth.current.login("new@example.com", "password123"));

    expect(state()).toBe("ready|new@example.com|not-admin");
    expect(localStorage.getItem(TOKEN_KEY)).toBe("new-token");
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/auth\/login$/);
    expect(JSON.parse(options.body)).toEqual({ email: "new@example.com", password: "password123" });
  });

  it("surfaces the server's error message when login fails", async () => {
    global.fetch.mockReturnValueOnce(jsonResponse(401, { error: "Incorrect email or password." }));
    const auth = setupAuth();
    await waitFor(() => expect(state()).toBe("ready|anon|not-admin"));

    await expect(auth.current.login("x@example.com", "wrong-pass")).rejects.toThrow("Incorrect email or password.");
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
});

describe("context value", () => {
  it("doesn't re-render consumers when only the login modal opens or closes", async () => {
    let consumerUpdates = 0;
    const ref = { current: null };
    function Counter() {
      ref.current = useAuth();
      consumerUpdates += 1;
      return null;
    }
    render(
      <AuthProvider>
        <Counter />
      </AuthProvider>
    );
    await waitFor(() => expect(ref.current.isReady).toBe(true));
    const before = consumerUpdates;

    act(() => ref.current.openLogin());
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    act(() => ref.current.closeLogin());

    expect(consumerUpdates).toBe(before);
  });
});

describe("authRequest", () => {
  it("sends the token and signs out on a 401", async () => {
    storeSession({ id: "1", name: "Admin", email: "admin@example.com", role: "admin" });
    global.fetch
      .mockReturnValueOnce(jsonResponse(200, { user: { id: "1", name: "Admin", email: "admin@example.com", role: "admin" } }))
      .mockReturnValueOnce(jsonResponse(401, { error: "Your password was changed. Sign in again." }));
    const auth = setupAuth();
    await waitFor(() => expect(state()).toBe("ready|admin@example.com|admin"));

    await act(async () => {
      await expect(auth.current.authRequest("/admin/delivery-presets")).rejects.toThrow("Your password was changed.");
    });

    expect(global.fetch.mock.calls[1][1].headers.Authorization).toBe("Bearer stored-token");
    expect(state()).toBe("ready|anon|not-admin");
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it("keeps the session on other errors, such as 403", async () => {
    storeSession({ id: "1", name: "C", email: "c@example.com", role: "customer" });
    global.fetch
      .mockReturnValueOnce(jsonResponse(200, { user: { id: "1", name: "C", email: "c@example.com", role: "customer" } }))
      .mockReturnValueOnce(jsonResponse(403, { error: "You don't have permission to do that." }));
    const auth = setupAuth();
    await waitFor(() => expect(state()).toBe("ready|c@example.com|not-admin"));

    await act(async () => {
      await expect(auth.current.authRequest("/admin/delivery-presets")).rejects.toMatchObject({ status: 403 });
    });
    expect(state()).toBe("ready|c@example.com|not-admin");
  });
});
