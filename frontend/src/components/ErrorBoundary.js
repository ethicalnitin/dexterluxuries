import React from "react";
import { LuAlertTriangle } from "react-icons/lu";
import { Button, Container, StatusMessage } from "./ui";

export default class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] page crashed:", error, info.componentStack);
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <Container narrow>
        <StatusMessage
          icon={<LuAlertTriangle />}
          title="Something went wrong on this page"
          text="Please reload the page. If it keeps happening, message us on WhatsApp."
          action={
            <Button variant="primary" onClick={() => window.location.reload()}>
              Reload page
            </Button>
          }
        />
      </Container>
    );
  }
}
