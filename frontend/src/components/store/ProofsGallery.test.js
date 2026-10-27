import { render, screen, fireEvent } from "@testing-library/react";
import ProofsGallery from "./ProofsGallery";

const proofs = Array.from({ length: 6 }, (_, i) => ({ id: i + 1, url: `https://img.example/${i + 1}.jpg`, label: `Proof ${i + 1}` }));

describe("ProofsGallery", () => {
  it("previews five proofs and can show the rest", () => {
    render(<ProofsGallery proofs={proofs} hidden={false} onToggleHidden={() => {}} />);
    expect(screen.getAllByRole("button", { name: /larger$/ })).toHaveLength(5);
    fireEvent.click(screen.getByRole("button", { name: "Show all 6 proofs" }));
    expect(screen.getAllByRole("button", { name: /larger$/ })).toHaveLength(6);
  });

  it("opens a lightbox that the keyboard can page through and close", () => {
    render(<ProofsGallery proofs={proofs} hidden={false} onToggleHidden={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "View Proof 1 larger" }));
    expect(screen.getByRole("dialog", { name: "Proof image" })).toHaveTextContent("1 / 6");

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByRole("dialog")).toHaveTextContent("2 / 6");
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(screen.getByRole("dialog")).toHaveTextContent("6 / 6");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("lets the parent hide and show the proofs", () => {
    const onToggleHidden = jest.fn();
    const { rerender } = render(<ProofsGallery proofs={proofs} hidden onToggleHidden={onToggleHidden} />);
    expect(screen.queryByRole("button", { name: /larger$/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show proofs" }));
    expect(onToggleHidden).toHaveBeenCalled();

    rerender(<ProofsGallery proofs={proofs} hidden={false} onToggleHidden={onToggleHidden} />);
    expect(screen.getAllByRole("button", { name: /larger$/ })).toHaveLength(5);
  });
});
