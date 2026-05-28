import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { setSession } from "@/lib/auth";
import {
  authenticateLoginApi,
  INVALID_LOGIN_ERROR,
  normalizeLoginUsername,
} from "@/lib/login-auth-service";
import {
  DEFAULT_LOGIN_HIGHLIGHTS,
  FormField,
  LoginBrandHeader,
  LoginContentGrid,
  LoginFormCard,
  LoginFormIntro,
  LoginMarketingSection,
  LoginPageLayout,
  LoginSubmitButton,
  LoginValidationMessage,
  PasswordInputControl,
  TextInputControl,
} from "@/components/login/login-page-sections";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Flight Deck" },
      { name: "description", content: "Sign in to Flight Deck." },
    ],
  }),
  component: LoginPage,
});

export function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loginStudyId = "login";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      setError("Username and password are required.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const apiResult = await authenticateLoginApi({
        username: trimmedUsername,
        password,
        studyId: loginStudyId,
      });

      if (!apiResult.success) {
        setError(apiResult.message || INVALID_LOGIN_ERROR);
        return;
      }

      setSession({
        username: apiResult.username ?? normalizeLoginUsername(trimmedUsername),
        role: apiResult.role ?? "VIEWER",
      });
      navigate({ to: "/home" });
      return;
    } catch {
      setError("Unable to sign in right now. Please try again shortly.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <LoginPageLayout>
      <LoginBrandHeader />

      <LoginContentGrid
        left={<LoginMarketingSection highlights={DEFAULT_LOGIN_HIGHLIGHTS} />}
        right={(
          <LoginFormCard>
            <LoginFormIntro />

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <FormField htmlFor="username" label="Username">
                <TextInputControl
                  id="username"
                  autoComplete="username"
                  value={username}
                  onChange={setUsername}
                  placeholder="Enter your username"
                />
              </FormField>

              <FormField htmlFor="password" label="Password">
                <PasswordInputControl
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={setPassword}
                  showPassword={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                  placeholder="••••••••"
                />
              </FormField>

              <LoginValidationMessage message={error} />

              <LoginSubmitButton isLoading={isSubmitting} />
            </form>
          </LoginFormCard>
        )}
      />
    </LoginPageLayout>
  );
}
