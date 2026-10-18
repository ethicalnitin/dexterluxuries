import React from "react";
import { LuCompass } from "react-icons/lu";
import { Button, Container, StatusMessage } from "../components/ui";

// Shown for any URL that doesn't match a route in App.js.
const NotFound = () => (
  <Container>
    <StatusMessage
      icon={<LuCompass />}
      title="Page not found"
      text="The page you're looking for doesn't exist or has moved."
      action={
        <Button to="/" variant="primary">
          Back to the store
        </Button>
      }
    />
  </Container>
);

export default NotFound;
