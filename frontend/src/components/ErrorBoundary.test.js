import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ErrorBoundary from "./ErrorBoundary";

function Boom({ explode }) {
  if (explode) throw new Error("render failed");
  return <p>Page content</p>;
}

const renderWithKey = (resetKey, explode) => (
  <MemoryRouter>
    <ErrorBoundary resetKey={resetKey}>
      <Boom explode={explode} />
    </ErrorBoundary>
  </MemoryRouter>
);

beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

it("shows a recoverable message instead of a blank page", () => {
  render(renderWithKey("/product/1", true));
  expect(screen.getByText("Something went wrong on this page")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Reload page" })).toBeInTheDocument();
});

it("recovers when the shopper navigates to another page", () => {
  const { rerender } = render(renderWithKey("/product/1", true));
  rerender(renderWithKey("/about", false));
  expect(screen.getByText("Page content")).toBeInTheDocument();
});

it("renders the page normally when nothing fails", () => {
  render(renderWithKey("/", false));
  expect(screen.getByText("Page content")).toBeInTheDocument();
});
