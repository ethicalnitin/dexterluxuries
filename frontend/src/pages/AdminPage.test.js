import { render, screen, fireEvent, act } from "@testing-library/react";
import AdminPage from "./AdminPage";
import { useAuth } from "./AuthContext";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

jest.mock("./AuthContext", () => ({ useAuth: jest.fn() }));
jest.mock("../firebaseConfig", () => ({ db: {} }));
jest.mock("firebase/firestore", () => ({ collection: jest.fn(), addDoc: jest.fn(), serverTimestamp: jest.fn() }));

const presets = [{ label: "3 Months", duration: "3 Months", link: "https://drive.example/3m" }];

function setup({ deliveryError } = {}) {
  const authRequest = jest.fn((path) => {
    if (path === "/admin/delivery-presets") return Promise.resolve({ presets });
    return deliveryError ? Promise.reject(new Error(deliveryError)) : Promise.resolve({ success: true });
  });
  useAuth.mockReturnValue({ authRequest });
  render(<AdminPage />);
  return authRequest;
}

async function fillAndSend() {
  await screen.findByRole("option", { name: "3 Months" });
  fireEvent.change(screen.getByLabelText("Customer email"), { target: { value: "buyer@example.com" } });
  fireEvent.change(screen.getByLabelText("Product name"), { target: { value: "Pro Plan" } });
  fireEvent.change(screen.getByLabelText("Quick-fill plan link"), { target: { value: "3 Months" } });
  fireEvent.click(screen.getByRole("button", { name: /Send to customer/ }));
}

beforeEach(() => {
  localStorage.clear();
  jest.spyOn(console, "error").mockImplementation(() => {});
  collection.mockReturnValue("orders-collection");
  serverTimestamp.mockReturnValue("server-time");
});

afterEach(() => {
  jest.useRealTimers();
});

describe("AdminPage delivery", () => {
  it("confirms the email as soon as it's sent, even if the orders feed never answers", async () => {
    addDoc.mockReturnValue(new Promise(() => {}));
    const authRequest = setup();
    await fillAndSend();

    expect(await screen.findByText("Email sent to buyer@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Send to customer/ })).not.toHaveAttribute("aria-busy");
    expect(authRequest).toHaveBeenCalledWith(
      "/admin/deliveries",
      expect.objectContaining({
        method: "POST",
        body: expect.objectContaining({ customerEmail: "buyer@example.com", driveLink: "https://drive.example/3m" }),
      })
    );
    expect(addDoc).toHaveBeenCalledWith("orders-collection", {
      maskedEmail: "b***r@example.com",
      productName: "Pro Plan",
      planDuration: "3 Months",
      createdAt: "server-time",
    });
  });

  it("then warns if the orders feed doesn't confirm in time", async () => {
    jest.useFakeTimers();
    addDoc.mockReturnValue(new Promise(() => {}));
    setup();
    await fillAndSend();
    await screen.findByText("Email sent to buyer@example.com");

    act(() => {
      jest.advanceTimersByTime(10000);
    });
    expect(await screen.findByText(/public orders feed couldn't be updated/)).toBeInTheDocument();
  });

  it("warns if the orders feed rejects the write", async () => {
    addDoc.mockRejectedValue(new Error("permission-denied"));
    setup();
    await fillAndSend();
    expect(await screen.findByText(/Email sent to buyer@example\.com, but the public orders feed couldn't be updated/)).toBeInTheDocument();
  });

  it("shows plain success when the feed is updated", async () => {
    addDoc.mockResolvedValue({ id: "doc1" });
    setup();
    await fillAndSend();
    expect(await screen.findByText("Email sent to buyer@example.com")).toBeInTheDocument();
    await act(() => Promise.resolve());
    expect(screen.queryByText(/orders feed/)).not.toBeInTheDocument();
  });

  it("shows the server's error and skips the feed when the email fails", async () => {
    addDoc.mockResolvedValue({});
    setup({ deliveryError: "Email isn't configured on the server (SMTP settings missing)." });
    await fillAndSend();
    expect(await screen.findByText(/SMTP settings missing/)).toBeInTheDocument();
    expect(addDoc).not.toHaveBeenCalled();
  });
});
