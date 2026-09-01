declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: () => void) => void;
      close: () => void;
    };
    google: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (parent: HTMLElement, options: {
            theme?: string;
            size?: string;
            width?: number;
            text?: string;
            shape?: string;
            logo_alignment?: string;
          }) => void;
          prompt: (callback?: () => void) => void;
        };
      };
    };
  }
}

export {};
