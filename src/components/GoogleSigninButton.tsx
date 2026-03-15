import { useEffect, useRef } from "react";

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleAccountsId = {
  initialize(input: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }): void;
  renderButton(
    parent: HTMLElement,
    options: {
      type?: "standard" | "icon";
      theme?: "outline" | "filled_blue" | "filled_black";
      text?: "signin_with" | "signup_with" | "continue_with" | "signin";
      shape?: "rectangular" | "pill" | "circle" | "square";
      size?: "large" | "medium" | "small";
      width?: string;
    }
  ): void;
};

type GoogleNamespace = {
  accounts: {
    id: GoogleAccountsId;
  };
};

declare global {
  interface Window {
    google?: GoogleNamespace;
  }
}

type GoogleSigninButtonProps = {
  clientId: string;
  onCredential: (credential: string) => void;
  onError: (message: string) => void;
};

export function GoogleSigninButton({
  clientId,
  onCredential,
  onError,
}: GoogleSigninButtonProps) {
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!clientId) {
      onError("VITE_GOOGLE_CLIENT_ID is missing. Add it in DailySales_FE/.env");
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (!window.google || !googleButtonRef.current) {
        onError("Google sign-in SDK failed to load");
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (!response.credential) {
            onError("Google did not return a credential token");
            return;
          }

          onCredential(response.credential);
        },
      });

      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: "standard",
        theme: "filled_black",
        text: "continue_with",
        shape: "pill",
        size: "large",
        width: "320",
      });
    };

    script.onerror = () => {
      onError("Failed to load Google sign-in SDK");
    };

    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, [clientId, onCredential, onError]);

  return <div ref={googleButtonRef} className="inline-block" />;
}
