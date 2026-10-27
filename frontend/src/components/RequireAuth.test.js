import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RequireAuth from "./RequireAuth";
import { useAuth } from "../pages/AuthContext";

jest.mock("../pages/AuthContext", () => ({ useAuth: jest.fn() }));

const authState = (overrides) => ({
  isReady: true,
  isAuthenticated: false,
  user: null,
  openLogin: jest.fn(),
  ...overrides,
});

const renderGuard = (props) =>
  render(
    <MemoryRouter>
      <RequireAuth {...props}>
        <p>Secret page</p>
      </RequireAuth>
    </MemoryRouter>
  );

describe("RequireAuth", () => {
  it("waits for the session check before deciding", () => {
    useAuth.mockReturnValue(authState({ isReady: false }));
    renderGuard();
    expect(screen.getByText("Checking your session…")).toBeInTheDocument();
    expect(screen.queryByText("Secret page")).not.toBeInTheDocument();
  });

  it("asks signed-out visitors to log in", () => {
    const state = authState();
    useAuth.mockReturnValue(state);
    renderGuard();
    expect(screen.queryByText("Secret page")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(state.openLogin).toHaveBeenCalled();
  });

  it("shows the page to any signed-in user when no role is required", () => {
    useAuth.mockReturnValue(authState({ isAuthenticated: true, user: { email: "c@example.com", role: "customer" } }));
    renderGuard();
    expect(screen.getByText("Secret page")).toBeInTheDocument();
  });

  it("blocks customers from admin pages", () => {
    useAuth.mockReturnValue(authState({ isAuthenticated: true, user: { email: "c@example.com", role: "customer" } }));
    renderGuard({ role: "admin" });
    expect(screen.queryByText("Secret page")).not.toBeInTheDocument();
    expect(screen.getByText("You don't have access to this page")).toBeInTheDocument();
  });

  it("blocks stored sessions from before roles existed", () => {
    useAuth.mockReturnValue(authState({ isAuthenticated: true, user: { email: "old@example.com" } }));
    renderGuard({ role: "admin" });
    expect(screen.queryByText("Secret page")).not.toBeInTheDocument();
  });

  it("shows admin pages to admins", () => {
    useAuth.mockReturnValue(authState({ isAuthenticated: true, user: { email: "a@example.com", role: "admin" } }));
    renderGuard({ role: "admin" });
    expect(screen.getByText("Secret page")).toBeInTheDocument();
  });
});
