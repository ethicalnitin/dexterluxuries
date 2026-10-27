import React from "react";
import { LuLock, LuShieldAlert } from "react-icons/lu";
import { useAuth } from "../pages/AuthContext";
import { Button, Container, StatusMessage } from "./ui";

export default function RequireAuth({ role, children }) {
  const { isReady, isAuthenticated, user, openLogin } = useAuth();

  if (!isReady) {
    return (
      <Container narrow>
        <StatusMessage loading title="Checking your session…" />
      </Container>
    );
  }

  if (!isAuthenticated) {
    return (
      <Container narrow>
        <StatusMessage
          icon={<LuLock />}
          title="Log in to continue"
          text="This page is only available to signed-in accounts."
          action={
            <Button variant="primary" onClick={openLogin}>
              Log in
            </Button>
          }
        />
      </Container>
    );
  }

  if (role && user?.role !== role) {
    return (
      <Container narrow>
        <StatusMessage
          icon={<LuShieldAlert />}
          title="You don't have access to this page"
          text={`You're signed in as ${user?.email}, which doesn't have permission to view it.`}
          action={
            <Button to="/" variant="secondary">
              Back to the store
            </Button>
          }
        />
      </Container>
    );
  }

  return children;
}
